/**
 * Centralized Math Engine for Meta Ads Analytics
 * All metric calculations must go through this module to ensure consistency
 */

interface MetricRow {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
  roas: number;
}

interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  avgCTR: number;
  avgCPC: number;
  avgROAS: number;
  avgCPM: number;
  avgCVR: number;
  roasWeightedSum: number; // Internal for weighted calculations
}

/**
 * Safe division with zero-check
 * Prevents NaN errors by checking denominator
 */
export const safeDivide = (numerator: number, denominator: number, defaultValue = 0): number => {
  return denominator > 0 ? numerator / denominator : defaultValue;
};

/**
 * Aggregate multiple metric rows into totals and calculated averages
 * This is the single source of truth for all aggregation logic
 *
 * @param rows - Array of metric rows from database
 * @returns Aggregated metrics with proper weighted averages
 */
export const aggregateMetrics = (rows: MetricRow[]): AggregatedMetrics => {
  if (!rows || rows.length === 0) {
    return {
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgROAS: 0,
      avgCPM: 0,
      avgCVR: 0,
      roasWeightedSum: 0,
    };
  }

  // Aggregate totals
  const totals = rows.reduce(
    (acc, row) => ({
      spend: acc.spend + (row.spend || 0),
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
      conversions: acc.conversions + (row.conversions || 0),
      roasWeightedSum: acc.roasWeightedSum + ((row.roas || 0) * (row.spend || 0)),
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, roasWeightedSum: 0 }
  );

  // Calculate revenue from ROAS
  const totalRevenue = totals.roasWeightedSum;

  // Calculate weighted averages (CRITICAL: Use totals, not simple averages!)
  const avgCTR = safeDivide(totals.clicks, totals.impressions) * 100;
  const avgCPC = safeDivide(totals.spend, totals.clicks);
  const avgROAS = safeDivide(totals.roasWeightedSum, totals.spend);
  const avgCPM = safeDivide(totals.spend, totals.impressions) * 1000;
  const avgCVR = safeDivide(totals.conversions, totals.clicks) * 100;

  return {
    totalSpend: totals.spend,
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalConversions: totals.conversions,
    totalRevenue,
    avgCTR,
    avgCPC,
    avgROAS,
    avgCPM,
    avgCVR,
    roasWeightedSum: totals.roasWeightedSum,
  };
};

/**
 * Calculate percentage change (delta) between two values
 *
 * @param current - Current period value
 * @param previous - Previous period value
 * @returns Percentage change as decimal (0.05 = 5% increase)
 */
export const calculateDelta = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 1 : 0; // 100% increase if previous was 0
  }
  return safeDivide(current - previous, previous);
};

/**
 * Calculate all deltas between current and previous periods
 *
 * @param current - Current period aggregated metrics
 * @param previous - Previous period aggregated metrics
 * @returns Object with delta for each metric
 */
export const calculateDeltas = (
  current: AggregatedMetrics,
  previous: AggregatedMetrics
) => {
  return {
    spend: calculateDelta(current.totalSpend, previous.totalSpend),
    clicks: calculateDelta(current.totalClicks, previous.totalClicks),
    impressions: calculateDelta(current.totalImpressions, previous.totalImpressions),
    conversions: calculateDelta(current.totalConversions, previous.totalConversions),
    ctr: calculateDelta(current.avgCTR, previous.avgCTR),
    cpc: calculateDelta(current.avgCPC, previous.avgCPC),
    roas: calculateDelta(current.avgROAS, previous.avgROAS),
    cpm: calculateDelta(current.avgCPM, previous.avgCPM),
    cvr: calculateDelta(current.avgCVR, previous.avgCVR),
  };
};

/**
 * Calculate budget pacing metrics
 *
 * @param totalBudget - Total budget for the period
 * @param totalSpent - Amount spent so far
 * @param daysElapsed - Days elapsed in the period (IST)
 * @param totalDays - Total days in the period
 * @returns Budget pacing status and metrics
 */
export const calculateBudgetPacing = (
  totalBudget: number,
  totalSpent: number,
  daysElapsed: number,
  totalDays: number
): {
  totalBudget: number;
  totalSpent: number;
  budgetRemaining: number;
  spentPercent: number;
  timeElapsedPercent: number;
  pacingDelta: number;
  pacingStatus: 'on-track' | 'ahead' | 'behind';
  projectedSpend: number;
} => {
  const budgetRemaining = Math.max(totalBudget - totalSpent, 0);
  const spentPercent = safeDivide(totalSpent, totalBudget) * 100;
  const timeElapsedPercent = safeDivide(daysElapsed, totalDays) * 100;
  const pacingDelta = spentPercent - timeElapsedPercent;

  // Determine pacing status (within 5% is considered on-track)
  let pacingStatus: 'on-track' | 'ahead' | 'behind';
  if (Math.abs(pacingDelta) < 5) {
    pacingStatus = 'on-track';
  } else if (pacingDelta > 0) {
    pacingStatus = 'ahead'; // Spending faster than time elapsed
  } else {
    pacingStatus = 'behind'; // Spending slower than time elapsed
  }

  // Project final spend based on current pace
  const dailySpendRate = safeDivide(totalSpent, daysElapsed);
  const projectedSpend = dailySpendRate * totalDays;

  return {
    totalBudget,
    totalSpent,
    budgetRemaining,
    spentPercent,
    timeElapsedPercent,
    pacingDelta,
    pacingStatus,
    projectedSpend,
  };
};

/**
 * Calculate funnel conversion metrics
 *
 * @param impressions - Total impressions
 * @param clicks - Total clicks
 * @param conversions - Total conversions
 * @returns Funnel stages with conversion rates
 */
export const calculateFunnel = (
  impressions: number,
  clicks: number,
  conversions: number
): {
  stages: Array<{
    name: string;
    value: number;
    conversionRate: number;
  }>;
} => {
  const impressionToClick = safeDivide(clicks, impressions) * 100;
  const clickToConversion = safeDivide(conversions, clicks) * 100;
  const impressionToConversion = safeDivide(conversions, impressions) * 100;

  return {
    stages: [
      {
        name: 'Impressions',
        value: impressions,
        conversionRate: 100, // Starting point
      },
      {
        name: 'Clicks',
        value: clicks,
        conversionRate: impressionToClick,
      },
      {
        name: 'Conversions',
        value: conversions,
        conversionRate: impressionToConversion,
      },
    ],
  };
};

/**
 * Calculate single metric value (for individual rows/campaigns)
 * Used when displaying individual campaign/ad metrics
 *
 * @param spend - Amount spent
 * @param impressions - Number of impressions
 * @param clicks - Number of clicks
 * @param conversions - Number of conversions
 * @param roas - ROAS value
 * @returns Calculated metrics for single entity
 */
export const calculateSingleMetrics = (
  spend: number,
  impressions: number,
  clicks: number,
  conversions: number,
  roas: number
) => {
  return {
    spend,
    impressions,
    clicks,
    conversions,
    roas,
    ctr: safeDivide(clicks, impressions) * 100,
    cpc: safeDivide(spend, clicks),
    cpm: safeDivide(spend, impressions) * 1000,
    cvr: safeDivide(conversions, clicks) * 100,
    revenue: roas * spend,
  };
};
