import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';

export const studentRouter = Router();

studentRouter.use(requireAuth, requireRole('LIBRARIAN'));

studentRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const where = {
      role: 'STUDENT',
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { enrollmentNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        enrollmentNo: true,
        isActive: true,
        createdAt: true,
        _count: { select: { rentalsAsStudent: true } },
      },
      orderBy: { name: 'asc' },
    });

    // Active-rental and unpaid-fine counts per student, in two grouped
    // queries rather than N+1 per-student lookups.
    const activeCounts = await prisma.rental.groupBy({
      by: ['studentId'],
      where: { studentId: { in: students.map((s) => s.id) }, returnDate: null },
      _count: { _all: true },
    });
    const activeByStudent = new Map(activeCounts.map((c) => [c.studentId, c._count._all]));

    const unpaidFines = await prisma.fine.findMany({
      where: { isPaid: false, rental: { studentId: { in: students.map((s) => s.id) } } },
      select: { amount: true, rental: { select: { studentId: true } } },
    });
    const unpaidByStudent = new Map();
    for (const fine of unpaidFines) {
      const id = fine.rental.studentId;
      unpaidByStudent.set(id, (unpaidByStudent.get(id) ?? 0) + fine.amount);
    }

    res.json({
      data: {
        students: students.map(({ _count, ...s }) => ({
          ...s,
          activeRentalsCount: activeByStudent.get(s.id) ?? 0,
          unpaidFinesTotal: unpaidByStudent.get(s.id) ?? 0,
        })),
      },
    });
  })
);

const statusSchema = z.object({ isActive: z.boolean() });

studentRouter.patch(
  '/:id/status',
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const student = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: { message: 'Student not found.' } });
    }

    const updated = await prisma.user.update({
      where: { id: student.id },
      data: { isActive: req.body.isActive },
    });

    await prisma.activityLog.create({
      data: {
        actorId: req.user.id,
        action: req.body.isActive ? 'ACTIVATE_STUDENT' : 'DEACTIVATE_STUDENT',
        entityType: 'User',
        entityId: student.id,
      },
    });

    const { passwordHash, ...safeUser } = updated;
    res.json({ data: { student: safeUser } });
  })
);
