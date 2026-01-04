# Meta Ads Dashboard Redesign Plan

## The Problem
Current dashboard shows meaningless numbers with no context, no actionability, and no insight. It's like showing someone their bank balance without showing income, expenses, or trends.

## What Makes the Reference Image GOOD

1. **Contextual Comparisons**: "+18.2% than last week" - Every metric has context
2. **Directional Indicators**: Visual up/down with color coding
3. **Progress Towards Goals**: Revenue goal shows 56% completion
4. **Hierarchical Information**: Big number → supporting detail → visual
5. **Breakdown by Entity**: Zipcar/Bitbank shows WHERE money comes from
6. **Actionable**: You can SEE problems and opportunities immediately

## Real Questions Meta Ads Managers Ask Daily

### 1. "Am I burning budget too fast/slow?"
**Current**: Just shows total spend
**Should Show**:
- Circular progress: $X spent of $Y budget (%)
- Days remaining in period
- Projected end date: "At current rate: 3 days early" (RED) or "On track" (GREEN)
- Daily burn rate: "$150/day vs $120/day target" (+25% indicator)

### 2. "Which campaigns are winners vs losers?"
**Current**: Nothing
**Should Show**:
- Top 5 by ROAS (green badges)
- Bottom 5 by ROAS (red badges)
- Each showing: Name, Spend, Conversions, ROAS
- Visual progress bars for spend distribution
- Quick action: "Pause" button on losers, "Increase 20%" on winners

### 3. "What's suddenly broken or spiking?"
**Current**: AI anomalies page is separate and useless
**Should Show**:
- HIGH SEVERITY anomalies as alert cards (like "Damaged Returns")
- "CPC spiked 127% on Summer Sale Campaign"
- Expected: $0.45, Actual: $1.02 (visual comparison)
- AI Explanation: "Increased competition for 'summer shoes' keyword"
- Quick action: "Investigate" button → drills into campaign detail

### 4. "Where is my money going?"
**Current**: Nothing useful
**Should Show**:
- Like "Zipcar/Bitbank" breakdown
- Stacked horizontal bar: Campaign spend distribution
- Top 5 campaigns with spend amount and % of total
- Visual: Thick bars with campaign name overlaid
- "Others: $X (Y%)" for remaining

### 5. "Are my key metrics improving or declining?"
**Current**: Shows numbers with no context
**Should Show**:
- Metric cards like "Shipped Orders +18.2%"
- **Conversions**: 1,234 (+25.3% vs yesterday) [GREEN UP ARROW]
- **ROAS**: 3.2x (-12% vs last week) [RED DOWN ARROW]
- **CTR**: 2.1% (+5% vs yesterday) [GREEN UP ARROW]
- **CPC**: $0.67 (+45% vs last week) [RED UP ARROW - BAD]

### 6. "Which creatives are performing?"
**Current**: Generic grid with no context
**Should Show**:
- Top 3 creatives (by conversions) in hero section
- Thumbnail + performance overlay
- "Summer Shoes Ad: 450 conv, 4.2x ROAS, 8.5/10 AI Score"
- Visual: Green badge for winners, Red for losers
- Quick action: "Duplicate" button on winners

### 7. "What should I do RIGHT NOW?"
**Current**: Nothing actionable
**Should Show**:
- AI Recommendation Card (like "Cohort analysis")
- "3 campaigns underperforming - Pause to save $340/day"
- "Shift $200 from Campaign A (1.2x ROAS) to Campaign B (4.5x ROAS)"
- "Creative 'Blue Sneakers' performing 3x better - Replicate across 5 campaigns"
- Quick action buttons for each

## Component Architecture

### Layout: Bento Grid (Mobile-First)
```
Mobile (1 col):
[Budget Health]
[Performance Trends]
[Top Anomaly Alert]
[Campaign Breakdown]
[ROAS Leaderboard]
[Quick Actions]

Tablet (2 col):
[Budget Health]     [Performance Trends]
[Anomaly Alerts]    [Campaign Breakdown]
[ROAS Leaderboard]  [Creative Performance]

Desktop (4 col):
[Budget][Perf][Perf][Anomaly]
[Campaign Breakdown - span 2][ROAS Board][Creative]
[AI Recommendations - span 3][Quick Actions]
```

### Component 1: Budget Health Card
**Data Required**:
- Sum of all campaign dailyBudgets
- Total spend (last 30 days)
- Days in current period
- Daily spend trend

**Visual**:
- Circular progress (like Revenue Goal)
- Center: $X spent
- Ring: Progress %
- Below: "Burn rate: $X/day (vs $Y target)" with up/down indicator
- Below: "Projected: 3 days early" in red/green

**Calculation**:
```typescript
totalBudget = sum(campaigns.dailyBudget) * daysInPeriod
totalSpent = sum(metrics.spend where date >= periodStart)
progress = (totalSpent / totalBudget) * 100
burnRate = totalSpent / daysSoFar
targetRate = totalBudget / daysInPeriod
projectedEnd = daysRemaining * (burnRate - targetRate) / targetRate
```

### Component 2: Performance Trend Cards
**Data Required**:
- Metrics for current period and previous period
- Calculate deltas

**Visual** (4 cards in row):
```
[Conversions]           [ROAS]
1,234                   3.2x
+25.3% ↑               -12% ↓
vs yesterday           vs last week

[CTR]                   [CPC]
2.1%                    $0.67
+5% ↑                  +45% ↑
vs yesterday           vs last week
```

**Color Logic**:
- Green: Good direction (conversions up, CPC down)
- Red: Bad direction (conversions down, CPC up)

### Component 3: Anomaly Alert Banner
**Data Required**:
- Query: `getAnomalies({ resolved: false, severity: 'high', limit: 3 })`

**Visual**:
```
🚨 HIGH SEVERITY ALERTS

[CPC Spike]                               [INVESTIGATE →]
Summer Sale Campaign
Expected: $0.45  →  Actual: $1.02 (+127%)
AI: "Increased competition for 'summer shoes' keyword"
```

**Interaction**: Click → Navigate to campaign detail

### Component 4: Campaign Spend Breakdown
**Data Required**:
- All campaigns with metrics aggregated
- Sort by total spend DESC

**Visual** (like Zipcar/Bitbank):
```
Top Campaigns by Spend

1. Summer Sale      $3,450 ███████████████░░░░ 34%  ROAS: 4.2x
2. Brand Awareness  $2,100 █████████░░░░░░░░░░░ 21%  ROAS: 1.8x
3. Retargeting      $1,800 ████████░░░░░░░░░░░░ 18%  ROAS: 5.1x
4. Others           $2,750 ████████████░░░░░░░░ 27%  -
```

### Component 5: ROAS Leaderboard
**Data Required**:
- Campaigns with metrics, calculate ROAS per campaign
- Sort by ROAS: Top 5 and Bottom 5

**Visual**:
```
🏆 WINNERS (by ROAS)                  ⚠️ LOSERS (by ROAS)

1. Retargeting      5.1x  [+20%]      1. Brand Push    0.8x  [PAUSE]
2. Summer Sale      4.2x  [+20%]      2. New Launch    0.9x  [PAUSE]
3. Black Friday     3.8x              3. Test Campaign 1.1x  [PAUSE]
```

**Interaction**: Buttons trigger budget adjustments

### Component 6: AI Recommendations
**Data Required**:
- AI insights endpoint
- Anomalies + performance data → generate actions

**Visual** (like Cohort Analysis):
```
💡 AI RECOMMENDATIONS

Based on the last 7 days of performance data:

[1] Pause 3 underperforming campaigns to save $340/day
    Campaigns: Brand Push (0.8x), New Launch (0.9x), Test Campaign (1.1x)
    [APPLY RECOMMENDATIONS →]

[2] Shift $500/day from Campaign A to Campaign B
    Reason: Campaign B has 3.8x better ROAS
    [REBALANCE BUDGET →]

[3] Replicate "Blue Sneakers" creative across 5 campaigns
    Performance: 450 conversions, 4.2x ROAS vs 2.1x average
    [CREATE VARIANTS →]
```

### Component 7: Creative Performance
**Data Required**:
- Top 3 ads by conversions (last 7 days)
- With creative analysis scores

**Visual**:
```
🎨 TOP PERFORMING CREATIVES

[IMG] Blue Sneakers Ad              [IMG] Summer Sale Hero
450 conversions                     380 conversions
4.2x ROAS | AI: 8.5/10             3.9x ROAS | AI: 7.8/10
[DUPLICATE] [VIEW DETAILS]         [DUPLICATE] [VIEW DETAILS]
```

## Technical Implementation Plan

### Phase 1: Data Processing Layer (Backend)
**New API Endpoints Needed**:

1. `/api/analytics/budget-health`
   - Calculate budget vs spend, burn rate, projections
   - Return: totalBudget, totalSpent, burnRate, targetRate, projectedEnd

2. `/api/analytics/performance-trends`
   - Calculate current vs previous period for key metrics
   - Return: conversions, roas, ctr, cpc with deltas and direction

3. `/api/analytics/campaign-breakdown`
   - Aggregate spend by campaign, calculate %
   - Return: campaigns sorted by spend with percentages

4. `/api/analytics/roas-leaderboard`
   - Calculate ROAS per campaign, sort both directions
   - Return: top 5 and bottom 5 with spend, conversions, ROAS

5. `/api/analytics/recommendations`
   - AI-generated action items based on data
   - Return: structured recommendations with action buttons

### Phase 2: Frontend Components (Mobile-First)

**New shadcn components needed**:
- Progress (circular) ✓ already have
- Alert (for anomalies)
- Command (for quick actions)
- Tooltip (for metric explanations)

**Component structure**:
```
app/
  dashboard/
    page.tsx (main orchestrator)
    components/
      budget-health-card.tsx
      performance-trend-card.tsx
      anomaly-alert.tsx
      campaign-breakdown.tsx
      roas-leaderboard.tsx
      ai-recommendations.tsx
      creative-performance.tsx
      quick-actions.tsx
```

### Phase 3: Mobile Navigation
**Replace sidebar with**:
- Sticky bottom nav (mobile)
- Sheet/Drawer trigger for menu (mobile)
- Traditional sidebar (desktop only, using md: breakpoint)

### Phase 4: Interactions
**Quick Actions**:
- Pause campaign → API call to update status
- Increase budget → API call to update dailyBudget
- Apply recommendations → Batch API calls
- Duplicate creative → Navigate to create flow

## Success Metrics

**Before**: User opens dashboard, sees numbers, closes tab
**After**: User opens dashboard, immediately sees:
1. Budget is 25% overspent (RED) → Takes action to pause campaigns
2. Campaign A has 0.8x ROAS → Pauses it via button
3. Anomaly: CPC spiked on Campaign B → Investigates
4. AI recommends shifting budget → Applies recommendation
5. Creative X is winner → Duplicates it

**Goal**: Dashboard becomes OPERATIONAL, not just informational

## Next Steps

1. ✅ Get approval on this plan
2. Create new analytics endpoints in backend
3. Build data processing logic (calculations, aggregations)
4. Create shadcn components with real data
5. Implement mobile-first bento layout
6. Add quick action buttons with API integration
7. Test with real production data
8. Iterate based on actual usage

---

**Key Principle**: Every number should answer "So what?" and every card should enable "Now what?"
