# Meta Ads Dashboard Redesign V2
## VIEW-ONLY Admin Panel with Advanced Filtering

## Part 1: Visual Design DNA (from Reference Image)

### What Makes the Reference Look Good:
1. **Color Palette**: Neutral grays (bg-slate-50/100), white cards, accent colors for data
2. **Card Design**: rounded-2xl, soft shadow, NO borders, generous padding
3. **Typography Hierarchy**:
   - Big numbers: text-3xl/4xl font-bold
   - Labels: text-sm text-slate-600
   - Context: text-xs text-slate-500
4. **Information Density**: High but breathable - lots of data, good spacing
5. **Visual Indicators**:
   - Progress bars (thick, colored segments)
   - Trend indicators (↑ +18.2% in green/red)
   - Badges for status/categories
6. **Layout**: Bento grid with varied card sizes, visual rhythm

### Apply to Meta Ads:
```css
/* Base */
background: bg-slate-50
cards: bg-white rounded-2xl shadow-sm p-6
spacing: gap-4 (mobile), gap-6 (desktop)

/* Typography */
metric-value: text-4xl font-bold text-slate-900
metric-label: text-sm font-medium text-slate-600
metric-change: text-xs text-emerald-600 or text-red-600
supporting-text: text-xs text-slate-500

/* Components */
progress-bars: h-2 rounded-full with colored segments
badges: rounded-full px-2 py-1 text-xs font-medium
trend-arrows: inline with color-coded percentages
```

## Part 2: Meta Ads Specific Components

### A. WHAT to Show (VIEW-ONLY Analytics)

#### 1. Performance Overview (Hero Section)
**Layout**: 4 metric cards (2x2 grid on mobile, 4x1 on desktop)

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Total Spend     │ │ Conversions     │ │ ROAS            │ │ CPM             │
│ $12,450         │ │ 1,234           │ │ 3.2x            │ │ $8.45           │
│ ↑ +18.2%        │ │ ↑ +25.3%        │ │ ↓ -12%          │ │ ↑ +5.7%         │
│ vs prev period  │ │ vs prev period  │ │ vs prev period  │ │ vs prev period  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Data**:
- Current period sum(spend, conversions, etc.)
- Previous period (same length) for comparison
- Calculate % delta and direction

#### 2. Budget Pacing
**Visual**: Horizontal progress bar with segments

```
┌────────────────────────────────────────────────────────────┐
│ Budget Pacing                                              │
│                                                            │
│ ███████████████████░░░░░░░░░░░░ 65% spent ($6,500/$10,000)│
│ ████████████████░░░░░░░░░░░░░░░░ 55% of time elapsed      │
│                                                            │
│ Status: Pacing ahead (+10%)  |  Projected: $11,800        │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Sum of all campaign budgets (or total account budget)
- Sum of spend
- Days elapsed / days in period
- Projection: (spend / daysElapsed) * totalDays

#### 3. Campaign Performance Table
**Visual**: Dense table with conditional formatting

```
┌──────────────────────────────────────────────────────────────────┐
│ Campaign Performance                                             │
├────────────┬────────┬──────────┬─────────┬──────┬──────┬────────┤
│ Campaign   │ Status │ Spend    │ Conv.   │ ROAS │ CTR  │ Trend  │
├────────────┼────────┼──────────┼─────────┼──────┼──────┼────────┤
│ Summer Sale│ [●]    │ $3,450   │ 450     │ 4.2x │ 2.1% │ ↑ +25% │
│ Brand Push │ [●]    │ $2,100   │ 180     │ 0.8x │ 1.5% │ ↓ -15% │
│ Retargeting│ [●]    │ $1,800   │ 320     │ 5.1x │ 3.2% │ ↑ +40% │
└────────────┴────────┴──────────┴─────────┴──────┴──────┴────────┘
```

**Features**:
- Sortable columns
- ROAS color coding (green >3x, yellow 1-3x, red <1x)
- Status badges
- Click row → drill into campaign detail

**Data**:
- All campaigns with aggregated metrics
- Calculate totals and averages per campaign

#### 4. Performance Trend Chart
**Visual**: Area chart (like reference "Customer Ratings")

```
┌────────────────────────────────────────────────────────────┐
│ Performance Trends                                         │
│                                                            │
│     ┌─── Spend    ─── Conversions    ─── ROAS           │
│  4x │          ╱╲                                         │
│  3x │         ╱  ╲        ╱╲                            │
│  2x │    ╱╲  ╱    ╲      ╱  ╲    ╱╲                     │
│  1x │___╱__╲╱______╲____╱____╲__╱__╲___                │
│     └──────────────────────────────────                  │
│       Jan 1   Jan 8   Jan 15  Jan 22  Jan 29            │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Daily metrics grouped by date
- Multiple lines: spend, conversions, ROAS

#### 5. Funnel Metrics
**Visual**: Funnel bars with conversion rates

```
┌────────────────────────────────────────────────────────────┐
│ Conversion Funnel                                          │
│                                                            │
│ Impressions   █████████████████████████████  1,234,567    │
│                                                            │
│ Clicks        ████████████  45,678  (3.7% CTR)            │
│                                                            │
│ Conversions   ███  1,234  (2.7% CVR)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Sum impressions, clicks, conversions
- Calculate CTR and CVR

#### 6. Platform/Placement Breakdown
**Visual**: Stacked bars or pie chart

```
┌────────────────────────────────────────────────────────────┐
│ Spend by Platform                                          │
│                                                            │
│ Facebook Feed     ██████████████████  $5,200 (42%)        │
│ Instagram Stories █████████████  $3,400 (27%)             │
│ Audience Network  ████████  $2,100 (17%)                  │
│ Messenger         ████  $1,750 (14%)                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Group metrics by placement (from AdSet.placement JSON)
- Calculate spend % distribution

#### 7. Time Intelligence (Heatmap)
**Visual**: Day-of-week × Hour-of-day heatmap

```
┌────────────────────────────────────────────────────────────┐
│ Performance by Time                                        │
│          0  2  4  6  8 10 12 14 16 18 20 22               │
│ Mon   │ ░░ ░░ ░░ ██ ██ ██ ██ ██ ░░ ░░ ░░ ░░              │
│ Tue   │ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░              │
│ Wed   │ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░              │
│ Thu   │ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ░░ ░░ ░░              │
│ Fri   │ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ░░ ░░              │
│ Sat   │ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ██ ██ ██ ░░              │
│ Sun   │ ░░ ░░ ░░ ░░ ░░ ██ ██ ██ ██ ░░ ░░ ░░              │
│                                                            │
│ ░░ = Low ROAS    ██ = High ROAS                           │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Extract hour and day-of-week from metric dates
- Calculate average ROAS per hour/day bucket
- Color code by performance

#### 8. Creative Performance Grid
**Visual**: Image grid with performance overlay

```
┌──────────────────────────────────────────────────────────────┐
│ Top Performing Creatives                                     │
│                                                              │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                    │
│  │[IMG] │  │[IMG] │  │[IMG] │  │[IMG] │                    │
│  │      │  │      │  │      │  │      │                    │
│  └──────┘  └──────┘  └──────┘  └──────┘                    │
│   450 conv  380 conv  320 conv  280 conv                    │
│   4.2x ROAS 3.9x ROAS 3.5x ROAS 3.1x ROAS                   │
│   8.5/10 AI 7.8/10 AI 7.2/10 AI 6.9/10 AI                   │
└──────────────────────────────────────────────────────────────┘
```

**Data**:
- Top ads by conversions
- Include thumbnailUrl, conversions, ROAS
- Include AI score from CreativeAnalysis if exists

#### 9. Anomaly Detection Feed
**Visual**: Vertical list with severity badges

```
┌────────────────────────────────────────────────────────────┐
│ Performance Anomalies                                      │
│                                                            │
│ 🔴 HIGH   CPC Spike on "Summer Sale"                      │
│   Expected: $0.45  →  Actual: $1.02 (+127%)              │
│   "Increased competition for 'summer shoes' keyword"       │
│   Detected: 2 hours ago                                    │
│                                                            │
│ 🟡 MEDIUM ROAS Drop on "Brand Push"                       │
│   Expected: 2.1x  →  Actual: 0.8x (-62%)                 │
│   "Audience saturation, creative fatigue detected"         │
│   Detected: 5 hours ago                                    │
│                                                            │
│ 🟢 LOW    CTR Improvement on "Retargeting"                │
│   Expected: 2.5%  →  Actual: 3.2% (+28%)                 │
│   "New creative performing above baseline"                 │
│   Detected: 1 day ago                                      │
└────────────────────────────────────────────────────────────┘
```

**Data**:
- Query Anomaly table (unresolved, ordered by severity)
- Show entityId, metric, expected/actual, AI explanation

#### 10. Top/Bottom Performers
**Visual**: Side-by-side lists

```
┌──────────────────────────┬──────────────────────────────┐
│ 🏆 Winners (ROAS)        │ ⚠️  Needs Attention (ROAS)  │
├──────────────────────────┼──────────────────────────────┤
│ 1. Retargeting    5.1x   │ 1. Brand Push      0.8x     │
│    $1,800 spend          │    $2,100 spend             │
│                          │                             │
│ 2. Summer Sale    4.2x   │ 2. New Launch      0.9x     │
│    $3,450 spend          │    $850 spend               │
│                          │                             │
│ 3. Black Friday   3.8x   │ 3. Test Campaign   1.1x     │
│    $1,200 spend          │    $450 spend               │
└──────────────────────────┴──────────────────────────────┘
```

**Data**:
- Sort campaigns by ROAS
- Top 3 and Bottom 3
- Show name, ROAS, spend

## Part 3: Filter & Date Range System

### Filter Panel Design
**Visual**: Sticky filter bar at top (mobile: collapse to sheet)

```
┌────────────────────────────────────────────────────────────────┐
│ [📅 Last 7 Days ▼] [Campaign ▼] [Status ▼] [Objective ▼] [🔄] │
└────────────────────────────────────────────────────────────────┘
```

### Date Range Picker
**Options**:
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Last month
- Custom range (calendar picker)

**Comparison**:
- Toggle: "Compare to previous period" checkbox
- Automatically calculates previous period of same length

### Multi-Dimension Filters

#### 1. Campaign Filter
```
┌─────────────────────────┐
│ Select Campaigns        │
├─────────────────────────┤
│ [x] All Campaigns       │
│ [ ] Summer Sale         │
│ [ ] Brand Push          │
│ [ ] Retargeting         │
│ [ ] Black Friday        │
│ ...                     │
│ [Apply] [Clear]         │
└─────────────────────────┘
```

#### 2. Status Filter
```
┌─────────────────────────┐
│ Status                  │
├─────────────────────────┤
│ [x] Active              │
│ [x] Paused              │
│ [ ] Deleted             │
│ [ ] Archived            │
└─────────────────────────┘
```

#### 3. Objective Filter
```
┌─────────────────────────┐
│ Objective               │
├─────────────────────────┤
│ [x] All                 │
│ [ ] Conversions         │
│ [ ] Traffic             │
│ [ ] Engagement          │
│ [ ] Brand Awareness     │
└─────────────────────────┘
```

#### 4. Performance Filter
```
┌─────────────────────────┐
│ Performance             │
├─────────────────────────┤
│ ROAS:                   │
│ [ ] > 5x (Excellent)    │
│ [ ] 3-5x (Good)         │
│ [ ] 1-3x (Fair)         │
│ [ ] < 1x (Poor)         │
└─────────────────────────┘
```

### Filter State Management
```typescript
interface FilterState {
  dateRange: {
    start: Date
    end: Date
    preset?: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth'
  }
  comparison: {
    enabled: boolean
    previousStart?: Date
    previousEnd?: Date
  }
  campaigns: string[] | 'all'
  adsets: string[] | 'all'
  status: ('active' | 'paused' | 'deleted')[]
  objective: string[] | 'all'
  roasRange?: { min?: number, max?: number }
}
```

### Filter Application
1. User selects filters → Update FilterState
2. Trigger API call with filter params
3. All components re-fetch with new filters
4. Show active filters as badges: `[Last 7 Days] [Active] [ROAS > 3x] [Clear All]`

## Part 4: Layout Structure

### Mobile (1 column)
```
┌─────────────────────┐
│ Filter Bar          │
├─────────────────────┤
│ Performance Cards   │
│ (4 cards stacked)   │
├─────────────────────┤
│ Budget Pacing       │
├─────────────────────┤
│ Anomaly Feed        │
│ (scrollable)        │
├─────────────────────┤
│ Top Performers      │
├─────────────────────┤
│ Campaign Table      │
│ (horizontal scroll) │
├─────────────────────┤
│ Trend Chart         │
├─────────────────────┤
│ Creative Grid       │
└─────────────────────┘
```

### Desktop (Bento Grid)
```
┌──────────────────────────────────────────────────────────────┐
│ Filter Bar (sticky)                                          │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│ Spend Card  │ Conv Card   │ ROAS Card   │ CPM Card        │
├─────────────┴─────────────┴─────────────┼──────────────────┤
│ Campaign Performance Table              │ Anomaly Feed     │
│ (large, sortable)                       │ (scrollable)     │
│                                         │                  │
├─────────────────────────────────────────┼──────────────────┤
│ Trend Chart (full width)                │ Top Performers   │
│                                         │                  │
├─────────────┬─────────────┬─────────────┴──────────────────┤
│ Funnel      │ Platform    │ Time Heatmap                   │
│ Metrics     │ Breakdown   │                                │
├─────────────┴─────────────┴────────────────────────────────┤
│ Creative Performance Grid (full width)                      │
└──────────────────────────────────────────────────────────────┘
```

## Part 5: Backend Requirements

### New Analytics Endpoints

#### 1. `/api/analytics/overview`
**Query Params**: startDate, endDate, previousStart?, previousEnd?, filters
**Returns**:
```json
{
  "current": {
    "totalSpend": 12450,
    "totalConversions": 1234,
    "avgROAS": 3.2,
    "avgCPM": 8.45
  },
  "previous": {
    "totalSpend": 10520,
    "totalConversions": 980,
    "avgROAS": 3.65,
    "avgCPM": 7.99
  },
  "delta": {
    "spend": 0.182,
    "conversions": 0.253,
    "roas": -0.12,
    "cpm": 0.057
  }
}
```

#### 2. `/api/analytics/budget-pacing`
**Returns**:
```json
{
  "totalBudget": 10000,
  "spent": 6500,
  "spentPercent": 65,
  "timeElapsed": 55,
  "pacingStatus": "ahead",
  "pacingDelta": 10,
  "projected": 11800
}
```

#### 3. `/api/analytics/campaigns`
**Query Params**: filters
**Returns**: Array of campaigns with aggregated metrics
```json
[{
  "campaignId": "...",
  "name": "Summer Sale",
  "status": "active",
  "spend": 3450,
  "conversions": 450,
  "roas": 4.2,
  "ctr": 2.1,
  "trend": 0.25
}]
```

#### 4. `/api/analytics/trends`
**Returns**: Daily metrics grouped by date
```json
[{
  "date": "2025-01-01",
  "spend": 420,
  "conversions": 52,
  "roas": 3.8
}]
```

#### 5. `/api/analytics/funnel`
**Returns**: Funnel metrics
```json
{
  "impressions": 1234567,
  "clicks": 45678,
  "conversions": 1234,
  "ctr": 3.7,
  "cvr": 2.7
}
```

#### 6. `/api/analytics/platform-breakdown`
**Returns**: Spend by platform
```json
[{
  "platform": "Facebook Feed",
  "spend": 5200,
  "percent": 42
}]
```

#### 7. `/api/analytics/time-intelligence`
**Returns**: Heatmap data
```json
{
  "hourly": {
    "0": { "mon": 1.2, "tue": 1.5, ... },
    "1": { "mon": 1.1, "tue": 1.3, ... },
    ...
  }
}
```

#### 8. `/api/analytics/top-creatives`
**Returns**: Top ads with thumbnails
```json
[{
  "adId": "...",
  "thumbnailUrl": "...",
  "conversions": 450,
  "roas": 4.2,
  "aiScore": 8.5
}]
```

## Part 6: Implementation Checklist

### Phase 1: Backend (Analytics Endpoints)
- [ ] Create `/api/analytics/overview` with comparison logic
- [ ] Create `/api/analytics/budget-pacing`
- [ ] Create `/api/analytics/campaigns` with filters
- [ ] Create `/api/analytics/trends`
- [ ] Create `/api/analytics/funnel`
- [ ] Create `/api/analytics/platform-breakdown`
- [ ] Create `/api/analytics/time-intelligence`
- [ ] Create `/api/analytics/top-creatives`

### Phase 2: Frontend Components (UI matching reference)
- [ ] Create filter bar with date range picker
- [ ] Create performance metric cards (4 cards)
- [ ] Create budget pacing component
- [ ] Create campaign performance table (sortable, TanStack Table)
- [ ] Create trend chart (Recharts area chart)
- [ ] Create funnel metrics component
- [ ] Create platform breakdown chart
- [ ] Create time intelligence heatmap
- [ ] Create creative performance grid
- [ ] Create anomaly feed
- [ ] Create top/bottom performers lists

### Phase 3: Filter System
- [ ] Create FilterContext for state management
- [ ] Create date range picker component (shadcn Calendar)
- [ ] Create multi-select filters (Campaign, Status, Objective)
- [ ] Wire filters to all components
- [ ] Add active filter badges
- [ ] Add "Clear All" functionality

### Phase 4: Visual Polish (Match Reference)
- [ ] Apply color palette (slate grays, white cards)
- [ ] Apply typography hierarchy (text sizes, weights)
- [ ] Apply card styling (rounded-2xl, shadows, padding)
- [ ] Add trend indicators (arrows, colors)
- [ ] Add progress bars styling
- [ ] Add badges styling
- [ ] Bento grid layout (responsive)

### Phase 5: Mobile Optimization
- [ ] Test all components on mobile
- [ ] Collapse filter bar to sheet on mobile
- [ ] Horizontal scroll for tables
- [ ] Stack cards vertically
- [ ] Optimize chart sizes
- [ ] Touch-friendly interactions

## Visual Design Tokens

```typescript
// colors.ts
export const colors = {
  background: 'bg-slate-50',
  card: 'bg-white',
  cardBorder: 'border-slate-200',
  text: {
    primary: 'text-slate-900',
    secondary: 'text-slate-600',
    tertiary: 'text-slate-500',
  },
  metric: {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-slate-600',
  },
  badge: {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  },
  roas: {
    excellent: 'bg-emerald-500', // > 5x
    good: 'bg-green-500',        // 3-5x
    fair: 'bg-yellow-500',       // 1-3x
    poor: 'bg-red-500',          // < 1x
  }
}

// typography.ts
export const typography = {
  metricValue: 'text-4xl font-bold',
  metricLabel: 'text-sm font-medium',
  metricChange: 'text-xs font-medium',
  cardTitle: 'text-lg font-semibold',
  sectionTitle: 'text-2xl font-bold',
  body: 'text-sm',
  caption: 'text-xs',
}

// spacing.ts
export const spacing = {
  card: 'p-6',
  cardGap: 'gap-4 md:gap-6',
  section: 'mb-8',
}
```

## Success Criteria

**Visual**: Looks as polished and dense as the reference image
**Functional**: Every component shows real Meta Ads data
**Filterable**: All views update when date/filter changes
**Responsive**: Works beautifully on mobile and desktop
**Performant**: Loads fast, smooth interactions

---

This is a VIEW-ONLY analytics dashboard. No action buttons. Just beautiful, dense, filterable data visualization.
