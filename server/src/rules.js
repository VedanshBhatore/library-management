// Single source of truth for every business-rule constant and pure eligibility
// check in the Library Management System. Routes must import from here rather
// than hardcoding numbers, so the rules stay auditable in one place.

// --- Constants -------------------------------------------------------------

// A student may not have more than this many rentals with returnDate === null
// at once. Returned rentals never count against the limit.
export const MAX_ACTIVE_RENTALS = 3;

// Initial loan period, in days, applied when a librarian issues a copy.
export const LOAN_DAYS = 14;

// Extension granted per renewal, in days.
export const RENEWAL_DAYS = 7;

// A single rental can be renewed at most this many times.
export const MAX_RENEWALS = 1;

// Fine charged per day late, in INR, applied at return time.
export const FINE_PER_DAY = 5;

// Hours a promoted reservation stays READY before it expires and the copy
// moves on to the next student in the queue.
export const RESERVATION_READY_HOURS = 48;

// --- Pure helpers ------------------------------------------------------------
// These take plain data (not Prisma models directly, though Prisma rows satisfy
// the same shape) so they're trivial to unit test without a database.

/**
 * Compute the due date for a fresh issue.
 * @param {Date} issueDate
 * @returns {Date}
 */
export function computeDueDate(issueDate) {
  return addDays(issueDate, LOAN_DAYS);
}

/**
 * Compute the new due date for a renewal, extending from the current due date.
 * @param {Date} currentDueDate
 * @returns {Date}
 */
export function computeRenewedDueDate(currentDueDate) {
  return addDays(currentDueDate, RENEWAL_DAYS);
}

/**
 * Compute the expiry timestamp for a reservation promoted to READY.
 * @param {Date} promotedAt
 * @returns {Date}
 */
export function computeReservationExpiry(promotedAt) {
  return new Date(promotedAt.getTime() + RESERVATION_READY_HOURS * 60 * 60 * 1000);
}

/**
 * Whole days between dueDate and returnDate/now, floored at 0 (never negative).
 * Partial days count as a full day late, matching how libraries bill fines.
 * @param {Date} dueDate
 * @param {Date} referenceDate - the return date, or "now" for a live overdue check
 * @returns {number}
 */
export function daysLate(dueDate, referenceDate) {
  const msLate = referenceDate.getTime() - dueDate.getTime();
  if (msLate <= 0) return 0;
  return Math.ceil(msLate / (24 * 60 * 60 * 1000));
}

/**
 * Fine amount in INR for a rental returned `late` days after its due date.
 * @param {Date} dueDate
 * @param {Date} returnDate
 * @returns {number}
 */
export function calculateFine(dueDate, returnDate) {
  return daysLate(dueDate, returnDate) * FINE_PER_DAY;
}

/**
 * Decide whether a rental is renewable right now.
 * Renewal is allowed only if: not overdue, renewalsCount < MAX_RENEWALS, and
 * no other student is WAITING on a reservation for that book's title.
 *
 * @param {object} params
 * @param {Date} params.dueDate
 * @param {Date} params.now
 * @param {number} params.renewalsCount
 * @param {boolean} params.hasWaitingReservation - true if any WAITING
 *   reservation exists for the book tied to this rental's copy
 * @returns {{ eligible: boolean, reason?: string }}
 */
export function checkRenewalEligibility({ dueDate, now, renewalsCount, hasWaitingReservation }) {
  if (daysLate(dueDate, now) > 0) {
    return { eligible: false, reason: 'This rental is overdue and must be returned, not renewed.' };
  }
  if (renewalsCount >= MAX_RENEWALS) {
    return { eligible: false, reason: `This rental has already been renewed the maximum of ${MAX_RENEWALS} time(s).` };
  }
  if (hasWaitingReservation) {
    return { eligible: false, reason: 'Another student is waiting for this title, so it cannot be renewed.' };
  }
  return { eligible: true };
}

/**
 * Decide whether a student may borrow (issue) or renew at all, based on their
 * overall standing: any overdue rental or unpaid fine blocks both actions.
 *
 * @param {object} params
 * @param {number} params.activeRentalsCount - rentals with returnDate === null
 * @param {boolean} params.hasOverdueRental
 * @param {boolean} params.hasUnpaidFine
 * @returns {{ eligible: boolean, reason?: string }}
 */
export function checkBorrowingStanding({ activeRentalsCount, hasOverdueRental, hasUnpaidFine }) {
  if (hasOverdueRental) {
    return { eligible: false, reason: 'You have an overdue book. Return it before borrowing or renewing.' };
  }
  if (hasUnpaidFine) {
    return { eligible: false, reason: 'You have an unpaid fine. Clear it before borrowing or renewing.' };
  }
  if (activeRentalsCount >= MAX_ACTIVE_RENTALS) {
    return { eligible: false, reason: `You already have ${MAX_ACTIVE_RENTALS} active rentals, the maximum allowed.` };
  }
  return { eligible: true };
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
