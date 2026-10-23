import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import { groupExpenseRouter, singleExpenseRouter } from './routes/expenseRoutes.js';
import { groupSettlementRouter, singleSettlementRouter } from './routes/settlementRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration - support cookies and credentials
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, or origin check
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request body parsers & cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SplitSmart Backend API',
    uptime: process.uptime(),
  });
});

// Root API welcome endpoint
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SplitSmart API v1',
    docs: '/api/v1/health',
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/groups/:groupId/expenses', groupExpenseRouter);
app.use('/api/v1/expenses', singleExpenseRouter);
app.use('/api/v1/groups/:groupId/settlements', groupSettlementRouter);
app.use('/api/v1/settlements', singleSettlementRouter);
app.use('/api/v1/groups/:groupId', balanceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Centralized error handling
app.use(errorHandler);

export default app;
