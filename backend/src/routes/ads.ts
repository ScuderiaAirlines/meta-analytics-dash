import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';

const router = Router();

/**
 * GET /api/ads/:id
 * Get ad details with metrics
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const ad = await prisma.ad.findUnique({
      where: { adId: id },
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        error: { message: 'Ad not found' },
      });
    }

    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        entityId: id,
        entityType: 'ad',
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    // Check if creative analysis exists
    const creativeAnalysis = await prisma.creativeAnalysis.findFirst({
      where: { adId: id },
      orderBy: { analyzedAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        ad,
        metrics,
        creativeAnalysis,
      },
    });
  })
);

export default router;
