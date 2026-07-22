import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { syncOverdueStatuses } from '../lib/overdue.js';

export const reportRouter = Router();

reportRouter.use(requireAuth, requireRole('LIBRARIAN'));

reportRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    await syncOverdueStatuses();

    const [totalTitles, copiesIssued, overdueCount, finesCollectedAgg] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count({ where: { status: 'ISSUED' } }),
      prisma.rental.count({ where: { returnDate: null, dueDate: { lt: new Date() } } }),
      prisma.fine.aggregate({ where: { isPaid: true }, _sum: { amount: true } }),
    ]);

    res.json({
      data: {
        totalTitles,
        copiesIssued,
        overdueCount,
        finesCollected: finesCollectedAgg._sum.amount ?? 0,
      },
    });
  })
);

reportRouter.get(
  '/activity',
  asyncHandler(async (req, res) => {
    const logs = await prisma.activityLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ data: { logs } });
  })
);
