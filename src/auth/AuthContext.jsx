import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'nexbot_auth_token';

function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const str = atob(b64);
    try {
      // handle utf8 properly
      return JSON.parse(decodeURIComponent(escape(str)));
    } catch {
      return JSON.parse(str);
    }
  } catch {
    return null;
  }
}

function getStoredUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const payload = decodeJWT(token);
  if (payload && payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
    return { email: payload.email, name: payload.name, role: payload.role };
  }
  localStorage.removeItem(TOKEN_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading] = useState(false);

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }

    const data = await res.json();
    if (!data.token) throw new Error('No token returned');
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ email: data.user.email, name: data.user.name, role: data.user.role });
    return data.token;
  }

  async function register(name, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Register failed');
    }

    const data = await res.json();
    if (!data.token) throw new Error('No token returned');
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({ email: data.user.email, name: data.user.name, role: data.user.role });
    return data.token;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
