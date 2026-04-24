import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

// Simulates JWT encode/decode (in production, this comes from the server)
function createJWT(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 3600_000 }));
  const sig    = btoa('nexbot-secret-' + payload.email);
  return `${header}.${body}.${sig}`;
}

function decodeJWT(token) {
  try {
    const [, body] = token.split('.');
    return JSON.parse(atob(body));
  } catch {
    return null;
  }
}

// Mocked user store
const USERS_KEY = 'nexbot_users';
const TOKEN_KEY = 'nexbot_auth_token';
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@nexbot.io',
  password: btoa('demo1234'),
  role: 'admin',
};

function getUsers() {
  const storedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  const hasDemoUser = storedUsers.some(user => user.email === DEMO_USER.email);

  if (hasDemoUser) return storedUsers;

  const users = [...storedUsers, DEMO_USER];
  saveUsers(users);
  return users;
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getStoredUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const payload = decodeJWT(token);
  if (payload && payload.exp > Date.now()) {
    return { email: payload.email, name: payload.name, role: payload.role };
  }

  localStorage.removeItem(TOKEN_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading] = useState(false);

  async function login(email, password) {
    await delay(600);
    const users = getUsers();
    const found = users.find(u => u.email === email && u.password === btoa(password));
    if (!found) throw new Error('Invalid email or password');
    const token = createJWT({ email: found.email, name: found.name, role: found.role });
    localStorage.setItem(TOKEN_KEY, token);
    setUser({ email: found.email, name: found.name, role: found.role });
    return token;
  }

  async function register(name, email, password) {
    await delay(600);
    const users = getUsers();
    if (users.find(u => u.email === email)) throw new Error('Email already registered');
    const newUser = { name, email, password: btoa(password), role: 'admin' };
    saveUsers([...users, newUser]);
    const token = createJWT({ email, name, role: 'admin' });
    localStorage.setItem(TOKEN_KEY, token);
    setUser({ email, name, role: 'admin' });
    return token;
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

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
