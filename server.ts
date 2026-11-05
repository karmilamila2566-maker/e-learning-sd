import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import generateTaskHandler from './api/generate-task.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for AI Task Generation (matches Vercel serverless function route)
  app.all('/api/generate-task', async (req, res) => {
    try {
      await generateTaskHandler(req, res);
    } catch (err: any) {
      console.error('Server error in /api/generate-task:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal server error' });
      }
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 BelajarYuk server active on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
