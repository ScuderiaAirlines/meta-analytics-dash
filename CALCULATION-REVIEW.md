# Calculation Review Across Entire Codebase

## Backend Routes

### ✅ analytics.ts (RECENTLY FIXED)
**Lines 43, 95, 288, 380, 499**: ROAS calculation
```typescript
roasWeightedSum: acc.roasWeightedSum + (m.roas * m.spend)
avgROAS: current.totalSpend > 0 ? current.roasWeightedSum / current.totalSpend : 0
```
**Status**: ✅ CORRECT - Uses weighted average by spend

**Lines 181-212**: Budget pacing
```typescript
const totalDays = Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)), 1)
const daysElapsed = Math.min(Math.max(...), totalDays)
const timeElapsedPercent = (daysElapsed / totalDays) * 100
const pacingDelta = spentPercent - timeElapsedPercent
const pacingStatus = Math.abs(pacingDelta) < 5 ? 'on-track' : pacingDelta > 0 ? 'ahead' : 'behind'
```
**Status**: ✅ CORRECT - Logic fixed

---

### ❌ metrics.ts (NEEDS FIX)
**Lines 64-72**: Average calculations
```typescript
const avgCtr = metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
const avgCpc = metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length
const avgRoas = metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length
```
**Problem**: Simple averages instead of proper calculations
**Should be**:
```typescript
const avgCtr = aggregates.totalImpressions > 0
  ? (aggregates.totalClicks / aggregates.totalImpressions) * 100
  : 0
const avgCpc = aggregates.totalClicks > 0
  ? aggregates.totalSpend / aggregates.totalClicks
  : 0
const avgRoas = aggregates.totalSpend > 0
  ? metrics.reduce((sum, m) => sum + (m.roas * m.spend), 0) / aggregates.totalSpend
  : 0
```

---

### ✅ campaigns.ts
**Lines 82-90**: Summary stats
```typescript
const summary = metrics.reduce((acc, metric) => ({
  totalSpend: acc.totalSpend + metric.spend,
  totalImpressions: acc.totalImpressions + metric.impressions,
  totalClicks: acc.totalClicks + metric.clicks,
  totalConversions: acc.totalConversions + metric.conversions,
}), { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 })
```
**Status**: ✅ CORRECT - Simple sums, no complex calculations

**Missing**: Should add ROAS, CTR, CPC calculations to summary

---

### ✅ adsets.ts
**No calculations** - Just returns data

---

### ✅ ads.ts
**No calculations** - Just returns data

---

### ⚠️ ai.ts (NEEDS REVIEW)
**Lines to check**: Anomaly detection calculations
- Need to review how expectedValue, actualValue, deviationPercent are calculated

---

## Frontend Pages

### ❌ dashboard/page.tsx (NEEDS FIXES)
**Lines 59 (old dashboard)**: Manual calculations
```typescript
const totalSpend = metricsData.reduce((sum: number, m: any) => sum + m.spend, 0)
const avgCTR = metricsData.reduce((sum: number, m: any) => sum + m.ctr, 0) / metricsData.length
const avgROAS = metricsData.reduce((sum: number, m: any) => sum + m.roas, 0) / metricsData.length
```
**Problem**: IF this is still used somewhere (old code?), same issue - simple averages

**Lines 98-106 (old dashboard)**: Chart data aggregation
```typescript
const dateMap = new Map<string, { spend: number; conversions: number }>()
metricsData.forEach((m: any) => {
  const dateKey = m.date
  if (!dateMap.has(dateKey)) { dateMap.set(dateKey, { spend: 0, conversions: 0 }) }
  const day = dateMap.get(dateKey)!
  day.spend += m.spend
  day.conversions += m.conversions
})
```
**Status**: ✅ CORRECT - Simple aggregation

**New dashboard**: Uses API endpoints, calculations done in backend

---

### anomalies/page.tsx
**Need to check**: How anomaly severity is displayed and if any calculations

---

### creatives/page.tsx
**Need to check**: How creative performance is calculated

---

### insights/page.tsx
**Need to check**: If any aggregations or calculations

---

### query/page.tsx
**Need to check**: Natural language processing, likely no calculations

---

## Issues Summary

### CRITICAL FIXES NEEDED:

1. **backend/src/routes/metrics.ts** (Lines 64-72)
   - avgCtr: Use totalClicks / totalImpressions * 100
   - avgCpc: Use totalSpend / totalClicks
   - avgRoas: Use weighted average by spend

2. **backend/src/routes/campaigns.ts** (Lines 82-90)
   - Add calculated fields to summary: ROAS, CTR, CPC, CPM

3. **backend/src/routes/adsets.ts**
   - Add summary stats with calculations

4. **backend/src/routes/ads.ts**
   - Add summary stats with calculations

5. **backend/src/routes/ai.ts**
   - Review anomaly detection calculation logic

---

## Calculation Formulas (STANDARD)

### ROAS (Return on Ad Spend)
```
Weighted ROAS = sum(roas_i * spend_i) / sum(spend_i)
NOT: sum(roas_i) / count
```

### CTR (Click-Through Rate)
```
CTR = (total_clicks / total_impressions) * 100
NOT: sum(ctr_i) / count
```

### CPC (Cost Per Click)
```
CPC = total_spend / total_clicks
NOT: sum(cpc_i) / count
```

### CPM (Cost Per Mille/Thousand Impressions)
```
CPM = (total_spend / total_impressions) * 1000
NOT: sum(cpm_i) / count
```

### CVR (Conversion Rate)
```
CVR = (total_conversions / total_clicks) * 100
```

### Budget Pacing
```
time_elapsed_percent = (days_elapsed / total_days) * 100
spend_percent = (total_spent / total_budget) * 100
pacing_delta = spend_percent - time_elapsed_percent
status = abs(delta) < 5 ? 'on-track' : delta > 0 ? 'ahead' : 'behind'
```

---

## Action Plan

1. Fix metrics.ts averages
2. Add calculated summaries to campaigns.ts, adsets.ts, ads.ts
3. Review and fix ai.ts anomaly calculations
4. Create shared utility functions for common calculations
5. Add comprehensive tests for all calculations
