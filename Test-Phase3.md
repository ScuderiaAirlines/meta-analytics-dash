# Testing Guide - Phase 3: AI Integration

This guide will help you test all AI-powered features of the Meta Ads Analytics Suite.

## Prerequisites

Before testing Phase 3, ensure:

1. **Phase 1 & 2 are complete:**
   - Backend is running on port 3000
   - PostgreSQL database is connected
   - Database tables are created (`prisma db push`)

2. **OpenRouter API Key is configured:**
   ```bash
   # Add to .env file
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet  # Optional, this is default
   APP_URL=http://your-vps-ip:1111  # Optional
   ```

3. **Rebuild backend with new code:**
   ```bash
   docker-compose down
   docker-compose build --no-cache backend
   docker-compose up -d
   ```

4. **Verify backend is running:**
   ```bash
   docker-compose logs -f backend
   # Should see: "✅ Database connected successfully"
   # Should see: "🚀 Server running on port 3000"
   ```

---

## Phase 3 AI Endpoints

### 1. Creative Analysis

**Endpoint:** `POST /api/ai/analyze-creative`

**Purpose:** Analyze ad creative using AI to predict performance and provide recommendations.

**Test Command:**
```bash
curl -X POST http://localhost:1111/api/ai/analyze-creative \
  -H "Content-Type: application/json" \
  -d '{
    "adId": "your_ad_id_here"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "cm5x1y2z3...",
    "adId": "123456789",
    "imageUrl": "https://...",
    "aiAnalysis": {
      "analysis": "Overall assessment of the creative...",
      "strengths": [
        "Clear call-to-action",
        "Eye-catching visuals",
        "Strong brand presence"
      ],
      "weaknesses": [
        "Text may be too small on mobile",
        "Limited color contrast"
      ],
      "recommendations": [
        "Increase font size for mobile viewing",
        "Add more contrast to key elements",
        "Test with different background colors"
      ],
      "predictedScore": 78
    },
    "predictedScore": 78,
    "analyzedAt": "2026-01-03T..."
  }
}
```

**Error Cases:**
- `400`: Missing adId or ad has no thumbnail
- `404`: Ad not found
- `500`: OpenRouter API error or parsing error

**Get Previous Analyses:**
```bash
curl http://localhost:1111/api/ai/creative-analyses/your_ad_id_here
```

---

### 2. Anomaly Detection

**Endpoint:** `GET /api/ai/detect-anomalies`

**Purpose:** Detect unusual patterns in metrics and generate AI explanations.

**Test Command:**
```bash
# Detect anomalies in last 7 days with 20% threshold
curl "http://localhost:1111/api/ai/detect-anomalies?days=7&threshold=20"
```

**Query Parameters:**
- `days` (optional, default: 7) - Number of days to analyze
- `threshold` (optional, default: 20) - Deviation percentage threshold

**Expected Response:**
```json
{
  "anomalies": [
    {
      "entityId": "campaign_123",
      "entityType": "campaign",
      "metricName": "cpc",
      "expectedValue": 1.25,
      "actualValue": 2.15,
      "deviationPercent": 72.0,
      "severity": "high",
      "date": "2026-01-03T...",
      "aiExplanation": "The 72% increase in CPC is likely due to increased competition during peak hours. This is a concern as it impacts profitability. Consider adjusting bid strategy or targeting to more cost-effective audiences."
    }
  ],
  "total": 15,
  "explained": 5
}
```

**Note:** Only the top 5 anomalies get AI explanations to control API costs.

**Get Stored Anomalies:**
```bash
# Get unresolved anomalies
curl "http://localhost:1111/api/ai/anomalies?resolved=false&limit=50"

# Get resolved anomalies
curl "http://localhost:1111/api/ai/anomalies?resolved=true&limit=50"
```

**Mark Anomaly as Resolved:**
```bash
curl -X PATCH http://localhost:1111/api/ai/anomalies/anomaly_id_here/resolve
```

---

### 3. Insights Generator

**Endpoint:** `GET /api/ai/insights`

**Purpose:** Generate comprehensive AI insights from campaign performance data.

**Test Command:**
```bash
# Generate insights for last 30 days
curl "http://localhost:1111/api/ai/insights?days=30"
```

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to analyze

**Expected Response:**
```json
{
  "period": {
    "days": 30,
    "start": "2025-12-04",
    "end": "2026-01-03"
  },
  "metrics": {
    "totalSpend": 15420.50,
    "totalConversions": 342,
    "avgCPC": 1.25,
    "avgCTR": 2.45,
    "avgROAS": 3.2
  },
  "topCampaigns": [
    {
      "name": "Summer Sale Campaign",
      "spend": 5200.00,
      "conversions": 128
    }
  ],
  "insights": {
    "summary": "Overall campaign performance shows strong ROAS of 3.2, indicating efficient ad spend. However, CPC has room for improvement through better targeting.",
    "keyFindings": [
      "Top 3 campaigns drive 65% of total conversions",
      "CTR is above industry average of 2.1%",
      "Weekend performance outperforms weekdays by 23%",
      "Mobile traffic converts 18% better than desktop"
    ],
    "recommendations": [
      "Increase budget for top-performing campaigns",
      "Implement dayparting to focus on weekend traffic",
      "Create mobile-specific ad variants",
      "Test new audiences similar to best converters"
    ],
    "opportunities": [
      "Expand successful campaigns to similar markets",
      "Implement retargeting for cart abandoners",
      "Test video creatives for higher engagement"
    ]
  }
}
```

**Error Cases:**
- `400`: No data available for the specified period
- `500`: OpenRouter API error

---

### 4. Natural Language Query

**Endpoint:** `POST /api/ai/query`

**Purpose:** Ask questions about your ad data in natural language.

**Test Commands:**

```bash
# Example 1: General performance question
curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How are my campaigns performing overall?"
  }'

# Example 2: Specific metric question
curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is my average ROAS and how can I improve it?"
  }'

# Example 3: Comparison question
curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Which campaigns are spending the most money?"
  }'

# Example 4: Optimization question
curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How can I reduce my cost per click?"
  }'
```

**Expected Response:**
```json
{
  "question": "How are my campaigns performing overall?",
  "answer": "Based on your data, you have 12 active campaigns with a total spend of $15,420.50. Your overall ROAS of 3.2 indicates strong performance, meaning you're earning $3.20 for every dollar spent. To maintain this, focus on your top-performing campaigns and consider pausing underperformers.",
  "context": {
    "campaigns": 12,
    "adsets": 45,
    "ads": 156,
    "totalSpend": 15420.50,
    "dateRange": "2025-12-04 to 2026-01-03"
  }
}
```

**Error Cases:**
- `400`: Missing question
- `500`: OpenRouter API error

---

## Complete Testing Workflow

### Step 1: Populate Test Data

First, ensure you have some test data in your database. You can use the sync endpoints from Phase 2:

```bash
# Sync campaigns from Meta
curl -X POST http://localhost:1111/api/sync/campaigns

# Sync adsets
curl -X POST http://localhost:1111/api/sync/adsets

# Sync ads
curl -X POST http://localhost:1111/api/sync/ads

# Sync metrics
curl -X POST http://localhost:1111/api/sync/metrics
```

Or manually insert test data using Prisma Studio:
```bash
docker compose exec backend npx prisma studio
```

### Step 2: Test Creative Analysis

```bash
# First, get a list of ads
curl http://localhost:1111/api/ads | jq '.[0].adId'

# Use the adId to analyze a creative
curl -X POST http://localhost:1111/api/ai/analyze-creative \
  -H "Content-Type: application/json" \
  -d '{"adId": "paste_ad_id_here"}' | jq
```

### Step 3: Test Anomaly Detection

```bash
# Detect anomalies
curl "http://localhost:1111/api/ai/detect-anomalies?days=7&threshold=15" | jq

# View stored anomalies
curl "http://localhost:1111/api/ai/anomalies?resolved=false" | jq

# Resolve an anomaly
curl -X PATCH http://localhost:1111/api/ai/anomalies/anomaly_id/resolve | jq
```

### Step 4: Test Insights Generator

```bash
# Generate insights for different periods
curl "http://localhost:1111/api/ai/insights?days=7" | jq
curl "http://localhost:1111/api/ai/insights?days=30" | jq
```

### Step 5: Test Natural Language Queries

```bash
# Ask various questions
curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are my top 3 campaigns by spend?"}' | jq

curl -X POST http://localhost:1111/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"question": "How can I improve my CTR?"}' | jq
```

---

## Troubleshooting

### Issue: "OPENROUTER_API_KEY is not configured"

**Solution:**
1. Get an API key from https://openrouter.ai
2. Add to `.env` file:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-...
   ```
3. Rebuild backend:
   ```bash
   docker-compose down
   docker-compose build --no-cache backend
   docker-compose up -d
   ```

### Issue: "Failed to parse AI response"

**Possible Causes:**
- AI model returned invalid JSON
- Network timeout during API call

**Solution:**
1. Check backend logs:
   ```bash
   docker-compose logs backend | grep -A 5 "Failed to parse"
   ```
2. Try a different model in `.env`:
   ```bash
   OPENROUTER_MODEL=openai/gpt-4-turbo
   ```

### Issue: "No data available for the specified period"

**Solution:**
1. Verify you have metrics in the database:
   ```bash
   curl http://localhost:1111/api/metrics | jq 'length'
   ```
2. If no data, sync from Meta API or insert test data

### Issue: OpenRouter API rate limits

**Solution:**
1. Check OpenRouter dashboard for usage limits
2. Reduce the number of AI explanations in anomaly detection (currently limited to 5)
3. Increase time between requests

---

## Cost Optimization Tips

1. **Anomaly Detection:**
   - Only top 5 anomalies get AI explanations
   - Adjust `threshold` parameter to reduce false positives
   - Use shorter `days` period for frequent checks

2. **Insights Generator:**
   - Cache results and regenerate only daily
   - Use for weekly/monthly reviews rather than real-time

3. **Natural Language Query:**
   - Implement caching for common questions
   - Use `temperature: 0.4` for consistent answers

4. **Model Selection:**
   - Use `anthropic/claude-3.5-sonnet` for quality (default)
   - Use `openai/gpt-3.5-turbo` for lower cost
   - Use `anthropic/claude-3-haiku` for fastest/cheapest responses

---

## Success Criteria

✅ **Phase 3 is complete when:**

1. Creative analysis endpoint returns AI insights for ads
2. Anomaly detection identifies unusual metric patterns
3. AI explanations are generated and stored
4. Insights generator provides strategic recommendations
5. Natural language query answers questions accurately
6. All endpoints handle errors gracefully
7. OpenRouter API integration is working
8. Database stores AI-generated data correctly

---

## Next Steps

After Phase 3 is complete:

- **Phase 4:** Build frontend dashboard with Next.js
- **Phase 5:** Implement email OTP authentication
- **Phase 6:** Add cron jobs for automated syncing and alerts

---

## API Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/analyze-creative` | POST | Analyze ad creative |
| `/api/ai/creative-analyses/:adId` | GET | Get creative analyses |
| `/api/ai/detect-anomalies` | GET | Detect metric anomalies |
| `/api/ai/anomalies` | GET | Get stored anomalies |
| `/api/ai/anomalies/:id/resolve` | PATCH | Resolve anomaly |
| `/api/ai/insights` | GET | Generate insights |
| `/api/ai/query` | POST | Natural language query |

---

**Happy Testing! 🚀**
