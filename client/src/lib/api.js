// Thin fetch wrapper. All API responses use a { data } / { error } shape
// (see server/src/middleware/errorHandler.js), so callers get either the
// unwrapped data or a thrown Error with the server's message.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends/receives the httpOnly JWT cookie
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error?.message ?? 'Something went wrong.');
  }

  return body.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
