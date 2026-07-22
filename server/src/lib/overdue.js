import { prisma } from './prisma.js';

// There's no background job in this project, so a rental's stored `status`
// can lag reality between requests (e.g. a rental issued as ACTIVE becomes
// overdue purely by the clock ticking, with no write happening). Business
// logic never trusts the stored status for "is this overdue" — it always
// compares dueDate/returnDate directly (see rules.js). This helper just
// keeps the stored column honest for anything that *displays* status,
// called at the top of routes that read or affect rental state.
export async function syncOverdueStatuses() {
  await prisma.rental.updateMany({
    where: { status: 'ACTIVE', returnDate: null, dueDate: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });
}
