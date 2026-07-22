import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const fineRouter = Router();

fineRouter.use(requireAuth);

fineRouter.get(
  '/mine',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const fines = await prisma.fine.findMany({
      where: { rental: { studentId: req.user.id } },
      include: { rental: { include: { copy: { include: { book: true } } } } },
      orderBy: { id: 'desc' },
    });
    res.json({ data: { fines } });
  })
);

fineRouter.post(
  '/:id/collect',
  requireRole('LIBRARIAN'),
  asyncHandler(async (req, res) => {
    const fine = await prisma.fine.findUnique({ where: { id: req.params.id } });
    if (!fine) return res.status(404).json({ error: { message: 'Fine not found.' } });
    if (fine.isPaid) return res.status(409).json({ error: { message: 'This fine has already been paid.' } });

    const updated = await prisma.fine.update({
      where: { id: fine.id },
      data: { isPaid: true, paidAt: new Date() },
    });

    await prisma.activityLog.create({
      data: { actorId: req.user.id, action: 'COLLECT_FINE', entityType: 'Fine', entityId: fine.id },
    });

    res.json({ data: { fine: updated } });
  })
);
