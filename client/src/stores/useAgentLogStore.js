/**
 * @file useAgentLogStore.js
 * @description Zustand store for managing real-time agent status logs.
 */

import { create } from 'zustand';

/**
 * @typedef {Object} AgentLog
 * @property {string} id - A stable, unique ID for the log entry (e.g., 'routing', 'generation').
 * @property {string} phase - The human-readable name of the agent phase (e.g., 'Analyzing Request').
 * @property {'in_progress' | 'completed' | 'error'} status - The current status of the phase.
 * @property {string} [summary] - An optional summary of the result or current action.
 * @property {string} icon - The name of the Lucide icon to display.
 */

export const useAgentLogStore = create((set) => ({
  /** @type {AgentLog[]} */
  logs: [],

  /**
   * Adds a new log entry or updates an existing one based on its ID.
   * @param {AgentLog} logEntry - The log entry to add or update.
   */
  addOrUpdateLog: (logEntry) =>
    set((state) => {
      const existingIndex = state.logs.findIndex((log) => log.id === logEntry.id);
      const newLogs = [...state.logs];

      if (existingIndex !== -1) {
        // Update existing log
        newLogs[existingIndex] = { ...newLogs[existingIndex], ...logEntry };
      } else {
        // Add new log
        newLogs.push(logEntry);
      }
      return { logs: newLogs };
    }),

  /**
   * Clears all logs from the store.
   */
  clearLogs: () => set({ logs: [] }),
}));
