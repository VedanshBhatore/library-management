import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';
import { syncOverdueStatuses } from '../lib/overdue.js';
import { getStudentStanding } from '../lib/studentStanding.js';
import {
  computeDueDate,
  computeRenewedDueDate,
  computeReservationExpiry,
  calculateFine,
  daysLate,
  checkBorrowingStanding,
  checkRenewalEligibility,
} from '../rules.js';

export const rentalRouter = Router();

rentalRouter.use(requireAuth);

const rentalInclude = {
  copy: { include: { book: true } },
  student: { select: { id: true, name: true, email: true, enrollmentNo: true } },
  fine: true,
};

// --- Librarian: issue -------------------------------------------------------

const issueSchema = z.object({
  studentId: z.string().min(1),
  barcode: z.string().trim().min(1),
});

rentalRouter.post(
  '/issue',
  requireRole('LIBRARIAN'),
  validateBody(issueSchema),
  asyncHandler(async (req, res) => {
    await syncOverdueStatuses();
    const { studentId, barcode } = req.body;

    const student = await prisma.user.findUnique({ where: { id: studentId } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: { message: 'Student not found.' } });
    }
    if (!student.isActive) {
      return res.status(403).json({ error: { message: 'This student account has been deactivated.' } });
    }

    const copy = await prisma.bookCopy.findUnique({ where: { barcode }, include: { book: true } });
    if (!copy) return res.status(404).json({ error: { message: 'No copy found with that barcode.' } });
    if (copy.status !== 'AVAILABLE') {
      return res.status(409).json({ error: { message: `This copy is not available (status: ${copy.status}).` } });
    }

    const standing = await getStudentStanding(studentId);
    const eligibility = checkBorrowingStanding(standing);
    if (!eligibility.eligible) {
      return res.status(409).json({ error: { message: eligibility.reason } });
    }

    const issueDate = new Date();
    const dueDate = computeDueDate(issueDate);

    // If this student had a WAITING/READY reservation on this title, issuing
    // them a copy (whether it's the one held for them or just the next one
    // they asked for at the desk) fulfills it — otherwise it would keep
    // showing as an open reservation even though they now have the book.
    const ownReservation = await prisma.reservation.findFirst({
      where: { bookId: copy.bookId, studentId, status: { in: ['WAITING', 'READY'] } },
    });

    const [rental] = await prisma.$transaction([
      prisma.rental.create({
        data: { copyId: copy.id, studentId, issuedById: req.user.id, issueDate, dueDate, status: 'ACTIVE' },
        include: rentalInclude,
      }),
      prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'ISSUED' } }),
      ...(ownReservation
        ? [prisma.reservation.update({ where: { id: ownReservation.id }, data: { status: 'FULFILLED' } })]
        : []),
    ]);

    await prisma.activityLog.create({
      data: { actorId: req.user.id, action: 'ISSUE', entityType: 'Rental', entityId: rental.id },
    });

    res.status(201).json({ data: { rental } });
  })
);

// --- Librarian: return (barcode-driven, with a lookup preview step) --------

rentalRouter.get(
  '/lookup',
  requireRole('LIBRARIAN'),
  asyncHandler(async (req, res) => {
    const barcode = String(req.query.barcode ?? '').trim();
    if (!barcode) return res.status(400).json({ error: { message: 'Barcode is required.' } });

    const copy = await prisma.bookCopy.findUnique({ where: { barcode }, include: { book: true } });
    if (!copy) return res.status(404).json({ error: { message: 'No copy found with that barcode.' } });

    const rental = await prisma.rental.findFirst({
      where: { copyId: copy.id, returnDate: null },
      include: rentalInclude,
    });
    if (!rental) {
      return res.status(409).json({ error: { message: 'This copy is not currently checked out.' } });
    }

    const now = new Date();
    res.json({ data: { rental, daysLate: daysLate(rental.dueDate, now), fineOwed: calculateFine(rental.dueDate, now) } });
  })
);

const returnSchema = z.object({ barcode: z.string().trim().min(1) });

rentalRouter.post(
  '/return',
  requireRole('LIBRARIAN'),
  validateBody(returnSchema),
  asyncHandler(async (req, res) => {
    const { barcode } = req.body;

    const copy = await prisma.bookCopy.findUnique({ where: { barcode } });
    if (!copy) return res.status(404).json({ error: { message: 'No copy found with that barcode.' } });

    const rental = await prisma.rental.findFirst({ where: { copyId: copy.id, returnDate: null } });
    if (!rental) {
      return res.status(409).json({ error: { message: 'This copy is not currently checked out.' } });
    }

    const returnDate = new Date();
    const fineAmount = calculateFine(rental.dueDate, returnDate);

    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId: copy.bookId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });

    const operations = [
      prisma.rental.update({
        where: { id: rental.id },
        data: { returnDate, status: 'RETURNED' },
        include: rentalInclude,
      }),
      prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'AVAILABLE' } }),
    ];
    if (fineAmount > 0) {
      operations.push(prisma.fine.create({ data: { rentalId: rental.id, amount: fineAmount, isPaid: false } }));
    }
    if (nextReservation) {
      operations.push(
        prisma.reservation.update({
          where: { id: nextReservation.id },
          data: { status: 'READY', expiresAt: computeReservationExpiry(returnDate) },
        })
      );
    }

    const [updatedRental] = await prisma.$transaction(operations);

    await prisma.activityLog.create({
      data: { actorId: req.user.id, action: 'RETURN', entityType: 'Rental', entityId: rental.id },
    });

    res.json({ data: { rental: updatedRental, daysLate: daysLate(rental.dueDate, returnDate), fineAmount } });
  })
);

// --- Student: renew ---------------------------------------------------------

rentalRouter.post(
  '/:id/renew',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    await syncOverdueStatuses();

    const rental = await prisma.rental.findUnique({ where: { id: req.params.id }, include: { copy: true } });
    if (!rental || rental.studentId !== req.user.id) {
      return res.status(404).json({ error: { message: 'Rental not found.' } });
    }
    if (rental.returnDate) {
      return res.status(409).json({ error: { message: 'This rental has already been returned.' } });
    }

    // Overall account standing (overdue elsewhere / unpaid fines) blocks
    // renewal regardless of this specific rental. activeRentalsCount is
    // irrelevant to renewing (no new rental is created), so 0 is passed to
    // skip that branch of checkBorrowingStanding deliberately.
    const standing = await getStudentStanding(req.user.id);
    const standingCheck = checkBorrowingStanding({ ...standing, activeRentalsCount: 0 });
    if (!standingCheck.eligible) {
      return res.status(409).json({ error: { message: standingCheck.reason } });
    }

    const hasWaitingReservation = await prisma.reservation.findFirst({
      where: { bookId: rental.copy.bookId, status: 'WAITING' },
    });
    const renewalCheck = checkRenewalEligibility({
      dueDate: rental.dueDate,
      now: new Date(),
      renewalsCount: rental.renewalsCount,
      hasWaitingReservation: Boolean(hasWaitingReservation),
    });
    if (!renewalCheck.eligible) {
      return res.status(409).json({ error: { message: renewalCheck.reason } });
    }

    const updatedRental = await prisma.rental.update({
      where: { id: rental.id },
      data: { dueDate: computeRenewedDueDate(rental.dueDate), renewalsCount: { increment: 1 } },
      include: rentalInclude,
    });

    await prisma.activityLog.create({
      data: { actorId: req.user.id, action: 'RENEW', entityType: 'Rental', entityId: rental.id },
    });

    res.json({ data: { rental: updatedRental } });
  })
);

// --- Student: my rentals / history ------------------------------------------

// Attaches a precomputed renewal eligibility + reason to each rental so the
// client can disable the Renew button and show *why* without re-deriving
// any business rule itself.
async function withRenewalInfo(rentals, studentId) {
  const standing = await getStudentStanding(studentId);
  const standingCheck = checkBorrowingStanding({ ...standing, activeRentalsCount: 0 });

  const bookIds = [...new Set(rentals.map((r) => r.copy.bookId))];
  const waitingReservations = await prisma.reservation.findMany({
    where: { bookId: { in: bookIds }, status: 'WAITING' },
    select: { bookId: true },
  });
  const bookIdsWithWaiting = new Set(waitingReservations.map((r) => r.bookId));

  return rentals.map((rental) => {
    const renewalCheck = !standingCheck.eligible
      ? standingCheck
      : checkRenewalEligibility({
          dueDate: rental.dueDate,
          now: new Date(),
          renewalsCount: rental.renewalsCount,
          hasWaitingReservation: bookIdsWithWaiting.has(rental.copy.bookId),
        });
    return { ...rental, renewal: renewalCheck };
  });
}

rentalRouter.get(
  '/mine',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    await syncOverdueStatuses();
    const rentals = await prisma.rental.findMany({
      where: { studentId: req.user.id, returnDate: null },
      include: rentalInclude,
      orderBy: { dueDate: 'asc' },
    });
    res.json({ data: { rentals: await withRenewalInfo(rentals, req.user.id) } });
  })
);

rentalRouter.get(
  '/history',
  requireRole('STUDENT'),
  asyncHandler(async (req, res) => {
    const rentals = await prisma.rental.findMany({
      where: { studentId: req.user.id },
      include: rentalInclude,
      orderBy: { issueDate: 'desc' },
    });
    res.json({ data: { rentals } });
  })
);

// --- Librarian: overdue report ---------------------------------------------

async function getOverdueRentals() {
  await syncOverdueStatuses();
  const rentals = await prisma.rental.findMany({
    where: { returnDate: null, dueDate: { lt: new Date() } },
    include: rentalInclude,
    orderBy: { dueDate: 'asc' },
  });
  return rentals.map((r) => ({ ...r, daysLate: daysLate(r.dueDate, new Date()) }));
}

rentalRouter.get(
  '/overdue',
  requireRole('LIBRARIAN'),
  asyncHandler(async (req, res) => {
    res.json({ data: { rentals: await getOverdueRentals() } });
  })
);

function csvEscape(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

rentalRouter.get(
  '/overdue/export',
  requireRole('LIBRARIAN'),
  asyncHandler(async (req, res) => {
    const rentals = await getOverdueRentals();
    const header = ['Student Name', 'Enrollment No', 'Email', 'Book Title', 'Barcode', 'Due Date', 'Days Late', 'Est. Fine (INR)'];
    const rows = rentals.map((r) => [
      r.student.name,
      r.student.enrollmentNo ?? '',
      r.student.email,
      r.copy.book.title,
      r.copy.barcode,
      r.dueDate.toISOString().slice(0, 10),
      r.daysLate,
      calculateFine(r.dueDate, new Date()),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="overdue-report.csv"');
    res.send(csv);
  })
);
