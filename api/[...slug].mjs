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

app.use('/api/auth',  authRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/admin',  adminRoutes);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', service: 'PassMate API', version: '1.0.0', env: 'vercel' })
);
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'PassMate API', version: '1.0.0', env: 'vercel' })
);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Track cold-start DB initialization
let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    try {
      await setupSchema();
      await seed();
      initialized = true;
      console.log('✅ DB initialized on Vercel cold start');
    } catch (err) {
      console.error('❌ DB init failed:', err);
      return res.status(500).json({ error: 'DB initialization failed', message: err.message });
    }
  }
  return app(req, res);
}
