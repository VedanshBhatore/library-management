import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';
import { getStudentStanding } from '../lib/studentStanding.js';
import { checkBorrowingStanding } from '../rules.js';
import { syncExpiredReservations } from '../lib/reservationExpiry.js';

export const reservationRouter = Router();

reservationRouter.use(requireAuth);
reservationRouter.use(asyncHandler(async (req, res, next) => {
  await syncExpiredReservations();
  next();
}));

const reserveSchema = z.object({ bookId: z.string().min(1) });

reservationRouter.post(
  '/',
  requireRole('STUDENT'),
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
  requireRole('STUDENT'),
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

// Librarian view: every book that currently has at least one open
// (WAITING or READY) reservation, grouped by title with its full queue,
// sorted by demand (most-reserved title first) so a librarian scanning the
// list immediately sees what's most contested rather than hunting for it.
reservationRouter.get(
  '/',
  requireRole('LIBRARIAN'),
  asyncHandler(async (req, res) => {
    const reservations = await prisma.reservation.findMany({
      where: { status: { in: ['WAITING', 'READY'] } },
      include: {
        book: { include: { copies: true } },
        student: { select: { id: true, name: true, email: true, enrollmentNo: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byBook = new Map();
    for (const r of reservations) {
      const entry = byBook.get(r.bookId) ?? { book: r.book, reservations: [] };
      entry.reservations.push(r);
      byBook.set(r.bookId, entry);
    }

    const books = [...byBook.values()]
      .map(({ book, reservations }) => {
        let waitingSeen = 0;
        const hasReady = reservations.some((r) => r.status === 'READY');
        const { copies, ...bookInfo } = book;
        const availableCopies = copies.filter((c) => c.status === 'AVAILABLE');

        return {
          book: bookInfo,
          reservationCount: reservations.length,
          availableCopies,
          reservations: reservations.map((r) => {
            const queuePosition = r.status === 'WAITING' ? ++waitingSeen : null;
            return {
              id: r.id,
              student: r.student,
              status: r.status,
              createdAt: r.createdAt,
              expiresAt: r.expiresAt,
              // Queue position among WAITING only; READY has no position, it's next.
              queuePosition,
              // Who the "Allot" action should target: the READY hold if one
              // exists, otherwise whoever is first in the WAITING line —
              // never anyone further back, so a copy can't be handed to the
              // 2nd-in-line while the 1st is still waiting.
              isNextInLine: r.status === 'READY' || (!hasReady && queuePosition === 1),
            };
          }),
        };
      })
      .sort((a, b) => b.reservationCount - a.reservationCount || a.book.title.localeCompare(b.book.title));

    res.json({ data: { books } });
  })
);
