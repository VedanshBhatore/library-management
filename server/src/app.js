import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Express app assembly. Routes for books/copies/rentals/etc. are added in
// later build phases; this wires up auth for Phase 2.
export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/auth', authRouter);

  // Must be registered last: Express only treats a 4-arg middleware as an
  // error handler, and it only catches errors from routes mounted before it.
  app.use(errorHandler);

  return app;
}
