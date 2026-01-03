# Meta Ads Analytics Suite with AI Integration

A production-ready analytics platform for Meta (Facebook) advertising campaigns with AI-powered insights, creative analysis, and anomaly detection.

## 🚀 Features

### Core Analytics
- **Real-time Campaign Monitoring** - Track campaigns, ad sets, and individual ads
- **Performance Metrics** - Spend, impressions, clicks, conversions, CPC, CTR, ROAS
- **Historical Tracking** - Daily metrics storage and trend analysis
- **Multi-level Insights** - Campaign, ad set, and creative-level breakdowns

### AI-Powered Features
- **Creative Analysis** - AI scoring of ad creatives with performance predictions
- **Anomaly Detection** - Automatic flagging of unusual metric changes with AI explanations
- **Insight Generation** - Pattern recognition and actionable recommendations
- **Natural Language Query** - Ask questions about your data in plain English

### Automation
- **Automated Syncing** - Meta API data sync every 6 hours
- **Daily Insights** - Automatic metrics pull daily at 8 AM
- **Smart Caching** - AI response caching for faster repeat queries
- **Error Recovery** - Exponential backoff retry logic

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **node-cron** - Job scheduling
- **axios** - HTTP client for Meta API
- **facebook-business SDK** - Official Meta Graph API client

### Frontend
- **Next.js 14** - React framework with App Router
- **shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Data visualization
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Icon library

### AI Integration
- **OpenRouter API** - Multi-model AI gateway
- Vision models for creative analysis
- Language models for insights and anomaly detection

### DevOps
- **Docker** + **Docker Compose** - Containerization
- **nginx** (optional) - Reverse proxy for SSL
- Single port deployment (1111)

## 📁 Project Structure

```
meta-analytics-dash/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express server
│   │   ├── routes/           # API routes
│   │   ├── services/
│   │   │   ├── metaApi.js    # Meta API client
│   │   │   ├── aiService.js  # OpenRouter integration
│   │   │   └── syncService.js # Data synchronization
│   │   ├── prompts.js        # AI prompt templates
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── dashboard/        # Main dashboard
│   │   ├── creatives/        # Creative analysis
│   │   ├── anomalies/        # Anomaly feed
│   │   ├── insights/         # AI insights
│   │   └── query/            # Natural language search
│   ├── components/           # shadcn/ui components
│   ├── lib/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── PROGRESS.md
└── GUIDE.md
```

## 🗄️ Database Schema

### Core Entities
- **Campaign** - Top-level campaign data
- **AdSet** - Ad set configurations and targeting
- **Ad** - Individual ad creatives

### Analytics
- **DailyMetric** - Time-series performance data
- **CreativeAnalysis** - AI analysis results for creatives
- **Anomaly** - Detected metric deviations with AI explanations

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Meta Business Account with API access
- OpenRouter API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd meta-analytics-dash
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env and add your API keys
```

3. **Start the stack**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec backend npx prisma migrate deploy
```

5. **Initial data sync**
```bash
curl -X POST http://localhost:1111/api/sync
```

6. **Access the dashboard**
```
http://localhost:1111
```

## 🔧 Configuration

### Environment Variables

#### Meta API
- `META_ACCESS_TOKEN` - Your Meta Graph API access token
- `META_AD_ACCOUNT_ID` - Your Meta Ad Account ID

#### OpenRouter
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `OPENROUTER_MODEL` - Default model (optional)

#### Database
- `DATABASE_URL` - PostgreSQL connection string

#### Server
- `PORT` - Backend port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## 📊 API Endpoints

### Data Sync
- `POST /api/sync` - Trigger manual sync from Meta API
- `GET /api/sync/status` - Check last sync status

### Analytics
- `GET /api/campaigns` - List all campaigns with metrics
- `GET /api/campaigns/:id` - Campaign details with ad sets
- `GET /api/adsets/:id` - Ad set details with ads
- `GET /api/metrics` - Get metrics with filters (date range, entity type)

### AI Features
- `POST /api/analyze-creative` - Analyze ad creative with AI
- `GET /api/anomalies` - List detected anomalies
- `GET /api/insights` - Get AI-generated insights
- `POST /api/query` - Natural language query

## 🔐 Authentication

Basic email OTP authentication:
- Email-based login
- OTP sent to registered email
- Session-based authentication

## 📈 Usage

### Dashboard
View key metrics across all campaigns:
- Total spend, ROAS, conversions
- Performance trends (line/bar charts)
- Campaign comparison table

### Creative Analysis
- Upload ad creatives for AI scoring
- Compare against historical top performers
- Get actionable recommendations

### Anomaly Detection
- Automatic detection of metric deviations >25%
- AI-powered explanations
- Severity-based prioritization

### Natural Language Queries
Ask questions like:
- "Which campaigns spent the most last week?"
- "Show me ads with ROAS above 3"
- "What's the average CTR for active campaigns?"

## 🔄 Automated Jobs

- **Data Sync** - Every 6 hours
- **Daily Insights** - Every day at 8 AM
- **Anomaly Detection** - Hourly

## 🐛 Troubleshooting

### Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

### Meta API Issues
- Check token validity: https://developers.facebook.com/tools/debug/accesstoken/
- Verify permissions: ads_read, ads_management
- Check rate limits in Meta Business Manager

## 📚 Documentation

- [GUIDE.md](./GUIDE.md) - Complete VPS deployment guide
- [PROGRESS.md](./PROGRESS.md) - Feature completion tracking
- [Prisma Docs](https://www.prisma.io/docs)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [OpenRouter API](https://openrouter.ai/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- shadcn/ui for the beautiful component library
- Meta for the Marketing API
- OpenRouter for AI integration
- Prisma for the excellent ORM

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Meta API status page

---

Built with ❤️ for smarter Meta advertising
