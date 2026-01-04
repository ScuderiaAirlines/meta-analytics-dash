import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';
import { toISTStartOfDay, toISTEndOfDay, nowIST, getDaysElapsedIST } from '../utils/timezone';
import {
  aggregateMetrics,
  calculateDeltas,
  calculateBudgetPacing,
  calculateFunnel,
} from '../utils/mathEngine';

const router = Router();

/**
 * GET /api/analytics/overview
 * Get performance overview with comparison to previous period
 */
router.get(
  '/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, previousStart, previousEnd } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);

    // Get current period metrics
    const currentMetrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Use centralized math engine for all calculations
    const currentAgg = aggregateMetrics(currentMetrics);

    const currentData = {
      totalSpend: currentAgg.totalSpend,
      totalConversions: currentAgg.totalConversions,
      avgROAS: currentAgg.avgROAS,
      avgCPM: currentAgg.avgCPM,
      totalClicks: currentAgg.totalClicks,
      totalImpressions: currentAgg.totalImpressions,
      avgCTR: currentAgg.avgCTR,
    };

    // Get previous period metrics if dates provided
    let previousData = null;
    let delta = null;

    if (previousStart && previousEnd) {
      const prevStart = toISTStartOfDay(previousStart as string);
      const prevEnd = toISTEndOfDay(previousEnd as string);

      const previousMetrics = await prisma.dailyMetric.findMany({
        where: {
          date: {
            gte: prevStart,
            lte: prevEnd,
          },
        },
      });

      // Use centralized math engine
      const previousAgg = aggregateMetrics(previousMetrics);

      previousData = {
        totalSpend: previousAgg.totalSpend,
        totalConversions: previousAgg.totalConversions,
        avgROAS: previousAgg.avgROAS,
        avgCPM: previousAgg.avgCPM,
      };

      // Calculate deltas using centralized function
      const allDeltas = calculateDeltas(currentAgg, previousAgg);
      delta = {
        spend: allDeltas.spend,
        conversions: allDeltas.conversions,
        roas: allDeltas.roas,
        cpm: allDeltas.cpm,
      };
    }

    res.json({
      success: true,
      data: {
        current: currentData,
        previous: previousData,
        delta,
      },
    });
  })
);

/**
 * GET /api/analytics/budget-pacing
 * Get budget pacing information
 */
router.get(
  '/budget-pacing',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);
    const now = nowIST();

    // Calculate period length in IST
    const totalDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1);

    // Calculate elapsed days in IST (capped at totalDays)
    const daysElapsed = getDaysElapsedIST(start, end);

    const timeElapsedPercent = (daysElapsed / totalDays) * 100;

    // Get all active campaigns to sum budgets
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    const totalDailyBudget = campaigns.reduce((sum, c) => sum + (c.dailyBudget || 0), 0);
    const totalBudget = totalDailyBudget * totalDays;

    // Get total spend in period
    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalSpent = metrics.reduce((sum, m) => sum + m.spend, 0);

    // Use centralized budget pacing calculation
    const pacing = calculateBudgetPacing(totalBudget, totalSpent, daysElapsed, totalDays);

    res.json({
      success: true,
      data: {
        ...pacing,
        dailyBurnRate: daysElapsed > 0 ? totalSpent / daysElapsed : 0,
        daysRemaining: Math.max(totalDays - daysElapsed, 0),
        totalDays,
        daysElapsed,
        timeElapsed: pacing.timeElapsedPercent,
      },
    });
  })
);

/**
 * GET /api/analytics/campaigns
 * Get campaign performance with aggregated metrics
 */
router.get(
  '/campaigns',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, status } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);

    // Get all campaigns
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get metrics for each campaign
    const campaignData = await Promise.all(
      campaigns.map(async (campaign) => {
        const metrics = await prisma.dailyMetric.findMany({
          where: {
            entityId: campaign.campaignId,
            entityType: 'campaign',
            date: {
              gte: start,
              lte: end,
            },
          },
        });

        // Use centralized math engine
        const agg = aggregateMetrics(metrics);

        return {
          campaignId: campaign.campaignId,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          spend: agg.totalSpend,
          conversions: agg.totalConversions,
          clicks: agg.totalClicks,
          impressions: agg.totalImpressions,
          roas: agg.avgROAS,
          ctr: agg.avgCTR,
        };
      })
    );

    // Sort by spend descending
    campaignData.sort((a, b) => b.spend - a.spend);

    res.json({
      success: true,
      data: campaignData,
    });
  })
);

/**
 * GET /api/analytics/trends
 * Get daily performance trends
 */
router.get(
  '/trends',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);

    // Get all metrics in date range
    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, any>();

    metrics.forEach((m) => {
      const dateKey = m.date.toISOString().split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          spend: 0,
          conversions: 0,
          clicks: 0,
          impressions: 0,
          roasWeightedSum: 0,
          count: 0,
        });
      }

      const entry = dateMap.get(dateKey);
      entry.spend += m.spend;
      entry.conversions += m.conversions;
      entry.clicks += m.clicks;
      entry.impressions += m.impressions;
      entry.roasWeightedSum += (m.roas * m.spend);
      entry.count += 1;
    });

    // Convert to array and calculate averages
    const trends = Array.from(dateMap.values()).map((entry) => ({
      date: entry.date,
      spend: entry.spend,
      conversions: entry.conversions,
      clicks: entry.clicks,
      impressions: entry.impressions,
      roas: entry.spend > 0 ? entry.roasWeightedSum / entry.spend : 0,
      ctr: entry.impressions > 0 ? (entry.clicks / entry.impressions) * 100 : 0,
    }));

    res.json({
      success: true,
      data: trends,
    });
  })
);

/**
 * GET /api/analytics/funnel
 * Get conversion funnel metrics
 */
router.get(
  '/funnel',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    // Use centralized math engine
    const agg = aggregateMetrics(metrics);
    const funnel = calculateFunnel(agg.totalImpressions, agg.totalClicks, agg.totalConversions);

    res.json({
      success: true,
      data: {
        impressions: agg.totalImpressions,
        clicks: agg.totalClicks,
        conversions: agg.totalConversions,
        ctr: agg.avgCTR,
        cvr: agg.avgCVR,
        funnel: funnel.stages,
      },
    });
  })
);

/**
 * GET /api/analytics/top-creatives
 * Get top performing creatives
 */
router.get(
  '/top-creatives',
  asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, limit = '10' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'startDate and endDate are required' },
      });
    }

    // Parse dates with IST timezone handling
    const start = toISTStartOfDay(startDate as string);
    const end = toISTEndOfDay(endDate as string);

    // Get all ads
    const ads = await prisma.ad.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    // Get metrics for each ad
    const adData = await Promise.all(
      ads.map(async (ad) => {
        const metrics = await prisma.dailyMetric.findMany({
          where: {
            entityId: ad.adId,
            entityType: 'ad',
            date: {
              gte: start,
              lte: end,
            },
          },
        });

        // Use centralized math engine
        const agg = aggregateMetrics(metrics);

        // Get AI analysis if exists
        const analysis = await prisma.creativeAnalysis.findFirst({
          where: { adId: ad.adId },
          orderBy: { analyzedAt: 'desc' },
        });

        return {
          adId: ad.adId,
          name: ad.name,
          thumbnailUrl: ad.thumbnailUrl,
          conversions: agg.totalConversions,
          spend: agg.totalSpend,
          roas: agg.avgROAS,
          aiScore: analysis?.predictedScore || null,
        };
      })
    );

    // Sort by conversions and take top N
    adData.sort((a, b) => b.conversions - a.conversions);
    const topCreatives = adData.slice(0, parseInt(limit as string));

    res.json({
      success: true,
      data: topCreatives,
    });
  })
);

export default router;
