import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';

const router = Router();

/**
 * GET /api/ads
 * List all ads with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { campaignId, adsetId, status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (campaignId) {
      where.campaignId = campaignId;
    }
    if (adsetId) {
      where.adsetId = adsetId;
    }
    if (status) {
      where.status = status;
    }

    const ads = await prisma.ad.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.ad.count({ where });

    res.json({
      success: true,
      data: ads,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

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
