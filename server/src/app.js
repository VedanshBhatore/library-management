import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Express app assembly. Auth routes and role middleware are wired in here
// starting Phase 2; for now this just proves the scaffold boots.
export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  return app;
}
