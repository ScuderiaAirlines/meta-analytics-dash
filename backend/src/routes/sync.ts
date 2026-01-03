import { Router, Request, Response } from 'express';
import { getSyncService } from '../services/syncService';
import { asyncHandler } from '../utils/middleware';
import Logger from '../utils/logger';

const router = Router();

// Track last sync status
let lastSyncResult: any = null;
let syncInProgress = false;

/**
 * POST /api/sync
 * Trigger manual sync from Meta API
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (syncInProgress) {
      return res.status(409).json({
        success: false,
        error: { message: 'Sync already in progress' },
      });
    }

    syncInProgress = true;
    Logger.info('Manual sync triggered');

    try {
      const syncService = getSyncService();
      const result = await syncService.runFullSync();

      lastSyncResult = {
        ...result,
        timestamp: new Date().toISOString(),
      };

      syncInProgress = false;

      res.json({
        success: result.success,
        data: lastSyncResult,
      });
    } catch (error: any) {
      syncInProgress = false;
      Logger.error('Sync failed:', error);

      res.status(500).json({
        success: false,
        error: { message: error.message },
      });
    }
  })
);

/**
 * GET /api/sync/status
 * Get last sync status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      syncInProgress,
      lastSync: lastSyncResult,
    },
  });
});

export default router;
