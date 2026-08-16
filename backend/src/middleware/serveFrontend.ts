import express from 'express';
import path from 'path';
import fs from 'fs';

const serveFrontend = (frontendFolder = '../frontend/dist') => {
  const router = express.Router();

  const rootDir = process.cwd();
  const frontendPath = path.resolve(rootDir, frontendFolder);
  const indexPath = path.join(frontendPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.warn('⚠️ Frontend build not found:', indexPath);
  } else {
    console.log('✅ Frontend found:', indexPath);
  }

  // Serve React/Vite static files
  router.use(express.static(frontendPath));

  // React SPA fallback
  // Do not handle /api routes here
  router.get(/^(?!\/api).*/, (req, res) => {
    if (req.path.includes('.')) {
      return res.status(404).end();
    }

    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({
        message: 'Frontend build not found',
      });
    }

    return res.sendFile(indexPath);
  });

  return router;
};

export default serveFrontend;