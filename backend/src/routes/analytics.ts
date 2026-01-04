import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../utils/middleware';
import { toISTStartOfDay, toISTEndOfDay, nowIST, getDaysElapsedIST } from '../utils/timezone';

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

    // Calculate current period totals with weighted ROAS
    const current = currentMetrics.reduce(
      (acc, m) => ({
        totalSpend: acc.totalSpend + m.spend,
        totalConversions: acc.totalConversions + m.conversions,
        totalClicks: acc.totalClicks + m.clicks,
        totalImpressions: acc.totalImpressions + m.impressions,
        roasWeightedSum: acc.roasWeightedSum + (m.roas * m.spend), // Weighted by spend
        cpmSum: acc.cpmSum + (m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0),
        metricsWithSpend: acc.metricsWithSpend + (m.spend > 0 ? 1 : 0),
      }),
      {
        totalSpend: 0,
        totalConversions: 0,
        totalClicks: 0,
        totalImpressions: 0,
        roasWeightedSum: 0,
        cpmSum: 0,
        metricsWithSpend: 0,
      }
    );

    const currentData = {
      totalSpend: current.totalSpend,
      totalConversions: current.totalConversions,
      // Weighted average ROAS (weighted by spend) - more accurate
      avgROAS: current.totalSpend > 0 ? current.roasWeightedSum / current.totalSpend : 0,
      avgCPM: current.metricsWithSpend > 0 ? current.cpmSum / current.metricsWithSpend : 0,
      totalClicks: current.totalClicks,
      totalImpressions: current.totalImpressions,
      avgCTR:
        current.totalImpressions > 0
          ? (current.totalClicks / current.totalImpressions) * 100
          : 0,
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

      const previous = previousMetrics.reduce(
        (acc, m) => ({
          totalSpend: acc.totalSpend + m.spend,
          totalConversions: acc.totalConversions + m.conversions,
          totalClicks: acc.totalClicks + m.clicks,
          totalImpressions: acc.totalImpressions + m.impressions,
          roasWeightedSum: acc.roasWeightedSum + (m.roas * m.spend),
          cpmSum: acc.cpmSum + (m.impressions > 0 ? (m.spend / m.impressions) * 1000 : 0),
          metricsWithSpend: acc.metricsWithSpend + (m.spend > 0 ? 1 : 0),
        }),
        {
          totalSpend: 0,
          totalConversions: 0,
          totalClicks: 0,
          totalImpressions: 0,
          roasWeightedSum: 0,
          cpmSum: 0,
          metricsWithSpend: 0,
        }
      );

      previousData = {
        totalSpend: previous.totalSpend,
        totalConversions: previous.totalConversions,
        avgROAS: previous.totalSpend > 0 ? previous.roasWeightedSum / previous.totalSpend : 0,
        avgCPM: previous.metricsWithSpend > 0 ? previous.cpmSum / previous.metricsWithSpend : 0,
      };

      // Calculate deltas - handle edge cases
      delta = {
        spend:
          previousData.totalSpend > 0
            ? (currentData.totalSpend - previousData.totalSpend) / previousData.totalSpend
            : currentData.totalSpend > 0 ? 1 : 0,
        conversions:
          previousData.totalConversions > 0
            ? (currentData.totalConversions - previousData.totalConversions) /
              previousData.totalConversions
            : currentData.totalConversions > 0 ? 1 : 0,
        roas:
          previousData.avgROAS > 0
            ? (currentData.avgROAS - previousData.avgROAS) / previousData.avgROAS
            : currentData.avgROAS > 0 ? 1 : 0,
        cpm:
          previousData.avgCPM > 0
            ? (currentData.avgCPM - previousData.avgCPM) / previousData.avgCPM
            : currentData.avgCPM > 0 ? 1 : 0,
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
    const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate pacing - FIXED LOGIC
    const pacingDelta = spentPercent - timeElapsedPercent;
    // If spending faster than time passing = ahead
    // If spending slower than time passing = behind
    const pacingStatus =
      Math.abs(pacingDelta) < 5 ? 'on-track' :
      pacingDelta > 0 ? 'ahead' : 'behind';

    // Project final spend based on current burn rate
    const dailyBurnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    const projected = dailyBurnRate * totalDays;
    const daysRemaining = Math.max(totalDays - daysElapsed, 0);

    res.json({
      success: true,
      data: {
        totalBudget,
        spent: totalSpent,
        spentPercent,
        timeElapsed: timeElapsedPercent,
        pacingStatus,
        pacingDelta,
        projected,
        dailyBurnRate,
        daysRemaining,
        totalDays,
        daysElapsed,
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

        const totals = metrics.reduce(
          (acc, m) => ({
            spend: acc.spend + m.spend,
            conversions: acc.conversions + m.conversions,
            clicks: acc.clicks + m.clicks,
            impressions: acc.impressions + m.impressions,
            roasWeightedSum: acc.roasWeightedSum + (m.roas * m.spend),
            ctrSum: acc.ctrSum + m.ctr,
            count: acc.count + 1,
          }),
          {
            spend: 0,
            conversions: 0,
            clicks: 0,
            impressions: 0,
            roasWeightedSum: 0,
            ctrSum: 0,
            count: 0,
          }
        );

        return {
          campaignId: campaign.campaignId,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          spend: totals.spend,
          conversions: totals.conversions,
          clicks: totals.clicks,
          impressions: totals.impressions,
          roas: totals.spend > 0 ? totals.roasWeightedSum / totals.spend : 0,
          ctr: totals.count > 0 ? totals.ctrSum / totals.count : 0,
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

    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        conversions: acc.conversions + m.conversions,
      }),
      { impressions: 0, clicks: 0, conversions: 0 }
    );

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

    res.json({
      success: true,
      data: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        conversions: totals.conversions,
        ctr,
        cvr,
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

        const totals = metrics.reduce(
          (acc, m) => ({
            conversions: acc.conversions + m.conversions,
            spend: acc.spend + m.spend,
            roasWeightedSum: acc.roasWeightedSum + (m.roas * m.spend),
          }),
          { conversions: 0, spend: 0, roasWeightedSum: 0 }
        );

        // Get AI analysis if exists
        const analysis = await prisma.creativeAnalysis.findFirst({
          where: { adId: ad.adId },
          orderBy: { analyzedAt: 'desc' },
        });

        return {
          adId: ad.adId,
          name: ad.name,
          thumbnailUrl: ad.thumbnailUrl,
          conversions: totals.conversions,
          spend: totals.spend,
          roas: totals.spend > 0 ? totals.roasWeightedSum / totals.spend : 0,
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
