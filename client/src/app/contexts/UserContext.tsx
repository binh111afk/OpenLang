import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import avatarImage from '../../assets/41f329b57dbad6c9a42f2a8cb17808ac046f48c9.png';
import { createSupabaseBrowserClient } from '@/utils/supabase/client';
import { fetchJson } from '@/utils/api';

// ── Types ─────────────────────────────────────────────────────────────────
export interface UserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  username: string;
  goal: number;
}

interface AuthResult {
  ok: boolean;
  error?: string;
  name?: string;
}

interface UsernameLoginPayload {
  session: {
    access_token: string;
    refresh_token: string;
  };
}

interface RegisterPayload {
  session?: {
    access_token: string;
    refresh_token: string;
  };
  requiresManualLogin?: boolean;
}

interface ProfileApiPayload {
  profile: ProfileRow | null;
}

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  goal: number | null;
}

interface UserContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (data: { username: string; password: string; name: string; email: string }) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updateName: (name: string) => Promise<AuthResult>;
  updateGoal: (goal: number) => Promise<AuthResult>;
  updateAvatar: (file: File) => Promise<AuthResult>;
  updatePassword: (nextPassword: string) => Promise<AuthResult>;
  getAccessToken: () => Promise<string | null>;
}

const supabase = createSupabaseBrowserClient();

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function mapUser(authUser: SupabaseUser, profile: ProfileRow | null): UserData {
  const usernameFromMeta =
    typeof authUser.user_metadata?.username === 'string'
      ? authUser.user_metadata.username
      : null;
  const fullNameFromMeta =
    typeof authUser.user_metadata?.full_name === 'string'
      ? authUser.user_metadata.full_name
      : null;
  const avatarFromMeta =
    typeof authUser.user_metadata?.avatar_url === 'string'
      ? authUser.user_metadata.avatar_url
      : null;

  const email = authUser.email || '';
  const username =
    profile?.username ||
    usernameFromMeta ||
    (email.includes('@') ? email.split('@')[0] : 'user');

  return {
    id: authUser.id,
    name: profile?.full_name || fullNameFromMeta || username,
    email,
    username,
    avatar: profile?.avatar_url || avatarFromMeta || avatarImage,
    goal: Number(profile?.goal || 15),
  };
}

async function hydrateUser(authUser: SupabaseUser): Promise<UserData> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return mapUser(authUser, null);
  }

  let profile: ProfileRow | null = null;

  try {
    const payload = await fetchJson<ProfileApiPayload>('/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    profile = payload.profile;
  } catch {
    profile = null;
  }

  return mapUser(authUser, profile);
}

// ── Context ───────────────────────────────────────────────────────────────
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = user !== null;

  const syncFromSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setUserState(null);
      setLoading(false);
      return;
    }

    const authUser = data.session?.user;

    if (!authUser) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      const hydrated = await hydrateUser(authUser);
      setUserState(hydrated);
    } catch {
      setUserState(mapUser(authUser, null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      await syncFromSession();
      if (!mounted) {
        return;
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (!session?.user) {
        setUserState(null);
        setLoading(false);
        return;
      }

      void (async () => {
        try {
          const hydrated = await hydrateUser(session.user);
          if (mounted) {
            setUserState(hydrated);
          }
        } catch {
          if (mounted) {
            setUserState(mapUser(session.user, null));
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<AuthResult> => {
    const username = normalizeUsername(identifier);

    if (!username || !password) {
      return { ok: false, error: 'Vui lòng nhập đầy đủ thông tin.' };
    }

    try {
      const payload = await fetchJson<UsernameLoginPayload>('/api/auth-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });

      if (setSessionError || !setSessionData.user) {
        return {
          ok: false,
          error: setSessionError?.message || 'Không thể tạo phiên đăng nhập.',
        };
      }

      const hydrated = await hydrateUser(setSessionData.user);
      setUserState(hydrated);
      return { ok: true, name: hydrated.name };

    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Đăng nhập thất bại.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserState(null);
  }, []);

  const register = useCallback(async (data: { username: string; password: string; name: string; email: string }): Promise<AuthResult> => {
    const username = normalizeUsername(data.username);

    try {
      const payload = await fetchJson<RegisterPayload>('/api/auth-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password: data.password,
          email: data.email.trim(),
          fullName: data.name.trim(),
        }),
      });

      if (!payload.session) {
        return {
          ok: true,
          name: data.name.trim(),
        };
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });

      if (sessionError || !sessionData.user) {
        return {
          ok: false,
          error: sessionError?.message || 'Không thể tạo phiên đăng nhập sau khi đăng ký.',
        };
      }

      const hydrated = await hydrateUser(sessionData.user);
      setUserState(hydrated);
      return { ok: true, name: hydrated.name };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Đăng ký thất bại.',
      };
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const redirectTo = `${window.location.origin}/settings`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  }, []);

  const updateName = useCallback(async (name: string): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: 'Bạn chưa đăng nhập.' };
    }

    const nextName = name.trim();
    if (!nextName) {
      return { ok: false, error: 'Tên không được để trống.' };
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        return { ok: false, error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' };
      }

      await fetchJson<ProfileApiPayload>('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: nextName }),
      });

      await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          username: user.username,
          avatar_url: user.avatar,
        },
      });
      setUserState((prev) => (prev ? { ...prev, name: nextName } : prev));
      return { ok: true, name: nextName };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Không thể cập nhật tên.',
      };
    }
  }, [user]);

  const updateGoal = useCallback(async (goal: number): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: 'Bạn chưa đăng nhập.' };
    }

    const normalizedGoal = Math.max(1, Math.round(goal));

    try {
      const token = await getAccessToken();
      if (!token) {
        return { ok: false, error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' };
      }

      await fetchJson<ProfileApiPayload>('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: normalizedGoal }),
      });

      setUserState((prev) => (prev ? { ...prev, goal: normalizedGoal } : prev));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Không thể cập nhật mục tiêu.',
      };
    }
  }, [user]);

  const updateAvatar = useCallback(async (file: File): Promise<AuthResult> => {
    if (!user) {
      return { ok: false, error: 'Bạn chưa đăng nhập.' };
    }

    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Vui lòng chọn file ảnh hợp lệ.' };
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const safeExt = (ext || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filePath = `${user.id}/${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      if (uploadError.message.toLowerCase().includes('bucket')) {
        return {
          ok: false,
          error: 'Chưa có bucket avatars trong Supabase Storage. Hãy tạo bucket avatars trước.',
        };
      }

      return { ok: false, error: uploadError.message };
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = data.publicUrl;

    try {
      const token = await getAccessToken();
      if (!token) {
        return { ok: false, error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' };
      }

      await fetchJson<ProfileApiPayload>('/api/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatarUrl }),
      });

      await supabase.auth.updateUser({
        data: {
          full_name: user.name,
          username: user.username,
          avatar_url: avatarUrl,
        },
      });
      setUserState((prev) => (prev ? { ...prev, avatar: avatarUrl } : prev));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Không thể cập nhật ảnh đại diện.',
      };
    }
  }, [user, getAccessToken]);

  const updatePassword = useCallback(async (nextPassword: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.updateUser({
      password: nextPassword,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn,
        loading,
        login,
        logout,
        register,
        resetPassword,
        updateName,
        updateGoal,
        updateAvatar,
        updatePassword,
        getAccessToken,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
