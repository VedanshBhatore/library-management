import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api.post('/auth/login', { email, password });
    setUser(user);
    return user;
  }, []);

  // Public self-registration always creates a STUDENT account (see
  // server/src/routes/auth.routes.js) — it logs the new user in immediately,
  // same as login.
  const register = useCallback(async ({ name, email, password, enrollmentNo }) => {
    const { user } = await api.post('/auth/register', { name, email, password, enrollmentNo });
    setUser(user);
    return user;
  }, []);

  // Librarian self-signup requires the shared LIBRARIAN_SIGNUP_KEY the
  // server checks — see server/src/routes/auth.routes.js. The key is only
  // ever sent in this one request, never stored or logged client-side.
  const registerLibrarian = useCallback(async ({ name, email, password, key }) => {
    const { user } = await api.post('/auth/register-librarian', { name, email, password, key });
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerLibrarian, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
