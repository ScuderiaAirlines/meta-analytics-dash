import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from './utils/prisma';
import { requestLogger, errorHandler, notFoundHandler } from './utils/middleware';
import Logger from './utils/logger';

// Routes
import campaignsRouter from './routes/campaigns';
import adsetsRouter from './routes/adsets';
import adsRouter from './routes/ads';
import metricsRouter from './routes/metrics';
import syncRouter from './routes/sync';
import aiRouter from './routes/ai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/campaigns', campaignsRouter);
app.use('/api/adsets', adsetsRouter);
app.use('/api/ads', adsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/ai', aiRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      Logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      Logger.info(`🚀 Server running on port ${PORT}`);
      Logger.info(`📊 API available at http://localhost:${PORT}/api`);
      Logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  Logger.info('Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();
