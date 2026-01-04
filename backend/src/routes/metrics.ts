import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';
import { toISTStartOfDay, toISTEndOfDay } from '../utils/timezone';

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
        where.date.gte = toISTStartOfDay(startDate as string);
      }
      if (endDate) {
        where.date.lte = toISTEndOfDay(endDate as string);
      }
    }

    const metrics = await prisma.dailyMetric.findMany({
      where,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      orderBy: { date: 'desc' },
    });

    const total = await prisma.dailyMetric.count({ where });

    // Calculate aggregates with weighted ROAS
    const aggregates = metrics.reduce(
      (acc, metric) => ({
        totalSpend: acc.totalSpend + metric.spend,
        totalImpressions: acc.totalImpressions + metric.impressions,
        totalClicks: acc.totalClicks + metric.clicks,
        totalConversions: acc.totalConversions + metric.conversions,
        roasWeightedSum: acc.roasWeightedSum + (metric.roas * metric.spend),
      }),
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        roasWeightedSum: 0,
      }
    );

    // Calculate proper averages from totals (not simple averages!)
    const avgCtr = aggregates.totalImpressions > 0
      ? (aggregates.totalClicks / aggregates.totalImpressions) * 100
      : 0;
    const avgCpc = aggregates.totalClicks > 0
      ? aggregates.totalSpend / aggregates.totalClicks
      : 0;
    const avgRoas = aggregates.totalSpend > 0
      ? aggregates.roasWeightedSum / aggregates.totalSpend
      : 0;
    const avgCpm = aggregates.totalImpressions > 0
      ? (aggregates.totalSpend / aggregates.totalImpressions) * 1000
      : 0;
    const avgCvr = aggregates.totalClicks > 0
      ? (aggregates.totalConversions / aggregates.totalClicks) * 100
      : 0;

    res.json({
      success: true,
      data: metrics,
      aggregates: {
        totalSpend: aggregates.totalSpend,
        totalImpressions: aggregates.totalImpressions,
        totalClicks: aggregates.totalClicks,
        totalConversions: aggregates.totalConversions,
        avgCtr,
        avgCpc,
        avgRoas,
        avgCpm,
        avgCvr,
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
