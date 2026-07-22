import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';

export const bookRouter = Router();

// Book CRUD and copy creation are librarian-only management operations.
// Read-only search for both roles lives in catalogue.routes.js instead.
bookRouter.use(requireAuth, requireRole('LIBRARIAN'));

const currentYear = new Date().getFullYear();

const bookSchema = z.object({
  isbn: z.string().trim().min(1, 'ISBN is required.'),
  title: z.string().trim().min(1, 'Title is required.'),
  author: z.string().trim().min(1, 'Author is required.'),
  publisher: z.string().trim().min(1, 'Publisher is required.'),
  category: z.string().trim().min(1, 'Category is required.'),
  year: z.number().int().min(-3000).max(currentYear + 1, `Year can't be in the future.`),
});
const bookUpdateSchema = bookSchema.partial();

const copySchema = z.object({
  barcode: z.string().trim().min(1, 'Barcode is required.'),
});

bookRouter.get(
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
              ],
            }
          : {},
      ],
    };
    const books = await prisma.book.findMany({
      where,
      include: { copies: { orderBy: { barcode: 'asc' } } },
      orderBy: { title: 'asc' },
    });
    res.json({ data: { books } });
  })
);

bookRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: { copies: { orderBy: { barcode: 'asc' } } },
    });
    if (!book) return res.status(404).json({ error: { message: 'Book not found.' } });
    res.json({ data: { book } });
  })
);

bookRouter.post(
  '/',
  validateBody(bookSchema),
  asyncHandler(async (req, res) => {
    const book = await prisma.book.create({ data: req.body });
    res.status(201).json({ data: { book } });
  })
);

bookRouter.patch(
  '/:id',
  validateBody(bookUpdateSchema),
  asyncHandler(async (req, res) => {
    const book = await prisma.book.update({ where: { id: req.params.id }, data: req.body });
    res.json({ data: { book } });
  })
);

bookRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    // If the book still has copies, Prisma's FK constraint rejects this
    // (P2003, mapped to a 409 by errorHandler) — copies must be removed
    // first, and a copy with rental history can't be removed either. This
    // keeps book/copy history immutable without needing manual checks here.
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ data: { ok: true } });
  })
);

bookRouter.post(
  '/:id/copies',
  validateBody(copySchema),
  asyncHandler(async (req, res) => {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ error: { message: 'Book not found.' } });

    const copy = await prisma.bookCopy.create({
      data: { bookId: book.id, barcode: req.body.barcode, status: 'AVAILABLE' },
    });
    res.status(201).json({ data: { copy } });
  })
);
