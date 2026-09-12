// ─── Token storage ────────────────────────────────────────────────
const TOKEN_KEY = 'kosharchy_token';
const LEGACY_TOKEN_KEY = 'wealthos_token';
const USER_KEY  = 'kosharchy_user';
const LEGACY_USER_KEY  = 'wealthos_user';

export interface StoredUser {
  id: string;
  email: string;
  name: string | null;
  currency: string;
}

// ─── Token helpers ────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

// ─── User helpers ─────────────────────────────────────────────────
export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

// ─── Auth state ───────────────────────────────────────────────────
export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;

  // Basic check: JWT has 3 parts
  const parts = token.split('.');
  if (parts.length !== 3) {
    clearToken();
    clearStoredUser();
    return false;
  }

  // Check expiry from the JWT payload (no crypto verification — server will reject bad tokens)
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      clearStoredUser();
      return false;
    }
  } catch {
    clearToken();
    clearStoredUser();
    return false;
  }

  return true;
}

// ─── Login / Logout ───────────────────────────────────────────────
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');

export async function login(email: string, password: string): Promise<StoredUser> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(text || `Server returned status ${res.status}`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  setToken(data.token);
  setStoredUser(data.user);
  return data.user;
}

export function logout(): void {
  clearToken();
  clearStoredUser();
  window.location.href = '/login';
}
