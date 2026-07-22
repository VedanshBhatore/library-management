import { prisma } from './prisma.js';
import { daysLate } from '../rules.js';

// Gathers the three facts checkBorrowingStanding() needs, in one place, so
// issue/renew/reserve routes can't drift out of sync on how they compute
// "is this student in good standing".
export async function getStudentStanding(studentId) {
  const now = new Date();

  const activeRentals = await prisma.rental.findMany({
    where: { studentId, returnDate: null },
    select: { dueDate: true },
  });
  const activeRentalsCount = activeRentals.length;
  const hasOverdueRental = activeRentals.some((r) => daysLate(r.dueDate, now) > 0);

  const unpaidFineCount = await prisma.fine.count({
    where: { isPaid: false, rental: { studentId } },
  });

  return { activeRentalsCount, hasOverdueRental, hasUnpaidFine: unpaidFineCount > 0 };
}
