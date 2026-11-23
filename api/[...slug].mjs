/**
 * Vercel Serverless Function — PassMate API
 * Catch-all handler that runs the Express backend.
 * All backend code is bundled locally inside api/_backend/
 * Database: Supabase PostgreSQL (via SUPABASE_DB_URL) + Firestore (via Firebase Admin).
 */
import express from 'express';
import cors from 'cors';
import { setupSchema, db } from './_backend/db.js';
import seed from './_backend/utils/seed.js';
import authRoutes from './_backend/routes/auth.js';
import passRoutes from './_backend/routes/passes.js';
import userRoutes from './_backend/routes/users.js';
import adminRoutes from './_backend/routes/admin.js';

const app = express();

// CORS — allow same Vercel domain and any *.vercel.app preview
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Track cold-start DB initialization
let initPromise = null;
let sqlAvailable = false;
let sqlInitError = null;

async function ensureInitialized() {
  if (!initPromise) {
    initPromise = (async () => {
      const hasSqlConfig = !!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
      if (!hasSqlConfig) {
        sqlAvailable = false;
        sqlInitError = 'No SQL connection string configured (SUPABASE_DB_URL is unset)';
        console.log('ℹ️ Running in Firestore-only mode (no SQL connection string configured)');
        return;
      }

      try {
        await setupSchema();
        await seed();
        sqlAvailable = true;
        console.log('✅ PostgreSQL DB initialized on Vercel cold start');
      } catch (err) {
        sqlAvailable = false;
        sqlInitError = err.message;
        console.warn('⚠️ PostgreSQL unavailable on cold start (running in Firestore-only mode):', err.message);
      }
    })();
  }
  return initPromise;
}

// Middleware to block SQL-dependent routes when SQL is unavailable
const requireSql = (_req, res, next) => {
  if (!sqlAvailable) {
    return res.status(503).json({
      error: 'SQL service unavailable',
      message: 'This endpoint requires the legacy PostgreSQL database, which is currently unreachable. The server is operating in Firestore-only mode.',
      code: 'SQL_UNAVAILABLE',
      ...(sqlInitError ? { details: sqlInitError } : {}),
    });
  }
  next();
};

// Guard for passes: Firestore routes (parent approval) work without SQL, other legacy routes require SQL
const passSqlGuard = (req, res, next) => {
  const url = req.originalUrl || req.path || '';
  const isFirestoreRoute =
    url.includes('/parent/') ||
    url.includes('/parent-approve') ||
    url.includes('/parent-token');

  if (!isFirestoreRoute && !sqlAvailable) {
    return res.status(503).json({
      error: 'SQL service unavailable',
      message: 'This endpoint requires the legacy PostgreSQL database, which is currently unreachable. The server is operating in Firestore-only mode.',
      code: 'SQL_UNAVAILABLE',
      ...(sqlInitError ? { details: sqlInitError } : {}),
    });
  }
  next();
};

app.use('/api/auth',  requireSql, authRoutes);
app.use('/api/passes', passSqlGuard, passRoutes);
app.use('/api/users',  requireSql, userRoutes);
app.use('/api/admin',  requireSql, adminRoutes);

app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'PassMate API',
    version: '1.0.0',
    env: 'vercel',
    mode: sqlAvailable ? 'hybrid' : 'firestore-only',
    firestore: 'enabled',
    sql: sqlAvailable ? 'connected' : 'unavailable',
  })
);
app.get('/api/health', (_req, res) =>
  res.json({
    status: 'ok',
    service: 'PassMate API',
    version: '1.0.0',
    env: 'vercel',
    mode: sqlAvailable ? 'hybrid' : 'firestore-only',
    firestore: 'enabled',
    sql: sqlAvailable ? 'connected' : 'unavailable',
  })
);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default async function handler(req, res) {
  await ensureInitialized();
  return app(req, res);
}
