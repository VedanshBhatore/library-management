import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { bookRouter } from './routes/book.routes.js';
import { copyRouter } from './routes/copy.routes.js';
import { catalogueRouter } from './routes/catalogue.routes.js';
import { rentalRouter } from './routes/rental.routes.js';
import { reservationRouter } from './routes/reservation.routes.js';
import { fineRouter } from './routes/fine.routes.js';
import { studentRouter } from './routes/student.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Express app assembly — every domain area gets its own router file under
// src/routes/, each responsible for its own auth/role gating.
export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/books', bookRouter);
  app.use('/api/copies', copyRouter);
  app.use('/api/catalogue', catalogueRouter);
  app.use('/api/rentals', rentalRouter);
  app.use('/api/reservations', reservationRouter);
  app.use('/api/fines', fineRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/reports', reportRouter);

  // Must be registered last: Express only treats a 4-arg middleware as an
  // error handler, and it only catches errors from routes mounted before it.
  app.use(errorHandler);

  return app;
}
