/**
 * Vercel Serverless Function — PassMate API
 * Catch-all handler at /api/* that runs the Express backend.
 * SQLite stored in /tmp/passmate.db (auto-seeded on cold start).
 */
import app, { setupSchema, seed } from '../../backend/index.js';

// Track if the DB has been initialized in this function instance
let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await setupSchema();
    await seed();
    initialized = true;
  }
  // Let Express handle the request
  return app(req, res);
}
