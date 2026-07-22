import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';
import { calculateFine } from '../rules.js';

export const copyRouter = Router();

copyRouter.use(requireAuth, requireRole('LIBRARIAN'));

// ISSUED is deliberately not a settable target here — a copy only becomes
// ISSUED through POST /api/rentals/issue, never a direct status edit.
const statusSchema = z.object({
  status: z.enum(['AVAILABLE', 'LOST', 'DAMAGED']),
});

copyRouter.patch(
  '/:id',
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const copy = await prisma.bookCopy.findUnique({ where: { id: req.params.id } });
    if (!copy) return res.status(404).json({ error: { message: 'Copy not found.' } });

    const { status: targetStatus } = req.body;

    if (copy.status === 'ISSUED') {
      if (targetStatus === 'AVAILABLE') {
        return res.status(409).json({ error: { message: 'This copy is currently issued; return it before changing its status.' } });
      }
      // Marking an issued copy LOST/DAMAGED (e.g. a student reports losing
      // it) closes out its active rental in the same transaction — the
      // copy never passes back through AVAILABLE, so no reservation gets
      // promoted here (unlike a normal return).
      const rental = await prisma.rental.findFirst({ where: { copyId: copy.id, returnDate: null } });
      if (!rental) {
        return res.status(500).json({ error: { message: 'This copy is marked ISSUED but has no active rental. Data inconsistency — contact an administrator.' } });
      }
      const returnDate = new Date();
      const fineAmount = rental ? calculateFine(rental.dueDate, returnDate) : 0;

      const [, updatedCopy] = await prisma.$transaction([
        prisma.rental.update({ where: { id: rental.id }, data: { returnDate, status: 'RETURNED' } }),
        prisma.bookCopy.update({ where: { id: copy.id }, data: { status: targetStatus } }),
        ...(fineAmount > 0
          ? [prisma.fine.create({ data: { rentalId: rental.id, amount: fineAmount, isPaid: false } })]
          : []),
      ]);
      return res.json({ data: { copy: updatedCopy } });
    }

    const updatedCopy = await prisma.bookCopy.update({ where: { id: copy.id }, data: { status: targetStatus } });
    res.json({ data: { copy: updatedCopy } });
  })
);

copyRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const copy = await prisma.bookCopy.findUnique({ where: { id: req.params.id } });
    if (!copy) return res.status(404).json({ error: { message: 'Copy not found.' } });
    if (copy.status === 'ISSUED') {
      return res.status(409).json({ error: { message: 'This copy is currently issued and cannot be deleted.' } });
    }
    // A copy with any rental history hits the FK constraint (P2003 -> 409
    // via errorHandler) instead of silently erasing that history.
    await prisma.bookCopy.delete({ where: { id: copy.id } });
    res.json({ data: { ok: true } });
  })
);
