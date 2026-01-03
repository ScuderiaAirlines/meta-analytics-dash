import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';

const router = Router();

/**
 * GET /api/adsets/:id
 * Get ad set details with ads and metrics
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const adset = await prisma.adSet.findUnique({
      where: { adsetId: id },
    });

    if (!adset) {
      return res.status(404).json({
        success: false,
        error: { message: 'Ad set not found' },
      });
    }

    // Get ads for this ad set
    const ads = await prisma.ad.findMany({
      where: { adsetId: id },
    });

    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        entityId: id,
        entityType: 'adset',
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: {
        adset,
        ads,
        metrics,
      },
    });
  })
);

export default router;
