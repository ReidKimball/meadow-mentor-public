import express from 'express';
import UserHealth from '../models/userHealth.model.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route PATCH /api/user-health/session-context
 * @desc Update the user's ephemeral session context (energy, stress)
 */
router.patch('/session-context', verifyFirebaseToken, async (req, res) => {
  try {
    const { energyLevel, stressMode } = req.body;
    const firebaseUID = req.user.uid;
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

    const update = {
      $set: {
        'sessionContext.energyLevel': energyLevel || null,
        'sessionContext.stressMode': stressMode ?? null,
        'sessionContext.source': 'ui_slider',
        'sessionContext.updatedAt': now,
        'sessionContext.expiresAt': expiresAt,
      }
    };

    const health = await UserHealth.findOneAndUpdate(
      { firebaseUID },
      update,
      { new: true, upsert: true }
    ).lean();

    res.json({ 
      success: true, 
      sessionContext: health.sessionContext 
    });
  } catch (error) {
    console.error('[API: session-context] PATCH error:', error);
    res.status(500).json({ error: 'Failed to update session context' });
  }
});

/**
 * @route GET /api/user-health/session-context
 * @desc Fetch current session context
 */
router.get('/session-context', verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const health = await UserHealth.findOne({ firebaseUID }).lean();
    
    if (!health || !health.sessionContext) {
      return res.json({ sessionContext: null });
    }

    const { sessionContext } = health;
    const isExpired = sessionContext.expiresAt && new Date(sessionContext.expiresAt) < new Date();

    res.json({
      sessionContext: isExpired ? null : sessionContext,
      isExpired
    });
  } catch (error) {
    console.error('[API: session-context] GET error:', error);
    res.status(500).json({ error: 'Failed to fetch session context' });
  }
});

export default router;
