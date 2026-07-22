import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const catalogueRouter = Router();

// Read-only search available to both roles (a librarian browsing the
// catalogue is harmless); management operations live in book.routes.js.
catalogueRouter.use(requireAuth);

function summarize(book, myReservation) {
  // LOST/DAMAGED copies are out of circulation, so they count toward
  // neither total nor available — "3 of 5 available" should mean 5 usable
  // copies exist, 3 of which are on the shelf right now.
  const usable = book.copies.filter((c) => c.status === 'AVAILABLE' || c.status === 'ISSUED');
  const available = usable.filter((c) => c.status === 'AVAILABLE');
  const { copies, ...rest } = book;
  return {
    ...rest,
    totalCopies: usable.length,
    availableCopies: available.length,
    myReservationStatus: myReservation?.status ?? null,
  };
}

catalogueRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, category } = req.query;
    const where = {
      AND: [
        category ? { category } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { isbn: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const books = await prisma.book.findMany({ where, include: { copies: true }, orderBy: { title: 'asc' } });

    const myReservations = await prisma.reservation.findMany({
      where: { studentId: req.user.id, status: { in: ['WAITING', 'READY'] } },
    });
    const myReservationByBook = new Map(myReservations.map((r) => [r.bookId, r]));

    res.json({ data: { books: books.map((b) => summarize(b, myReservationByBook.get(b.id))) } });
  })
);

catalogueRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({ where: { id: req.params.id }, include: { copies: true } });
    if (!book) return res.status(404).json({ error: { message: 'Book not found.' } });

    const myReservation = await prisma.reservation.findFirst({
      where: { bookId: book.id, studentId: req.user.id, status: { in: ['WAITING', 'READY'] } },
    });
    res.json({ data: { book: summarize(book, myReservation) } });
  })
);
