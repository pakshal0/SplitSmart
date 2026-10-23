import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import { groupExpenseRouter, singleExpenseRouter } from './routes/expenseRoutes.js';
import { groupSettlementRouter, singleSettlementRouter } from './routes/settlementRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Security headers (configure CSP to allow OCR workers and DiceBear avatars)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration - support cookies and credentials
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
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

// Serve static client assets in production if client/dist exists (Full-stack single service mode)
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized error handling
app.use(errorHandler);

export default app;
