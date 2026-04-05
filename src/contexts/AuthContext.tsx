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

function scoreProfile(profile: UserProfile): number {
  let score = 0;

  score += (profile.total_xp || 0) * 1000;
  score += (profile.tasks_completed || 0) * 100;
  score += (profile.focus_minutes || 0) * 10;
  score += (profile.level || 0) * 100;
  score += profile.id || 0;

  if (profile.display_name && profile.display_name !== DEFAULT_PROFILE.display_name) score += 25;
  if (profile.avatar && profile.avatar !== DEFAULT_PROFILE.avatar) score += 10;
  if (profile.personality_mode && profile.personality_mode !== DEFAULT_PROFILE.personality_mode) score += 5;
  if (profile.mood && profile.mood !== DEFAULT_PROFILE.mood) score += 5;

  return score;
}

function pickCanonicalProfile(profiles: UserProfile[]): UserProfile {
  return profiles.reduce((best, current) => (scoreProfile(current) > scoreProfile(best) ? current : best));
}

// How often to proactively refresh the backend token (50 minutes).
// This ensures the token is refreshed well before a typical 60-minute expiry.
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;

// Key used to store the timestamp (ms) when the backend token was last obtained.
const TOKEN_TIMESTAMP_KEY = 'token_obtained_at';

function isTokenFresh(): boolean {
  const obtainedAt = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
  if (!obtainedAt) return false;
  const age = Date.now() - Number(obtainedAt);
  return age < TOKEN_REFRESH_INTERVAL_MS;
}

function getEnergyResetKey(userId: string): string {
  return `last_energy_reset:${userId}`;
}

function getLocalDateKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMillisecondsUntilNextMidnight(now = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(1000, nextMidnight.getTime() - now.getTime());
}

const ENERGY_RESET_KEY = 'last_energy_reset';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  // Ref to track whether a token exchange is already in progress to avoid races.
  const exchangeInProgress = useRef(false);
  // Guard against concurrent fetchProfile calls that could create duplicate profiles.
  const profileFetchInProgress = useRef(false);
  // Ref for the periodic refresh timer so we can clean it up.
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const midnightResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? undefined,
      }
    : null;

  const ensureDailyEnergyReset = useCallback(
    async (existingProfile: UserProfile): Promise<UserProfile> => {
      if (!clerkUser) return existingProfile;

      const today = getLocalDateKey();
      const resetKey = getEnergyResetKey(clerkUser.id);
      const lastReset = localStorage.getItem(resetKey);
      const resetEnergy = DEFAULT_PROFILE.max_energy;

      if (lastReset === today) {
        return existingProfile;
      }

      if (existingProfile.energy === resetEnergy) {
        localStorage.setItem(resetKey, today);
        return existingProfile;
      }

      try {
        const resetRes = await client.entities.user_profiles.update({
          id: String(existingProfile.id),
          data: { energy: resetEnergy },
        });
        localStorage.setItem(resetKey, today);
        return (resetRes?.data as UserProfile) || { ...existingProfile, energy: resetEnergy };
      } catch {
        return existingProfile;
      }
    },
    [clerkUser]
  );

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

    // Prevent concurrent profile fetches — this is what caused duplicate profiles
    // when multiple effects or re-renders triggered fetchProfile simultaneously.
    if (profileFetchInProgress.current) return;
    profileFetchInProgress.current = true;

    setProfileLoading(true);
    try {
      const res = await client.entities.user_profiles.query({
        query: { user_id: clerkUser.id },
        sort: '-id',
        limit: 50,
      });
      const items = res?.data?.items;
      if (items && items.length > 0) {
        let existing = pickCanonicalProfile(items as UserProfile[]);

        // Auto-fix "Adventurer" display name if Clerk now has the real name.
        // This handles the case where a profile was previously created before
        // Clerk had the user's real name available.
        const realName = clerkUser.firstName ?? clerkUser.fullName ?? clerkUser.username;
        if (existing.display_name === DEFAULT_PROFILE.display_name && realName) {
          try {
            const updateRes = await client.entities.user_profiles.update({
              id: String(existing.id),
              data: { display_name: realName },
            });
            if (updateRes?.data) {
              existing = updateRes.data as UserProfile;
            }
          } catch {
            // Name update failed — use profile as-is, don't block login.
          }
        }

        const normalizedProfile = await ensureDailyEnergyReset(existing);
        setProfile(normalizedProfile);
        return;

        // ── Daily energy reset ──────────────────────────────────────
        // Check if today's date differs from the last reset date.
        // If so, refill energy to max and record today's date.
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const lastReset = localStorage.getItem(ENERGY_RESET_KEY);
        if (lastReset !== today && existing.energy < (existing.max_energy || 100)) {
          const maxEnergy = existing.max_energy || 100;
          try {
            const resetRes = await client.entities.user_profiles.update({
              id: String(existing.id),
              data: { energy: maxEnergy },
            });
            if (resetRes?.data) {
              setProfile(resetRes.data as UserProfile);
            }
          } catch {
            // Reset failed — not critical, will retry on next load.
          }
          localStorage.setItem(ENERGY_RESET_KEY, today);
        } else if (!lastReset) {
          // First time — just record today so tomorrow triggers a reset.
          localStorage.setItem(ENERGY_RESET_KEY, today);
        }

        return;
      }

      // No profile found — create a new one.
      // We only reach here if the query SUCCEEDED with 0 results (not errored).
      // This ensures we never create a duplicate when the query just failed.
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
        const normalizedProfile = await ensureDailyEnergyReset(createRes.data as UserProfile);
        setProfile(normalizedProfile);
      }
    } catch (err) {
      // Query itself failed (401, network error, etc.)
      // Do NOT create a profile here — we can't tell if one already exists.
      console.error('[Auth] Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
      profileFetchInProgress.current = false;
    }
  }, [clerkUser, ensureDailyEnergyReset]);

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

    // Token is missing, stale, or for a different user — exchange with retries.
    let retryCount = 0;
    const MAX_RETRIES = 3;
    let cancelled = false;

    const initExchange = async () => {
      if (cancelled) return;
      const ok = await doTokenExchange();
      if (ok) {
        // The @metagptx/web-sdk client was created (via createClient()) before
        // the token existed in localStorage. It won't pick up the new token
        // dynamically — a page reload is required so the SDK re-initializes
        // with the fresh token. This ONLY happens on first login; subsequent
        // page loads will find the token in localStorage at line 258 and skip
        // this branch entirely (no infinite reload loop).
        window.location.reload();
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = retryCount * 2000; // 2s, 4s, 6s
        console.warn(`[Auth] Token exchange attempt ${retryCount}/${MAX_RETRIES} failed — retrying in ${delay / 1000}s`);
        setTimeout(initExchange, delay);
      } else {
        // All retries exhausted. Let the UI render so it's not stuck forever.
        console.error('[Auth] All token exchange attempts failed');
        setBackendReady(true);
      }
    };

    void initExchange();

    return () => { cancelled = true; };
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

  useEffect(() => {
    if (midnightResetTimerRef.current) {
      clearTimeout(midnightResetTimerRef.current);
      midnightResetTimerRef.current = null;
    }

    if (!isLoaded || !isSignedIn || !clerkUser || !backendReady || !profile) {
      return;
    }

    const scheduleNextReset = () => {
      midnightResetTimerRef.current = setTimeout(async () => {
        await fetchProfile();
        scheduleNextReset();
      }, getMillisecondsUntilNextMidnight());
    };

    scheduleNextReset();

    return () => {
      if (midnightResetTimerRef.current) {
        clearTimeout(midnightResetTimerRef.current);
        midnightResetTimerRef.current = null;
      }
    };
  }, [backendReady, clerkUser, fetchProfile, isLoaded, isSignedIn, profile]);

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
