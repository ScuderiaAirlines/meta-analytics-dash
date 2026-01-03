# Test Guide - Phase 1 & 2
## Meta Ads Analytics Suite - Backend Testing Guide

This guide will walk you through deploying and testing all features completed in Phase 1 (Foundation) and Phase 2 (Backend Core).

**Last Updated:** 2026-01-03

---

## ✅ What's Been Built So Far

### Phase 1: Foundation & Documentation
- Complete project structure (backend/frontend)
- Docker configuration for production deployment
- Next.js frontend with Tailwind CSS + shadcn/ui
- Prisma database schema
- Environment configuration

### Phase 2: Backend Core
- Express server with TypeScript
- Meta API client with retry logic
- Full sync service (campaigns, adsets, ads, metrics)
- REST API endpoints (campaigns, adsets, ads, metrics, sync)
- Error handling and logging middleware
- Database integration with Prisma

---

## 📋 Prerequisites

### Required Software
- [x] Docker Desktop (or Docker + Docker Compose)
- [x] Node.js 20+ (for local development)
- [x] Git
- [x] A code editor (VS Code recommended)
- [x] curl or Postman (for API testing)

### Required Accounts & Keys
- [x] Meta Business Account
- [x] Meta Access Token with permissions: `ads_read`, `ads_management`
- [x] Meta Ad Account ID (format: `act_1234567890`)
- [x] OpenRouter API Key (for Phase 3, but setup now)

### Get Your Meta Access Token

1. **Go to Meta for Developers:** https://developers.facebook.com/
2. **Navigate to:** Your App → Tools → Access Token Tool
3. **Generate User Access Token** with these permissions:
   - `ads_read`
   - `ads_management`
4. **Copy the token** - it will look like: `EAABwzLixnjYBO...`

**Verify your token works:**
```bash
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_TOKEN_HERE"
```

You should see a list of your ad accounts.

### Get Your Ad Account ID

From the response above, find your ad account ID. It looks like: `act_1234567890`

---

## 🚀 Step 1: Clone and Setup

### 1.1 Clone the Repository

```bash
git clone <your-repository-url>
cd meta-analytics-dash
```

### 1.2 Verify File Structure

```bash
tree -L 2 -I 'node_modules'
```

You should see:
```
meta-analytics-dash/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── PROGRESS.md
└── GUIDE.md
```

### 1.3 Create Environment File

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

### 1.4 Configure Environment Variables

Edit `.env` with your actual credentials:

```bash
# Database
DATABASE_URL="postgresql://postgres:mysecurepassword123@postgres:5432/metaads"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=mysecurepassword123
POSTGRES_DB=metaads

# Meta API (IMPORTANT: Replace with your actual values)
META_ACCESS_TOKEN=EAABwzLixnjYBO...your_actual_token_here
META_AD_ACCOUNT_ID=act_1234567890

# OpenRouter (Get from https://openrouter.ai/)
OPENROUTER_API_KEY=sk-or-v1-...your_key_here
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Backend
PORT=3000
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://backend:3000

# Email (Optional for Phase 2, required for Phase 5)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Session
SESSION_SECRET=generate_a_random_32_character_secret_here
```

**Generate a secure SESSION_SECRET:**
```bash
openssl rand -hex 32
```

---

## 🐳 Step 2: Docker Deployment

### 2.1 Start All Services

```bash
docker-compose up -d
```

**Expected output:**
```
Creating network "meta-analytics-dash_meta-analytics-network" ... done
Creating volume "meta-analytics-dash_postgres_data" ... done
Creating meta-analytics-postgres ... done
Creating meta-analytics-backend  ... done
Creating meta-analytics-frontend ... done
```

### 2.2 Check Service Status

```bash
docker-compose ps
```

**Expected output:**
```
NAME                        STATUS              PORTS
meta-analytics-postgres     Up (healthy)        0.0.0.0:5432->5432/tcp
meta-analytics-backend      Up (healthy)        0.0.0.0:3000->3000/tcp
meta-analytics-frontend     Up (healthy)        0.0.0.0:1111->3000/tcp
```

All services should show `Up (healthy)` status.

### 2.3 View Logs

**All services:**
```bash
docker-compose logs -f
```

**Backend only:**
```bash
docker-compose logs -f backend
```

**Look for these success messages:**
```
backend  | ✅ Database connected successfully
backend  | 🚀 Server running on port 3000
backend  | 📊 API available at http://localhost:3000/api
backend  | 🏥 Health check: http://localhost:3000/api/health
```

### 2.4 Troubleshooting Docker Issues

**If services fail to start:**

```bash
# Check logs for errors
docker-compose logs backend

# Common issues:
# 1. Port already in use
sudo lsof -i :1111  # Check what's using port 1111
sudo lsof -i :3000  # Check what's using port 3000

# 2. Rebuild if code changed
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Reset everything (CAUTION: deletes database data)
docker-compose down -v
docker-compose up -d
```

---

## 🗄️ Step 3: Database Setup

### 3.1 Run Prisma Migrations

```bash
docker-compose exec backend npx prisma migrate deploy
```

**Expected output:**
```
Applying migration `20260103_init`
Database migrations completed successfully
```

If you see errors, the database might not be ready yet. Wait 10 seconds and try again.

### 3.2 Verify Database Schema

```bash
docker-compose exec backend npx prisma studio
```

This opens Prisma Studio at `http://localhost:5555`

**Expected tables:**
- Campaign
- AdSet
- Ad
- DailyMetric
- CreativeAnalysis
- Anomaly
- User
- OTP

Press `Ctrl+C` to close Prisma Studio.

### 3.3 Direct Database Access (Optional)

```bash
docker-compose exec postgres psql -U postgres -d metaads
```

**Useful commands:**
```sql
-- List all tables
\dt

-- Check Campaign table structure
\d "Campaign"

-- Count records
SELECT COUNT(*) FROM "Campaign";

-- Exit
\q
```

---

## 🧪 Step 4: API Testing

### 4.1 Health Check

**Test the health endpoint:**
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-03T20:30:45.123Z",
  "version": "1.0.0"
}
```

✅ **Success:** Backend is running!

### 4.2 Trigger Initial Data Sync

**Sync data from Meta API:**
```bash
curl -X POST http://localhost:3000/api/sync
```

**This will take 30-90 seconds depending on your account size.**

**Expected response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "stats": {
      "campaigns": { "created": 5, "updated": 0 },
      "adsets": { "created": 12, "updated": 0 },
      "ads": { "created": 45, "updated": 0 },
      "metrics": { "created": 35 }
    },
    "errors": [],
    "duration": 45234,
    "timestamp": "2026-01-03T20:31:00.000Z"
  }
}
```

**Possible errors:**

1. **Invalid Meta Token:**
```json
{
  "success": false,
  "errors": ["Campaign sync error: Invalid OAuth access token"]
}
```
**Fix:** Check your `META_ACCESS_TOKEN` in `.env`

2. **Sync already in progress:**
```json
{
  "success": false,
  "error": { "message": "Sync already in progress" }
}
```
**Fix:** Wait for current sync to complete, then retry

3. **Database connection error:**
```json
{
  "success": false,
  "errors": ["Fatal error: Can't reach database server"]
}
```
**Fix:** Check if PostgreSQL is running: `docker-compose ps postgres`

### 4.3 Check Sync Status

```bash
curl http://localhost:3000/api/sync/status
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "syncInProgress": false,
    "lastSync": {
      "success": true,
      "stats": {
        "campaigns": { "created": 5, "updated": 0 },
        "adsets": { "created": 12, "updated": 0 },
        "ads": { "created": 45, "updated": 0 },
        "metrics": { "created": 35 }
      },
      "errors": [],
      "duration": 45234,
      "timestamp": "2026-01-03T20:31:00.000Z"
    }
  }
}
```

### 4.4 List All Campaigns

```bash
curl http://localhost:3000/api/campaigns
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx123456",
      "campaignId": "120210000000000",
      "name": "Summer Sale 2024",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "dailyBudget": 100.0,
      "createdAt": "2024-06-01T00:00:00.000Z",
      "updatedAt": "2026-01-03T20:31:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

✅ **Success:** You can see your Meta campaigns!

### 4.5 Get Campaign Details

**Use a campaignId from the previous response:**
```bash
curl http://localhost:3000/api/campaigns/120210000000000
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "campaign": {
      "id": "clxxx123456",
      "campaignId": "120210000000000",
      "name": "Summer Sale 2024",
      "status": "ACTIVE",
      "objective": "CONVERSIONS",
      "dailyBudget": 100.0
    },
    "adsets": [
      {
        "id": "clxxx789012",
        "adsetId": "120210000000001",
        "campaignId": "120210000000000",
        "name": "Ad Set 1",
        "status": "ACTIVE",
        "budget": 50.0
      }
    ],
    "metrics": [
      {
        "id": "clxxx345678",
        "entityId": "120210000000000",
        "entityType": "campaign",
        "date": "2026-01-02T00:00:00.000Z",
        "spend": 85.5,
        "impressions": 10234,
        "clicks": 456,
        "conversions": 12,
        "cpc": 0.19,
        "ctr": 4.45,
        "roas": 7.02
      }
    ],
    "summary": {
      "totalSpend": 595.5,
      "totalImpressions": 71638,
      "totalClicks": 3192,
      "totalConversions": 84
    }
  }
}
```

### 4.6 Query Metrics with Filters

**Get all campaign metrics for last 7 days:**
```bash
curl "http://localhost:3000/api/metrics?entityType=campaign&limit=20"
```

**Get metrics for specific date range:**
```bash
curl "http://localhost:3000/api/metrics?startDate=2026-01-01&endDate=2026-01-03"
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx111222",
      "entityId": "120210000000000",
      "entityType": "campaign",
      "date": "2026-01-02T00:00:00.000Z",
      "spend": 85.5,
      "impressions": 10234,
      "clicks": 456,
      "conversions": 12,
      "cpc": 0.19,
      "ctr": 4.45,
      "roas": 7.02
    }
  ],
  "aggregates": {
    "totalSpend": 595.5,
    "totalImpressions": 71638,
    "totalClicks": 3192,
    "totalConversions": 84,
    "avgCtr": 4.32,
    "avgCpc": 0.21,
    "avgRoas": 6.85
  },
  "pagination": {
    "total": 35,
    "limit": 100,
    "offset": 0
  }
}
```

### 4.7 Get Ad Set Details

**Use an adsetId from campaign details:**
```bash
curl http://localhost:3000/api/adsets/120210000000001
```

### 4.8 Get Ad Details

**Use an adId from ad set details:**
```bash
curl http://localhost:3000/api/ads/120210000000002
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "ad": {
      "id": "clxxx999888",
      "adId": "120210000000002",
      "adsetId": "120210000000001",
      "name": "Ad Creative 1",
      "status": "ACTIVE",
      "creativeId": "120210000000003",
      "thumbnailUrl": "https://scontent.xx.fbcdn.net/..."
    },
    "metrics": [...],
    "creativeAnalysis": null
  }
}
```

---

## 📊 Step 5: Verify Logs

### 5.1 Check Application Logs

**Backend logs in Docker:**
```bash
docker-compose logs backend --tail=50
```

**Backend logs in files:**
```bash
docker-compose exec backend ls -la logs/
docker-compose exec backend cat logs/app-2026-01-03.log
```

**Expected log entries:**
```
[2026-01-03T20:30:45.123Z] [INFO] ✅ Database connected successfully
[2026-01-03T20:30:45.234Z] [INFO] 🚀 Server running on port 3000
[2026-01-03T20:31:00.000Z] [INFO] Manual sync triggered
[2026-01-03T20:31:00.100Z] [INFO] Fetching campaigns for account: act_1234567890
[2026-01-03T20:31:01.200Z] [INFO] Fetched 5 campaigns
[2026-01-03T20:31:05.300Z] [INFO] Campaign sync complete: 5 created, 0 updated
[2026-01-03T20:31:45.400Z] [INFO] ✅ Full sync completed in 45234ms. Success: true
```

### 5.2 Database Record Verification

**Check record counts:**
```bash
docker-compose exec backend npx prisma studio
```

Or via SQL:
```bash
docker-compose exec postgres psql -U postgres -d metaads -c "
SELECT
  'Campaigns' as table_name, COUNT(*) as count FROM \"Campaign\"
UNION ALL
SELECT 'AdSets', COUNT(*) FROM \"AdSet\"
UNION ALL
SELECT 'Ads', COUNT(*) FROM \"Ad\"
UNION ALL
SELECT 'Metrics', COUNT(*) FROM \"DailyMetric\";
"
```

**Expected output:**
```
 table_name | count
------------+-------
 Campaigns  |     5
 AdSets     |    12
 Ads        |    45
 Metrics    |    35
```

---

## 🧪 Step 6: Advanced Testing

### 6.1 Test Error Handling

**Test 404 endpoint:**
```bash
curl http://localhost:3000/api/nonexistent
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "message": "Route not found",
    "path": "/api/nonexistent"
  }
}
```

**Test invalid campaign ID:**
```bash
curl http://localhost:3000/api/campaigns/invalid_id_12345
```

**Expected:**
```json
{
  "success": false,
  "error": {
    "message": "Campaign not found"
  }
}
```

### 6.2 Test Pagination

**Get campaigns with pagination:**
```bash
curl "http://localhost:3000/api/campaigns?limit=2&offset=0"
curl "http://localhost:3000/api/campaigns?limit=2&offset=2"
```

### 6.3 Test Filtering

**Get only active campaigns:**
```bash
curl "http://localhost:3000/api/campaigns?status=ACTIVE"
```

**Get only paused campaigns:**
```bash
curl "http://localhost:3000/api/campaigns?status=PAUSED"
```

### 6.4 Performance Testing

**Measure sync time:**
```bash
time curl -X POST http://localhost:3000/api/sync
```

**Measure query time:**
```bash
time curl http://localhost:3000/api/campaigns
```

### 6.5 Test Concurrent Syncs

**Open two terminals and run simultaneously:**
```bash
# Terminal 1
curl -X POST http://localhost:3000/api/sync

# Terminal 2 (run immediately)
curl -X POST http://localhost:3000/api/sync
```

**Expected:** Second request should return 409 Conflict

---

## 🎯 Step 7: Frontend Testing

### 7.1 Access Frontend

Open your browser and navigate to:
```
http://localhost:1111
```

**Expected:** You should see the landing page with:
- "Meta Ads Analytics Suite" heading
- "Go to Dashboard" button

### 7.2 Test Frontend Build

**Check frontend logs:**
```bash
docker-compose logs frontend
```

**Expected:**
```
frontend | Ready in XXXms
frontend | Local: http://localhost:3000
```

---

## ✅ Step 8: Verification Checklist

Use this checklist to verify Phase 1 & 2 are working correctly:

### Infrastructure
- [ ] Docker containers all running (`docker-compose ps`)
- [ ] All services show "healthy" status
- [ ] PostgreSQL accessible on port 5432
- [ ] Backend API accessible on port 3000
- [ ] Frontend accessible on port 1111

### Database
- [ ] Prisma migrations applied successfully
- [ ] All 8 tables created (Campaign, AdSet, Ad, DailyMetric, CreativeAnalysis, Anomaly, User, OTP)
- [ ] Can connect via `psql` or Prisma Studio

### Meta API Integration
- [ ] Health check returns 200 OK
- [ ] POST /api/sync completes without errors
- [ ] Campaigns synced to database
- [ ] Ad sets synced to database
- [ ] Ads synced to database
- [ ] Metrics synced for last 7 days

### API Endpoints
- [ ] GET /api/health works
- [ ] GET /api/campaigns returns data
- [ ] GET /api/campaigns/:id returns campaign details
- [ ] GET /api/adsets/:id works
- [ ] GET /api/ads/:id works
- [ ] GET /api/metrics returns metrics
- [ ] POST /api/sync works
- [ ] GET /api/sync/status works
- [ ] Pagination works on list endpoints
- [ ] Filtering works (status, date range)
- [ ] 404 handler works for invalid routes
- [ ] Error handler catches and logs errors

### Logging
- [ ] Request logs appear in console
- [ ] Logs written to files in logs/ directory
- [ ] Log levels working (INFO, WARN, ERROR)
- [ ] Sync operations logged with stats

### Frontend
- [ ] Landing page loads at http://localhost:1111
- [ ] No console errors in browser
- [ ] Frontend can be built successfully

---

## 🐛 Troubleshooting Guide

### Issue: "Database connection failed"

**Cause:** PostgreSQL not ready or wrong credentials

**Solution:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL in .env matches POSTGRES_* variables
cat .env | grep -E '(DATABASE_URL|POSTGRES)'

# Restart PostgreSQL
docker-compose restart postgres
```

### Issue: "Invalid OAuth access token"

**Cause:** Meta Access Token expired or invalid

**Solution:**
```bash
# Test your token manually
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_TOKEN"

# If invalid, generate new token at:
# https://developers.facebook.com/tools/explorer/

# Update .env and restart
docker-compose restart backend
```

### Issue: "No campaigns returned"

**Cause:** Ad account has no campaigns or wrong account ID

**Solution:**
```bash
# Verify your ad account ID
curl -X GET "https://graph.facebook.com/v18.0/me/adaccounts?access_token=YOUR_TOKEN"

# Update META_AD_ACCOUNT_ID in .env (format: act_XXXXXXXXX)
# Restart and sync again
docker-compose restart backend
curl -X POST http://localhost:3000/api/sync
```

### Issue: "Port already in use"

**Cause:** Another service using port 3000 or 1111

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :1111

# Kill the process or change ports in docker-compose.yml
# Change "1111:3000" to "8080:3000" for example
```

### Issue: "Migrations not applying"

**Cause:** Database not ready or schema mismatch

**Solution:**
```bash
# Reset migrations (CAUTION: deletes all data)
docker-compose exec backend npx prisma migrate reset

# Or generate Prisma client manually
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma migrate deploy
```

### Issue: "Sync takes too long"

**Cause:** Large ad account or slow connection

**Solution:**
- This is normal for accounts with 100+ campaigns
- Monitor progress in logs: `docker-compose logs -f backend`
- Sync can take 2-5 minutes for large accounts

### Issue: "Frontend not loading"

**Cause:** Build failed or backend not accessible

**Solution:**
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Check if backend is accessible from frontend container
docker-compose exec frontend wget -O- http://backend:3000/api/health
```

---

## 📈 Performance Benchmarks

**Expected performance for average ad accounts:**

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Health check | < 50ms | Should be near instant |
| List campaigns | < 200ms | With pagination (50 items) |
| Get campaign details | < 300ms | Includes adsets and metrics |
| Query metrics | < 500ms | With date filters |
| Initial sync | 30-120s | Depends on account size |
| Subsequent sync | 10-60s | Most items already exist |

**Large account (500+ campaigns):**
- Initial sync: 5-10 minutes
- Metrics sync: 2-5 minutes

---

## 🎉 Success Criteria

**Phase 1 & 2 are successful if:**

✅ All Docker containers are healthy
✅ Database has all tables with correct schema
✅ Meta API sync completes without errors
✅ All API endpoints return expected responses
✅ Campaigns, ad sets, ads visible via API
✅ Metrics data available for last 7 days
✅ Logs show all operations
✅ Frontend landing page loads
✅ No critical errors in logs

**If all checks pass, you're ready for Phase 3 (AI Integration)!** 🚀

---

## 📚 Next Steps

After successful testing of Phase 1 & 2:

1. **Phase 3:** AI Integration (OpenRouter, creative analysis, anomaly detection)
2. **Phase 4:** Frontend Dashboard (React components, charts, data visualization)
3. **Phase 5:** Authentication & Automation (Email OTP, cron jobs)
4. **Phase 6:** Production deployment and final testing

---

## 💡 Tips for Testing

1. **Use Postman Collection:** Create a Postman collection with all endpoints for easier testing
2. **Save Sample Responses:** Keep example responses for documentation
3. **Test with Real Data:** Use your actual Meta ad account for realistic testing
4. **Monitor Logs:** Always have `docker-compose logs -f backend` running in a terminal
5. **Backup Database:** Before major changes: `docker-compose exec postgres pg_dump -U postgres metaads > backup.sql`

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs backend`
2. Review this troubleshooting guide
3. Check GUIDE.md for deployment issues
4. Verify all environment variables in .env
5. Test Meta API token independently
6. Review PROGRESS.md for completed features

---

**Happy Testing! 🧪**
