import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';
import { toISTStartOfDay, toISTEndOfDay } from '../utils/timezone';
import { aggregateMetrics } from '../utils/mathEngine';

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

    // Use centralized math engine for all calculations
    const aggregated = aggregateMetrics(metrics);

    res.json({
      success: true,
      data: metrics,
      aggregates: {
        totalSpend: aggregated.totalSpend,
        totalImpressions: aggregated.totalImpressions,
        totalClicks: aggregated.totalClicks,
        totalConversions: aggregated.totalConversions,
        totalRevenue: aggregated.totalRevenue,
        avgCtr: aggregated.avgCTR,
        avgCpc: aggregated.avgCPC,
        avgRoas: aggregated.avgROAS,
        avgCpm: aggregated.avgCPM,
        avgCvr: aggregated.avgCVR,
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
