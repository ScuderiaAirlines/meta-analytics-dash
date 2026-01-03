import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import openRouterClient from '../services/openRouterClient';
import Logger from '../utils/logger';

const router = Router();

/**
 * POST /api/ai/analyze-creative
 * Analyze an ad creative using AI
 */
router.post('/analyze-creative', async (req: Request, res: Response) => {
  try {
    const { adId } = req.body;

    if (!adId) {
      return res.status(400).json({ error: 'adId is required' });
    }

    // Fetch ad details
    const ad = await prisma.ad.findUnique({
      where: { adId },
    });

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    if (!ad.thumbnailUrl) {
      return res.status(400).json({ error: 'Ad has no thumbnail for analysis' });
    }

    Logger.info(`Analyzing creative for ad: ${ad.name}`);

    // Call AI for analysis
    const analysis = await openRouterClient.analyzeCreative(
      ad.thumbnailUrl,
      ad.name
    );

    // Store analysis in database
    const creativeAnalysis = await prisma.creativeAnalysis.create({
      data: {
        adId: ad.adId,
        imageUrl: ad.thumbnailUrl,
        aiAnalysis: analysis,
        predictedScore: analysis.predictedScore,
      },
    });

    Logger.info(`Creative analysis saved: ${creativeAnalysis.id}`);

    res.json({
      success: true,
      analysis: creativeAnalysis,
    });
  } catch (error: any) {
    Logger.error('Error analyzing creative:', error);
    res.status(500).json({
      error: 'Failed to analyze creative',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/creative-analyses/:adId
 * Get all creative analyses for an ad
 */
router.get('/creative-analyses/:adId', async (req: Request, res: Response) => {
  try {
    const { adId } = req.params;

    const analyses = await prisma.creativeAnalysis.findMany({
      where: { adId },
      orderBy: { analyzedAt: 'desc' },
    });

    res.json(analyses);
  } catch (error: any) {
    Logger.error('Error fetching creative analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

/**
 * GET /api/ai/detect-anomalies
 * Detect anomalies in metrics and generate AI explanations
 */
router.get('/detect-anomalies', async (req: Request, res: Response) => {
  try {
    const { days = '7', threshold = '20' } = req.query;

    const daysInt = parseInt(days as string);
    const thresholdInt = parseInt(threshold as string);

    Logger.info(`Detecting anomalies: last ${daysInt} days, threshold ${thresholdInt}%`);

    // Get recent metrics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    });

    if (metrics.length === 0) {
      return res.json({ anomalies: [] });
    }

    // Group by entity to calculate averages
    const entityMetrics = new Map<string, typeof metrics>();

    metrics.forEach((metric) => {
      const key = `${metric.entityType}_${metric.entityId}`;
      if (!entityMetrics.has(key)) {
        entityMetrics.set(key, []);
      }
      entityMetrics.get(key)!.push(metric);
    });

    const anomalies: any[] = [];

    // Detect anomalies for each entity
    for (const [entityKey, entityData] of entityMetrics.entries()) {
      if (entityData.length < 3) continue; // Need at least 3 data points

      const latest = entityData[0];
      const historical = entityData.slice(1);

      // Calculate averages for each metric
      const avgSpend =
        historical.reduce((sum, m) => sum + m.spend, 0) / historical.length;
      const avgCTR =
        historical.reduce((sum, m) => sum + m.ctr, 0) / historical.length;
      const avgCPC =
        historical.reduce((sum, m) => sum + m.cpc, 0) / historical.length;
      const avgROAS =
        historical.reduce((sum, m) => sum + m.roas, 0) / historical.length;

      // Check for anomalies
      const checkAnomaly = (
        metricName: string,
        expected: number,
        actual: number
      ) => {
        if (expected === 0) return;

        const deviation = ((actual - expected) / expected) * 100;

        if (Math.abs(deviation) >= thresholdInt) {
          const severity =
            Math.abs(deviation) >= 50
              ? 'high'
              : Math.abs(deviation) >= 30
              ? 'medium'
              : 'low';

          anomalies.push({
            entityId: latest.entityId,
            entityType: latest.entityType,
            metricName,
            expectedValue: expected,
            actualValue: actual,
            deviationPercent: deviation,
            severity,
            date: latest.date,
          });
        }
      };

      checkAnomaly('spend', avgSpend, latest.spend);
      checkAnomaly('ctr', avgCTR, latest.ctr);
      checkAnomaly('cpc', avgCPC, latest.cpc);
      checkAnomaly('roas', avgROAS, latest.roas);
    }

    // Sort by severity and deviation
    anomalies.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      const severityDiff =
        (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
        (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      if (severityDiff !== 0) return severityDiff;
      return Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent);
    });

    // Limit to top 20 anomalies and generate AI explanations
    const topAnomalies = anomalies.slice(0, 20);

    // Generate AI explanations for top anomalies (limit to avoid API costs)
    const explainLimit = 5;
    for (let i = 0; i < Math.min(explainLimit, topAnomalies.length); i++) {
      const anomaly = topAnomalies[i];

      try {
        // Get entity name
        let entityName = 'Unknown';
        if (anomaly.entityType === 'campaign') {
          const campaign = await prisma.campaign.findUnique({
            where: { campaignId: anomaly.entityId },
          });
          entityName = campaign?.name || entityName;
        } else if (anomaly.entityType === 'adset') {
          const adset = await prisma.adSet.findUnique({
            where: { adsetId: anomaly.entityId },
          });
          entityName = adset?.name || entityName;
        } else if (anomaly.entityType === 'ad') {
          const ad = await prisma.ad.findUnique({
            where: { adId: anomaly.entityId },
          });
          entityName = ad?.name || entityName;
        }

        const explanation = await openRouterClient.explainAnomaly(
          anomaly.entityType,
          entityName,
          anomaly.metricName,
          anomaly.expectedValue,
          anomaly.actualValue,
          anomaly.deviationPercent
        );

        anomaly.aiExplanation = explanation;

        // Save to database
        await prisma.anomaly.create({
          data: {
            entityId: anomaly.entityId,
            entityType: anomaly.entityType,
            metricName: anomaly.metricName,
            expectedValue: anomaly.expectedValue,
            actualValue: anomaly.actualValue,
            deviationPercent: anomaly.deviationPercent,
            severity: anomaly.severity,
            aiExplanation: explanation,
          },
        });
      } catch (error) {
        Logger.error(`Failed to generate explanation for anomaly ${i}:`, error);
        anomaly.aiExplanation = 'AI explanation unavailable';
      }
    }

    Logger.info(`Detected ${topAnomalies.length} anomalies`);

    res.json({
      anomalies: topAnomalies,
      total: anomalies.length,
      explained: Math.min(explainLimit, topAnomalies.length),
    });
  } catch (error: any) {
    Logger.error('Error detecting anomalies:', error);
    res.status(500).json({
      error: 'Failed to detect anomalies',
      message: error.message,
    });
  }
});

/**
 * GET /api/ai/anomalies
 * Get all stored anomalies
 */
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const { resolved = 'false', limit = '50' } = req.query;

    const anomalies = await prisma.anomaly.findMany({
      where: {
        resolved: resolved === 'true',
      },
      orderBy: { detectedAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(anomalies);
  } catch (error: any) {
    Logger.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

/**
 * PATCH /api/ai/anomalies/:id/resolve
 * Mark an anomaly as resolved
 */
router.patch('/anomalies/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const anomaly = await prisma.anomaly.update({
      where: { id },
      data: { resolved: true },
    });

    res.json(anomaly);
  } catch (error: any) {
    Logger.error('Error resolving anomaly:', error);
    res.status(500).json({ error: 'Failed to resolve anomaly' });
  }
});

/**
 * GET /api/ai/insights
 * Generate AI-powered insights from campaign data
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const { days = '30' } = req.query;
    const daysInt = parseInt(days as string);

    Logger.info(`Generating insights for last ${daysInt} days`);

    // Get metrics for the period
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        date: { gte: startDate },
      },
    });

    if (metrics.length === 0) {
      return res.status(400).json({
        error: 'No data available for the specified period',
      });
    }

    // Calculate aggregates
    const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const avgCPC = metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length;
    const avgCTR = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length;
    const avgROAS = metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length;

    // Get top campaigns by spend
    const campaignSpend = new Map<string, { spend: number; conversions: number }>();

    metrics.forEach((metric) => {
      if (metric.entityType === 'campaign') {
        const existing = campaignSpend.get(metric.entityId) || {
          spend: 0,
          conversions: 0,
        };
        campaignSpend.set(metric.entityId, {
          spend: existing.spend + metric.spend,
          conversions: existing.conversions + metric.conversions,
        });
      }
    });

    const sortedCampaigns = Array.from(campaignSpend.entries())
      .sort((a, b) => b[1].spend - a[1].spend)
      .slice(0, 5);

    // Get campaign names
    const topCampaigns = await Promise.all(
      sortedCampaigns.map(async ([campaignId, data]) => {
        const campaign = await prisma.campaign.findUnique({
          where: { campaignId },
        });
        return {
          name: campaign?.name || 'Unknown',
          spend: data.spend,
          conversions: data.conversions,
        };
      })
    );

    // Generate insights using AI
    const insights = await openRouterClient.generateInsights({
      totalSpend,
      totalConversions,
      avgCPC,
      avgCTR,
      avgROAS,
      topCampaigns,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    });

    Logger.info('Insights generated successfully');

    res.json({
      period: {
        days: daysInt,
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      metrics: {
        totalSpend,
        totalConversions,
        avgCPC,
        avgCTR,
        avgROAS,
      },
      topCampaigns,
      insights,
    });
  } catch (error: any) {
    Logger.error('Error generating insights:', error);
    res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message,
    });
  }
});

/**
 * POST /api/ai/query
 * Natural language query interface
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    Logger.info(`Processing query: ${question}`);

    // Gather context
    const campaignCount = await prisma.campaign.count();
    const adsetCount = await prisma.adSet.count();
    const adCount = await prisma.ad.count();

    // Get recent metrics for context
    const recentMetrics = await prisma.dailyMetric.findMany({
      orderBy: { date: 'desc' },
      take: 100,
    });

    const totalSpend = recentMetrics.reduce((sum, m) => sum + m.spend, 0);

    const oldestDate = recentMetrics[recentMetrics.length - 1]?.date;
    const newestDate = recentMetrics[0]?.date;

    let dateRange = 'No data available';
    if (oldestDate && newestDate) {
      dateRange = `${oldestDate.toISOString().split('T')[0]} to ${newestDate.toISOString().split('T')[0]}`;
    }

    // Query AI
    const answer = await openRouterClient.queryData(question, {
      campaigns: campaignCount,
      adsets: adsetCount,
      ads: adCount,
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      dateRange,
    });

    Logger.info('Query answered successfully');

    res.json({
      question,
      answer,
      context: {
        campaigns: campaignCount,
        adsets: adsetCount,
        ads: adCount,
        totalSpend: parseFloat(totalSpend.toFixed(2)),
        dateRange,
      },
    });
  } catch (error: any) {
    Logger.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error.message,
    });
  }
});

export default router;
