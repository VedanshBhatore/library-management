import { prisma } from './prisma.js';
import { computeReservationExpiry } from '../rules.js';

// A READY reservation left unclaimed past its 48h window expires and hands
// the copy to the next WAITING student, cascading through the queue. There's
// no cron job in this project, so this runs lazily wherever reservation
// state is read or written — the same pattern as syncOverdueStatuses().
export async function syncExpiredReservations() {
  const expired = await prisma.reservation.findMany({
    where: { status: 'READY', expiresAt: { lt: new Date() } },
  });

  for (const reservation of expired) {
    await prisma.reservation.update({ where: { id: reservation.id }, data: { status: 'EXPIRED' } });

    const next = await prisma.reservation.findFirst({
      where: { bookId: reservation.bookId, status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });
    if (next) {
      await prisma.reservation.update({
        where: { id: next.id },
        data: { status: 'READY', expiresAt: computeReservationExpiry(new Date()) },
      });
    }
  }
}
