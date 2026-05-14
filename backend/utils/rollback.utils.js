/**
 * @file rollback.utils.js
 * @description Utility module for managing rollback (compensating) operations
 * during distributed user registration. This implements a simple LIFO rollback
 * stack so that, if a multi-system registration step fails (MongoDB, Stripe,
 * Firebase, etc.), previously completed steps can be undone in reverse order.
 *
 * Phase 2 uses this as the core primitive for the user registration
 * orchestrator to keep Firebase, MongoDB, and Stripe in a consistent state.
 */

/**
 * @class RollbackStack
 * @classdesc
 * Manages a stack of rollback operations (compensating transactions).
 *
 * Each operation is pushed with a descriptive name and an async function. When
 * `executeAll()` is called, the stack is unwound in reverse order (LIFO),
 * attempting to run all rollback functions even if some fail.
 */
export class RollbackStack {
  constructor() {
    /**
     * @private
     * @type {{ name: string, rollbackFn: () => Promise<void> }[]}
     */
    this.operations = [];
  }

  /**
   * Add a rollback operation to the stack.
   *
   * @param {string} name - Human-readable operation name for logging.
   * @param {() => Promise<void>} rollbackFn - Async function that performs the rollback.
   * @returns {void}
   */
  push(name, rollbackFn) {
    this.operations.push({ name, rollbackFn });
  }

  /**
   * Execute all rollback operations in reverse order (LIFO).
   *
   * This method attempts every rollback even if some fail. It collects results
   * so callers can inspect which compensations succeeded or failed.
   *
   * @returns {Promise<Array<{name: string, success: boolean, error?: string}>>}
   */
  async executeAll() {
    const results = [];

    // Execute in reverse order (last in, first out)
    for (let i = this.operations.length - 1; i >= 0; i -= 1) {
      const { name, rollbackFn } = this.operations[i];

      try {
        console.log(`🔄 (RollbackStack) Executing rollback: ${name}`);
        await rollbackFn();
        results.push({ name, success: true });
        console.log(`✅ (RollbackStack) Rollback successful: ${name}`);
      } catch (error) {
        console.error(`❌ (RollbackStack) Rollback failed: ${name}`, error);
        results.push({ name, success: false, error: error?.message || String(error) });
        // Continue with remaining rollbacks even if one fails
      }
    }

    return results;
  }

  /**
   * Clear all queued rollback operations.
   *
   * @returns {void}
   */
  clear() {
    this.operations = [];
  }

  /**
   * Get the current number of rollback operations in the stack.
   *
   * @returns {number}
   */
  size() {
    return this.operations.length;
  }
}

/**
 * Convenience helper to execute rollbacks for a given stack instance.
 *
 * This is mainly for readability at call sites (e.g. orchestrator) and makes
 * it easy to swap implementations if needed.
 *
 * @param {RollbackStack} stack - The rollback stack to execute.
 * @returns {Promise<Array<{name: string, success: boolean, error?: string}>>}
 */
export const executeRollbacks = async (stack) => {
  if (!stack) {
    return [];
  }
  return stack.executeAll();
};
