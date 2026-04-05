import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';
import { client } from '../lib/api';

export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface UserProfile {
  id: number;
  user_id: string;
  display_name: string;
  avatar: string;
  level: number;
  xp: number;
  total_xp: number;
  energy: number;
  max_energy: number;
  streak: number;
  best_streak: number;
  streak_freezes: number;
  personality_mode: string;
  mood: string;
  tree_stage: number;
  tasks_completed: number;
  focus_minutes: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  backendReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'user_id'> = {
  display_name: 'Adventurer',
  avatar: '\uD83C\uDF31',
  level: 1,
  xp: 0,
  total_xp: 0,
  energy: 100,
  max_energy: 100,
  streak: 0,
  best_streak: 0,
  streak_freezes: 3,
  personality_mode: 'chill',
  mood: 'productive',
  tree_stage: 1,
  tasks_completed: 0,
  focus_minutes: 0,
};

// How often to proactively refresh the backend token (50 minutes).
// This ensures the token is refreshed well before a typical 60-minute expiry.
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

// Key used to store the timestamp (ms) when the backend token was last obtained.
const TOKEN_TIMESTAMP_KEY = 'token_obtained_at';

/**
 * Returns true if the stored backend token is likely still valid.
 * We consider it valid if it was obtained less than TOKEN_REFRESH_INTERVAL_MS ago.
 */
function isTokenFresh(): boolean {
  const obtainedAt = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
  if (!obtainedAt) return false;
  const age = Date.now() - Number(obtainedAt);
  return age < TOKEN_REFRESH_INTERVAL_MS;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  // Ref to track whether a token exchange is already in progress to avoid races.
  const exchangeInProgress = useRef(false);
  // Ref for the periodic refresh timer so we can clean it up.
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? undefined,
      }
    : null;

  // ─── Token exchange helper ────────────────────────────────────────────
  // Silently exchanges the current Clerk session token for a backend token.
  // Returns true on success, false on failure.
  const doTokenExchange = useCallback(async (): Promise<boolean> => {
    if (!clerkUser) return false;
    if (exchangeInProgress.current) return false;

    exchangeInProgress.current = true;
    try {
      const clerkToken = await getToken();
      if (!clerkToken) {
        console.warn('[Auth] Clerk token unavailable for backend exchange');
        return false;
      }

      const response = await fetch('/api/v1/auth/clerk/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_token: clerkToken,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
          name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? '',
        }),
      });

      if (!response.ok) {
        console.error(`[Auth] Backend token exchange failed (${response.status})`);
        return false;
      }

      const data = (await response.json()) as { token: string };
      localStorage.setItem('token', data.token);
      localStorage.setItem('token_user_id', clerkUser.id);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, String(Date.now()));
      return true;
    } catch (err) {
      console.error('[Auth] Token exchange error:', err);
      return false;
    } finally {
      exchangeInProgress.current = false;
    }
  }, [clerkUser, getToken]);

  // ─── Profile helpers ──────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!clerkUser) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    try {
      const res = await client.entities.user_profiles.query({
        query: { user_id: clerkUser.id },
        limit: 1,
      });
      const items = res?.data?.items;
      if (items && items.length > 0) {
        setProfile(items[0] as UserProfile);
        return;
      }

      const createRes = await client.entities.user_profiles.create({
        data: {
          ...DEFAULT_PROFILE,
          user_id: clerkUser.id,
          display_name:
            clerkUser.firstName ??
            clerkUser.fullName ??
            clerkUser.username ??
            DEFAULT_PROFILE.display_name,
          created_at: new Date().toISOString(),
        },
      });
      if (createRes?.data) {
        setProfile(createRes.data as UserProfile);
      }
    } catch (err) {
      console.error('[Auth] Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [clerkUser]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!profile) return;
      try {
        const res = await client.entities.user_profiles.update({
          id: String(profile.id),
          data,
        });
        if (res?.data) {
          setProfile(res.data as UserProfile);
        }
      } catch (err) {
        console.error('[Auth] Failed to update profile:', err);
      }
    },
    [profile]
  );

  // ─── Initial token acquisition ────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_user_id');
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      setBackendReady(true);
      return;
    }

    if (!clerkUser) return;

    // If we already have a fresh token for this user, skip exchange.
    const existingToken = localStorage.getItem('token');
    const existingTokenUserId = localStorage.getItem('token_user_id');
    if (existingToken && existingTokenUserId === clerkUser.id && isTokenFresh()) {
      setBackendReady(true);
      return;
    }

    // Token is missing, stale, or for a different user — exchange silently.
    const initExchange = async () => {
      const ok = await doTokenExchange();
      if (ok) {
        setBackendReady(true);
      } else {
        // Even if the exchange fails, mark backend as ready so the UI
        // doesn't hang forever. The periodic refresh will retry shortly.
        console.warn('[Auth] Initial token exchange failed — will retry');
        setBackendReady(true);
      }
    };

    void initExchange();
  }, [clerkUser, doTokenExchange, isLoaded, isSignedIn]);

  // ─── Periodic token refresh ───────────────────────────────────────────
  // Re-exchanges the token every TOKEN_REFRESH_INTERVAL_MS so the backend
  // token never expires while the app is open.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser || !backendReady) {
      // Clean up any existing timer if user signs out.
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    refreshTimerRef.current = setInterval(() => {
      console.log('[Auth] Proactive token refresh');
      void doTokenExchange();
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [backendReady, clerkUser, doTokenExchange, isLoaded, isSignedIn]);

  // ─── Visibility-change refresh ────────────────────────────────────────
  // When the user returns to a tab that was backgrounded (e.g. after sleep,
  // switching tabs, or locking the screen), check if the token is stale and
  // refresh it immediately.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser || !backendReady) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isTokenFresh()) {
        console.log('[Auth] Tab became visible with stale token — refreshing');
        void doTokenExchange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [backendReady, clerkUser, doTokenExchange, isLoaded, isSignedIn]);

  // ─── Fetch profile once backend is ready ──────────────────────────────
  useEffect(() => {
    if (!isLoaded || !backendReady) return;

    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    void fetchProfile();
  }, [backendReady, clerkUser, fetchProfile, isLoaded, isSignedIn]);

  // ─── Login / Logout ───────────────────────────────────────────────────
  const login = useCallback(async () => {
    window.location.href = '/sign-in';
  }, []);

  const logout = useCallback(async () => {
    setProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('token_user_id');
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    await clerk.signOut({ redirectUrl: window.location.origin + '/' });
  }, [clerk]);

  const loading = !isLoaded || !backendReady || (isSignedIn && profileLoading);

  return (
    <AuthContext.Provider value={{ user, profile, loading, backendReady, login, logout, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
