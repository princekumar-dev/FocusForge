import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

function getPreferredNameFromClerk(clerkUser: NonNullable<ReturnType<typeof useUser>['user']>): string {
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
  const emailLocalPart = email.split('@')[0]?.trim() ?? '';
  const fullName = clerkUser.fullName?.trim() ?? '';
  const firstName = clerkUser.firstName?.trim() ?? '';
  const username = clerkUser.username?.trim() ?? '';

  return fullName || firstName || username || emailLocalPart || DEFAULT_PROFILE.display_name;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const clerk = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? undefined,
      }
    : null;

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
          display_name: getPreferredNameFromClerk(clerkUser),
          created_at: new Date().toISOString(),
        },
      });
      if (createRes?.data) {
        setProfile(createRes.data as UserProfile);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [clerkUser]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!profile) {
        return;
      }
      try {
        const res = await client.entities.user_profiles.update({
          id: String(profile.id),
          data,
        });
        if (res?.data) {
          setProfile(res.data as UserProfile);
        }
      } catch (err) {
        console.error('Failed to update profile:', err);
      }
    },
    [profile]
  );

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_user_id');
      setBackendReady(true);
      return;
    }

    if (!clerkUser) {
      return;
    }

    const existingToken = localStorage.getItem('token');
    const existingTokenUserId = localStorage.getItem('token_user_id');
    if (existingToken && existingTokenUserId === clerkUser.id) {
      setBackendReady(true);
      return;
    }

    const exchangeToken = async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          console.error('Clerk token was not available for backend exchange');
          return;
        }

        const response = await fetch('/api/v1/auth/clerk/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerk_token: clerkToken,
            email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
            name: clerkUser.fullName ?? clerkUser.firstName ?? clerkUser.username ?? '',
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend token exchange failed with status ${response.status}`);
        }

        const data = (await response.json()) as { token: string };
        localStorage.setItem('token', data.token);
        localStorage.setItem('token_user_id', clerkUser.id);
        window.location.reload();
      } catch (err) {
        console.error('Failed to exchange Clerk token for backend token:', err);
      }
    };

    void exchangeToken();
  }, [clerkUser, getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !backendReady) {
      return;
    }

    if (!isSignedIn || !clerkUser) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    void fetchProfile();
  }, [backendReady, clerkUser, fetchProfile, isLoaded, isSignedIn]);

  const login = useCallback(async () => {
    window.location.href = '/sign-in';
  }, []);

  const logout = useCallback(async () => {
    setProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('token_user_id');
    await clerk.signOut({ redirectUrl: window.location.origin + '/' });
  }, [clerk]);

  const loading = !isLoaded || !backendReady || (isSignedIn && profileLoading);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile, updateProfile }}>
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
