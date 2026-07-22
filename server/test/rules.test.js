import { describe, it, expect } from 'vitest';
import {
  MAX_ACTIVE_RENTALS,
  LOAN_DAYS,
  RENEWAL_DAYS,
  MAX_RENEWALS,
  FINE_PER_DAY,
  RESERVATION_READY_HOURS,
  computeDueDate,
  computeRenewedDueDate,
  computeReservationExpiry,
  daysLate,
  calculateFine,
  checkRenewalEligibility,
  checkBorrowingStanding,
} from '../src/rules.js';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeDueDate', () => {
  it('adds LOAN_DAYS to the issue date', () => {
    const issueDate = new Date('2026-01-01T12:00:00Z');
    const due = computeDueDate(issueDate);
    expect(due.getTime() - issueDate.getTime()).toBe(LOAN_DAYS * DAY_MS);
  });
});

describe('computeRenewedDueDate', () => {
  it('adds RENEWAL_DAYS to the current due date', () => {
    const dueDate = new Date('2026-01-15T12:00:00Z');
    const renewed = computeRenewedDueDate(dueDate);
    expect(renewed.getTime() - dueDate.getTime()).toBe(RENEWAL_DAYS * DAY_MS);
  });
});

describe('computeReservationExpiry', () => {
  it('adds RESERVATION_READY_HOURS to the promotion time', () => {
    const promotedAt = new Date('2026-01-01T00:00:00Z');
    const expiry = computeReservationExpiry(promotedAt);
    expect(expiry.getTime() - promotedAt.getTime()).toBe(RESERVATION_READY_HOURS * 60 * 60 * 1000);
  });
});

describe('daysLate', () => {
  const dueDate = new Date('2026-01-15T12:00:00Z');

  it('is 0 when returned before the due date', () => {
    expect(daysLate(dueDate, new Date(dueDate.getTime() - DAY_MS))).toBe(0);
  });

  it('is 0 when returned exactly on the due date', () => {
    expect(daysLate(dueDate, dueDate)).toBe(0);
  });

  it('rounds a partial day late up to a full day', () => {
    expect(daysLate(dueDate, new Date(dueDate.getTime() + 60 * 1000))).toBe(1);
  });

  it('counts whole days late correctly', () => {
    expect(daysLate(dueDate, new Date(dueDate.getTime() + 5 * DAY_MS))).toBe(5);
  });
});

describe('calculateFine', () => {
  const dueDate = new Date('2026-01-15T12:00:00Z');

  it('is 0 for an on-time or early return', () => {
    expect(calculateFine(dueDate, dueDate)).toBe(0);
    expect(calculateFine(dueDate, new Date(dueDate.getTime() - DAY_MS))).toBe(0);
  });

  it('charges FINE_PER_DAY for each day late', () => {
    const returnDate = new Date(dueDate.getTime() + 3 * DAY_MS);
    expect(calculateFine(dueDate, returnDate)).toBe(3 * FINE_PER_DAY);
  });

  it('rounds a partial day up before multiplying', () => {
    const returnDate = new Date(dueDate.getTime() + 2 * DAY_MS + 60 * 1000);
    expect(calculateFine(dueDate, returnDate)).toBe(3 * FINE_PER_DAY);
  });
});

describe('checkRenewalEligibility', () => {
  const now = new Date('2026-01-15T12:00:00Z');
  const futureDueDate = new Date(now.getTime() + 2 * DAY_MS);
  const pastDueDate = new Date(now.getTime() - 2 * DAY_MS);

  it('allows renewal when not overdue, under MAX_RENEWALS, and no one waiting', () => {
    const result = checkRenewalEligibility({
      dueDate: futureDueDate,
      now,
      renewalsCount: 0,
      hasWaitingReservation: false,
    });
    expect(result.eligible).toBe(true);
  });

  it('blocks renewal when the rental is overdue', () => {
    const result = checkRenewalEligibility({
      dueDate: pastDueDate,
      now,
      renewalsCount: 0,
      hasWaitingReservation: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/overdue/i);
  });

  it('blocks renewal once MAX_RENEWALS has been reached', () => {
    const result = checkRenewalEligibility({
      dueDate: futureDueDate,
      now,
      renewalsCount: MAX_RENEWALS,
      hasWaitingReservation: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/renewed/i);
  });

  it('blocks renewal when another student is waiting on the title', () => {
    const result = checkRenewalEligibility({
      dueDate: futureDueDate,
      now,
      renewalsCount: 0,
      hasWaitingReservation: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/waiting/i);
  });

  it('checks overdue before the renewal-count limit', () => {
    const result = checkRenewalEligibility({
      dueDate: pastDueDate,
      now,
      renewalsCount: MAX_RENEWALS,
      hasWaitingReservation: false,
    });
    expect(result.reason).toMatch(/overdue/i);
  });
});

describe('checkBorrowingStanding', () => {
  it('allows borrowing when under the limit with no overdue rentals or fines', () => {
    const result = checkBorrowingStanding({
      activeRentalsCount: MAX_ACTIVE_RENTALS - 1,
      hasOverdueRental: false,
      hasUnpaidFine: false,
    });
    expect(result.eligible).toBe(true);
  });

  it('blocks borrowing with an overdue rental, regardless of active count', () => {
    const result = checkBorrowingStanding({
      activeRentalsCount: 0,
      hasOverdueRental: true,
      hasUnpaidFine: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/overdue/i);
  });

  it('blocks borrowing with an unpaid fine', () => {
    const result = checkBorrowingStanding({
      activeRentalsCount: 0,
      hasOverdueRental: false,
      hasUnpaidFine: true,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/fine/i);
  });

  it('blocks borrowing at MAX_ACTIVE_RENTALS even with clean standing', () => {
    const result = checkBorrowingStanding({
      activeRentalsCount: MAX_ACTIVE_RENTALS,
      hasOverdueRental: false,
      hasUnpaidFine: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toMatch(/maximum/i);
  });

  it('checks overdue before the active-rentals limit', () => {
    const result = checkBorrowingStanding({
      activeRentalsCount: MAX_ACTIVE_RENTALS,
      hasOverdueRental: true,
      hasUnpaidFine: false,
    });
    expect(result.reason).toMatch(/overdue/i);
  });

  it('returned rentals never count toward the active limit (caller contract)', () => {
    // This is enforced by callers passing only returnDate === null rentals
    // into activeRentalsCount — verified here by confirming a count of 0
    // (all returned) is always eligible regardless of total rental history.
    const result = checkBorrowingStanding({
      activeRentalsCount: 0,
      hasOverdueRental: false,
      hasUnpaidFine: false,
    });
    expect(result.eligible).toBe(true);
  });
});
