import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';
import Logger from '../utils/logger';

const router = Router();

/**
 * GET /api/campaigns
 * List all campaigns with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.campaign.count({ where });

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

/**
 * GET /api/campaigns/:id
 * Get campaign details with ad sets and metrics
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { campaignId: id },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: { message: 'Campaign not found' },
      });
    }

    // Get ad sets for this campaign
    const adsets = await prisma.adSet.findMany({
      where: { campaignId: id },
    });

    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        entityId: id,
        entityType: 'campaign',
        date: { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary stats
    const summary = metrics.reduce(
      (acc, metric) => ({
        totalSpend: acc.totalSpend + metric.spend,
        totalImpressions: acc.totalImpressions + metric.impressions,
        totalClicks: acc.totalClicks + metric.clicks,
        totalConversions: acc.totalConversions + metric.conversions,
      }),
      { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 }
    );

    res.json({
      success: true,
      data: {
        campaign,
        adsets,
        metrics,
        summary,
      },
    });
  })
);

export default router;
