import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import avatarImage from '../../assets/41f329b57dbad6c9a42f2a8cb17808ac046f48c9.png';

// ── Types ─────────────────────────────────────────────────────────────────
export interface UserData {
  name: string;
  email: string;
  avatar: string;
  username: string;
}

interface MockAccount {
  username: string;
  password: string;
  name: string;
  email: string;
  avatar: string;
}

interface UserContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => { ok: boolean; error?: string; name?: string };
  logout: () => void;
  register: (data: { username: string; password: string; name: string; email: string }) => { ok: boolean; error?: string };
  updateName: (name: string) => void;
  updateAvatar: (avatar: string) => void;
}

// ── Mock accounts (stored in-memory, can be extended via register) ────────
const MOCK_ACCOUNTS: MockAccount[] = [
  {
    username: 'admin',
    password: '123456',
    name: 'Nguyễn Quang Bình',
    email: 'quangbinh@example.com',
    avatar: avatarImage,
  },
];

// ── Persist helpers ───────────────────────────────────────────────────────
const AUTH_KEY = 'openlang-auth';

function loadAuth(): UserData | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveAuth(user: UserData | null) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  else localStorage.removeItem(AUTH_KEY);
}

// ── Context ───────────────────────────────────────────────────────────────
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(loadAuth);
  // In-memory registered accounts (resets on hard reload; extend with localStorage if needed)
  const [accounts] = useState<MockAccount[]>(MOCK_ACCOUNTS);

  const isLoggedIn = user !== null;

  const login = useCallback((username: string, password: string): { ok: boolean; error?: string; name?: string } => {
    const found = accounts.find(a => a.username === username && a.password === password);
    if (!found) return { ok: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    const userData: UserData = {
      username: found.username,
      name: found.name,
      email: found.email,
      avatar: found.avatar,
    };
    setUserState(userData);
    saveAuth(userData);
    return { ok: true, name: found.name };
  }, [accounts]);

  const logout = useCallback(() => {
    setUserState(null);
    saveAuth(null);
  }, []);

  const register = useCallback((data: { username: string; password: string; name: string; email: string }): { ok: boolean; error?: string } => {
    if (accounts.find(a => a.username === data.username)) {
      return { ok: false, error: 'Tên đăng nhập đã tồn tại.' };
    }
    const newAccount: MockAccount = { ...data, avatar: avatarImage };
    accounts.push(newAccount);
    const userData: UserData = {
      username: data.username,
      name: data.name,
      email: data.email,
      avatar: avatarImage,
    };
    setUserState(userData);
    saveAuth(userData);
    return { ok: true };
  }, [accounts]);

  const updateName = useCallback((name: string) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      saveAuth(updated);
      return updated;
    });
  }, []);

  const updateAvatar = useCallback((avatar: string) => {
    setUserState(prev => {
      if (!prev) return prev;
      const updated = { ...prev, avatar };
      saveAuth(updated);
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoggedIn, login, logout, register, updateName, updateAvatar }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
