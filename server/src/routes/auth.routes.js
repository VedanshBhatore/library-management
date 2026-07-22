import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword, signToken, AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_MS } from '../lib/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, validateBody } from '../middleware/errorHandler.js';

export const authRouter = Router();

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: AUTH_COOKIE_MAX_AGE_MS,
  path: '/',
};

function toSafeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

// Public self-registration always creates a STUDENT account. There is
// deliberately no way to create a LIBRARIAN through this API — those
// accounts only come from the seed script, so a random visitor can never
// grant themselves librarian privileges over physical assets and fines.
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  enrollmentNo: z.string().trim().min(1, 'Enrollment number is required.'),
});

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, enrollmentNo } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { message: 'An account with that email already exists.' } });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, enrollmentNo, role: 'STUDENT' },
    });

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.status(201).json({ data: { user: toSafeUser(user) } });
  })
);

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: { message: 'This account has been deactivated.' } });
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: { message: 'Invalid email or password.' } });
    }

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
    res.json({ data: { user: toSafeUser(user) } });
  })
);

authRouter.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  res.json({ data: { ok: true } });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ data: { user: req.user } });
});
