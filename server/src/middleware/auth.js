import { AUTH_COOKIE_NAME, verifyToken } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

// Verifies the JWT cookie and attaches the current user (minus passwordHash)
// to req.user. Re-fetches from the DB on every request rather than trusting
// the token payload, so a deactivation or role change takes effect immediately.
export async function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: { message: 'Not authenticated.' } });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired session.' } });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    return res.status(401).json({ error: { message: 'Invalid or expired session.' } });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: { message: 'This account has been deactivated.' } });
  }

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
}

// Use after requireAuth. Pass one or more roles that may access the route.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: 'You do not have permission to perform this action.' } });
    }
    next();
  };
}
