import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { setupSchema } from './db.js';
import seed from './utils/seed.js';

// Routes
import authRoutes from './routes/auth.js';
import passRoutes from './routes/passes.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';

export const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173',
    /\.vercel\.app$/,       // all vercel preview URLs
    process.env.VITE_FRONTEND_URL, // custom domain if set
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toTimeString().slice(0, 8)}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'PassMate API', version: '1.0.0' }));

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Async startup — setup schema then seed then listen
async function start() {
  try {
    await setupSchema();
    await seed();
    app.listen(PORT, () => {
      console.log(`\n🚀 PassMate API → http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/health`);
      console.log(`\n🔑 OTP bypass: use "123456" as the OTP for any account`);
      console.log(`\n👤 Demo accounts:`);
      console.log(`   Student  → USN: 1DS22CS042  Mobile: 9845012345`);
      console.log(`   Warden   → Mobile: 9845001234  (no USN needed)`);
      console.log(`   Guard    → Mobile: 9900012345`);
      console.log(`   Admin    → Mobile: 9000000001\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Only start the HTTP server when running locally (not on Vercel serverless)
if (!process.env.VERCEL) {
  start();
}

export { setupSchema, seed };
export default app;
