import { ZodError } from 'zod';

// Wraps an async route handler so rejected promises reach errorHandler
// instead of crashing the process (Express doesn't catch these by default).
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Parses req.body against a zod schema, replacing req.body with the parsed
// (and coerced/defaulted) result. Validation failures flow to errorHandler.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(result.error);
    }
    req.body = result.data;
    next();
  };
}

// Centralized error handler — keeps every route's error response in the same
// { error: { message, details? } } shape with the right HTTP status code.
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: 'Invalid input.',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  if (err.code === 'P2002') {
    // Prisma unique constraint violation.
    return res.status(409).json({ error: { message: `A record with that ${err.meta?.target ?? 'value'} already exists.` } });
  }
  if (err.code === 'P2003') {
    // Prisma foreign key constraint violation — e.g. deleting a book/copy
    // that still has rental history referencing it.
    return res.status(409).json({ error: { message: 'This record is still referenced by other data and cannot be deleted.' } });
  }
  if (err.code === 'P2025') {
    // Prisma "record to update/delete not found".
    return res.status(404).json({ error: { message: 'Record not found.' } });
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong on the server.' } });
}
