import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';

const router = Router();

/**
 * GET /api/metrics
 * Query metrics with filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      entityId,
      entityType,
      startDate,
      endDate,
      limit = '100',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (entityId) {
      where.entityId = entityId;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string);
      }
    }

    const metrics = await prisma.dailyMetric.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { date: 'desc' },
    });

    const total = await prisma.dailyMetric.count({ where });

    // Calculate aggregates
    const aggregates = metrics.reduce(
      (acc, metric) => ({
        totalSpend: acc.totalSpend + metric.spend,
        totalImpressions: acc.totalImpressions + metric.impressions,
        totalClicks: acc.totalClicks + metric.clicks,
        totalConversions: acc.totalConversions + metric.conversions,
      }),
      { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 }
    );

    // Calculate averages
    const avgCtr = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
      : 0;
    const avgCpc = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length
      : 0;
    const avgRoas = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length
      : 0;

    res.json({
      success: true,
      data: metrics,
      aggregates: {
        ...aggregates,
        avgCtr,
        avgCpc,
        avgRoas,
      },
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  })
);

export default router;
