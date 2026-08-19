import path from 'path';
import fs from 'fs';
import express, { Application, NextFunction, Request, Response } from 'express';
import logger from '../utils/logger';

// backend/src/middleware -> backend/public (also correct once compiled to
// backend/dist/middleware -> backend/public, same relative depth).
// __dirname is a native CommonJS global — no ESM interop needed here.
const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');

/**
 * Serves the built React SPA from backend/public (see frontend's
 * vite.config.ts — `npm run build` in frontend/ outputs directly here).
 * Mounted AFTER every /api router and the /api 404 handler, so it only
 * ever sees requests that aren't API calls.
 *
 * Two parts:
 *   1. express.static for actual built assets (JS/CSS/images, hashed
 *      filenames — safe to cache aggressively)
 *   2. a catch-all that returns index.html for everything else, so
 *      client-side routes (e.g. /customers/:id) work on a hard refresh
 *      instead of 404ing at the server
 *
 * If backend/public/index.html doesn't exist (frontend hasn't been built
 * yet — e.g. in local dev, where Vite's own dev server handles the
 * frontend instead), this no-ops with a one-time log message rather than
 * crashing the API.
 */
export default function serveFrontend(app: Application): void {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    logger.info(
      `Frontend build not found at ${PUBLIC_DIR} — skipping static serving. ` +
        `Run "npm run build" in frontend/ to enable it (see DEPLOYMENT.md).`
    );
    return;
  }

  app.use(
    express.static(PUBLIC_DIR, {
      index: false, // never auto-serve index.html for a directory hit — the catch-all below handles that explicitly
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        // index.html itself must never be cached — every deploy replaces
        // its hashed asset references, and a stale cached index.html
        // would keep pointing at assets that no longer exist.
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      next(); // never intercept API routes, even ones the routers didn't match
      return;
    }
    res.sendFile(indexPath);
  });
}
