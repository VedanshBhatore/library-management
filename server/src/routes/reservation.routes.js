import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';
import { getStudentStanding } from '../lib/studentStanding.js';
import { checkBorrowingStanding } from '../rules.js';
import { syncExpiredReservations } from '../lib/reservationExpiry.js';

export const reservationRouter = Router();

reservationRouter.use(requireAuth, requireRole('STUDENT'));
reservationRouter.use(asyncHandler(async (req, res, next) => {
  await syncExpiredReservations();
  next();
}));

const reserveSchema = z.object({ bookId: z.string().min(1) });

reservationRouter.post(
  '/',
  validateBody(reserveSchema),
  asyncHandler(async (req, res) => {
    const { bookId } = req.body;

    const book = await prisma.book.findUnique({ where: { id: bookId }, include: { copies: true } });
    if (!book) return res.status(404).json({ error: { message: 'Book not found.' } });

    // A student in bad standing shouldn't be able to queue up future
    // borrowing either — same account-standing rule as issue/renew.
    // activeRentalsCount is irrelevant to reserving, so it's zeroed out to
    // skip that branch of checkBorrowingStanding, same as the renew route.
    const standing = await getStudentStanding(req.user.id);
    const standingCheck = checkBorrowingStanding({ ...standing, activeRentalsCount: 0 });
    if (!standingCheck.eligible) {
      return res.status(409).json({ error: { message: standingCheck.reason } });
    }

    const hasAvailableCopy = book.copies.some((c) => c.status === 'AVAILABLE');
    if (hasAvailableCopy) {
      return res.status(409).json({ error: { message: 'A copy is available right now — borrow it instead of reserving.' } });
    }

    const existing = await prisma.reservation.findFirst({
      where: { bookId, studentId: req.user.id, status: { in: ['WAITING', 'READY'] } },
    });
    if (existing) {
      return res.status(409).json({ error: { message: 'You already have a reservation on this title.' } });
    }

    const reservation = await prisma.reservation.create({
      data: { bookId, studentId: req.user.id, status: 'WAITING' },
    });

    await prisma.activityLog.create({
      data: { actorId: req.user.id, action: 'RESERVE', entityType: 'Reservation', entityId: reservation.id },
    });

    res.status(201).json({ data: { reservation } });
  })
);

reservationRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const reservations = await prisma.reservation.findMany({
      where: { studentId: req.user.id },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });

    // Queue position only makes sense for WAITING reservations: how many
    // other WAITING reservations on the same title were created earlier.
    const withPosition = await Promise.all(
      reservations.map(async (r) => {
        if (r.status !== 'WAITING') return { ...r, queuePosition: null };
        const aheadCount = await prisma.reservation.count({
          where: { bookId: r.bookId, status: 'WAITING', createdAt: { lt: r.createdAt } },
        });
        return { ...r, queuePosition: aheadCount + 1 };
      })
    );

    res.json({ data: { reservations: withPosition } });
  })
);
