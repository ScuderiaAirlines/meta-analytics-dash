/**
 * Database Dump Script
 * Outputs a prettified view of the database to verify calculations
 */

import prisma from './utils/prisma';
import { aggregateMetrics } from './utils/mathEngine';

async function dumpDatabase() {
  console.log('\n========================================');
  console.log('META ADS DATABASE DUMP');
  console.log('========================================\n');

  // Get all campaigns
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
  });

  console.log(`📊 CAMPAIGNS: ${campaigns.length} total\n`);

  for (const campaign of campaigns.slice(0, 5)) {
    console.log(`\n┌─ Campaign: ${campaign.name}`);
    console.log(`│  ID: ${campaign.campaignId}`);
    console.log(`│  Status: ${campaign.status}`);
    console.log(`│  Daily Budget: ₹${campaign.dailyBudget || 0}`);

    // Get metrics for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const metrics = await prisma.dailyMetric.findMany({
      where: {
        entityId: campaign.campaignId,
        entityType: 'campaign',
        date: { gte: sevenDaysAgo },
      },
      orderBy: { date: 'desc' },
    });

    console.log(`│  Metrics (last 7 days): ${metrics.length} records`);

    if (metrics.length > 0) {
      console.log(`│`);
      console.log(`│  📅 Daily Breakdown:`);

      metrics.forEach((m) => {
        console.log(`│    ${m.date.toISOString().split('T')[0]}:`);
        console.log(`│      Spend: ₹${m.spend.toFixed(2)}`);
        console.log(`│      Impressions: ${m.impressions}`);
        console.log(`│      Clicks: ${m.clicks}`);
        console.log(`│      Conversions: ${m.conversions}`);
        console.log(`│      CPC: ₹${m.cpc.toFixed(2)}`);
        console.log(`│      CTR: ${m.ctr.toFixed(2)}%`);
        console.log(`│      ROAS: ${m.roas.toFixed(2)}x`);
      });

      // Calculate aggregates using math engine
      const agg = aggregateMetrics(metrics);

      console.log(`│`);
      console.log(`│  📈 Aggregated (Math Engine):`);
      console.log(`│    Total Spend: ₹${agg.totalSpend.toFixed(2)}`);
      console.log(`│    Total Impressions: ${agg.totalImpressions}`);
      console.log(`│    Total Clicks: ${agg.totalClicks}`);
      console.log(`│    Total Conversions: ${agg.totalConversions}`);
      console.log(`│    Avg CTR: ${agg.avgCTR.toFixed(2)}%`);
      console.log(`│    Avg CPC: ₹${agg.avgCPC.toFixed(2)}`);
      console.log(`│    Avg ROAS: ${agg.avgROAS.toFixed(2)}x`);
      console.log(`│    Avg CPM: ₹${agg.avgCPM.toFixed(2)}`);
      console.log(`│    Avg CVR: ${agg.avgCVR.toFixed(2)}%`);

      // Manual verification of calculations
      console.log(`│`);
      console.log(`│  🔍 Manual Verification:`);
      const manualCTR = agg.totalImpressions > 0
        ? (agg.totalClicks / agg.totalImpressions) * 100
        : 0;
      const manualCPC = agg.totalClicks > 0
        ? agg.totalSpend / agg.totalClicks
        : 0;
      const roasWeightedSum = metrics.reduce((sum, m) => sum + (m.roas * m.spend), 0);
      const manualROAS = agg.totalSpend > 0
        ? roasWeightedSum / agg.totalSpend
        : 0;

      console.log(`│    Verified CTR: ${manualCTR.toFixed(2)}%`);
      console.log(`│    Verified CPC: ₹${manualCPC.toFixed(2)}`);
      console.log(`│    Verified ROAS: ${manualROAS.toFixed(2)}x`);
      console.log(`│    ROAS Weighted Sum: ${roasWeightedSum.toFixed(2)}`);
    }
    console.log(`└─`);
  }

  // Overall stats
  console.log('\n========================================');
  console.log('OVERALL DATABASE STATS');
  console.log('========================================\n');

  const totalMetrics = await prisma.dailyMetric.count();
  const totalAdSets = await prisma.adSet.count();
  const totalAds = await prisma.ad.count();

  console.log(`Campaigns: ${campaigns.length}`);
  console.log(`AdSets: ${totalAdSets}`);
  console.log(`Ads: ${totalAds}`);
  console.log(`Daily Metrics: ${totalMetrics}`);

  // Sample raw metric data
  console.log('\n========================================');
  console.log('SAMPLE RAW METRICS (First 3 records)');
  console.log('========================================\n');

  const sampleMetrics = await prisma.dailyMetric.findMany({
    take: 3,
    orderBy: { date: 'desc' },
  });

  sampleMetrics.forEach((m, i) => {
    console.log(`Record ${i + 1}:`);
    console.log(`  Date: ${m.date.toISOString()}`);
    console.log(`  Entity: ${m.entityType} (${m.entityId})`);
    console.log(`  Spend: ₹${m.spend} (raw value)`);
    console.log(`  Impressions: ${m.impressions}`);
    console.log(`  Clicks: ${m.clicks}`);
    console.log(`  Conversions: ${m.conversions}`);
    console.log(`  CPC: ₹${m.cpc}`);
    console.log(`  CTR: ${m.ctr}%`);
    console.log(`  ROAS: ${m.roas}x`);
    console.log('');
  });

  await prisma.$disconnect();
}

dumpDatabase()
  .catch((error) => {
    console.error('Error dumping database:', error);
    process.exit(1);
  });
