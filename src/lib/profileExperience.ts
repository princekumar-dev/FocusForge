import { useEffect, useState } from 'react';

import type { UserProfile } from '@/contexts/AuthContext';

type MoodKey = 'lazy' | 'productive' | 'overwhelmed';
type PersonalityKey = 'chill' | 'strict' | 'funny';
type AmbientPreset = 'rain' | 'forest' | 'focus';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

const moodConfigs: Record<
  MoodKey,
  {
    label: string;
    summary: string;
    taskHint: string;
    focusHint: string;
    recommendedDuration: number;
    defaultEnergyCost: number;
    defaultXpReward: number;
    ambientPreset: AmbientPreset;
  }
> = {
  lazy: {
    label: 'Slow Start',
    summary: 'A lighter workload keeps momentum easier today.',
    taskHint: 'Short, low-friction tasks will feel better than heavy lifts.',
    focusHint: 'Start with a gentler session and build into the day.',
    recommendedDuration: 15,
    defaultEnergyCost: 6,
    defaultXpReward: 8,
    ambientPreset: 'forest',
  },
  productive: {
    label: 'Full Power',
    summary: 'You have room for deeper focus and bigger rewards.',
    taskHint: 'This is a good day for meaningful progress on top priorities.',
    focusHint: 'Longer sessions and stronger challenges fit your current energy.',
    recommendedDuration: 45,
    defaultEnergyCost: 12,
    defaultXpReward: 15,
    ambientPreset: 'focus',
  },
  overwhelmed: {
    label: 'Reset Mode',
    summary: 'Reduce cognitive load and protect your attention.',
    taskHint: 'Choose one clear target and keep the rest intentionally small.',
    focusHint: 'A short calm session is better than forcing intensity.',
    recommendedDuration: 15,
    defaultEnergyCost: 5,
    defaultXpReward: 10,
    ambientPreset: 'rain',
  },
};

const personalityConfigs: Record<
  PersonalityKey,
  {
    label: string;
    completionPrefix: string;
  }
> = {
  chill: {
    label: 'Chill Buddy',
    completionPrefix: 'Nice work',
  },
  strict: {
    label: 'Strict Coach',
    completionPrefix: 'Good',
  },
  funny: {
    label: 'Funny Savage',
    completionPrefix: 'Clean',
  },
};

import { generateDynamicQuote } from './quotesLibrary';

export type QuoteCategory = 'dashboard' | 'home' | 'tasks' | 'focus' | 'stats';

function getLocalHour(now = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      hourCycle: 'h23',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    const hourPart = formatter.formatToParts(now).find((part) => part.type === 'hour')?.value;
    const hour = Number(hourPart);
    if (!Number.isNaN(hour)) {
      return hour;
    }
  } catch {
    // Fall back to the runtime local clock below.
  }

  return now.getHours();
}

export function getTimeOfDay(now = new Date()): TimeOfDay {
  const hour = getLocalHour(now);
  if (hour >= 0 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function getTimeGreeting(now = new Date()): string {
  const timeOfDay = getTimeOfDay(now);
  if (timeOfDay === 'night') return 'night';
  return timeOfDay;
}

function getMillisecondsUntilNextMinute(now = new Date()): number {
  const nextMinute = new Date(now);
  nextMinute.setSeconds(60, 0);
  return Math.max(1000, nextMinute.getTime() - now.getTime());
}

export function useQuoteClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, getMillisecondsUntilNextMinute());
    };

    schedule();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return now;
}

export function getMoodConfig(mood?: string) {
  return moodConfigs[(mood as MoodKey) || 'productive'] ?? moodConfigs.productive;
}

export function getPersonalityConfig(personalityMode?: string) {
  return (
    personalityConfigs[(personalityMode as PersonalityKey) || 'chill'] ??
    personalityConfigs.chill
  );
}

export function getAmbientPresetLabel(preset: AmbientPreset) {
  if (preset === 'rain') return 'Rain Wash';
  if (preset === 'forest') return 'Forest Air';
  return 'Deep Focus';
}

export function getProfileExperience(profile: UserProfile | null, now = new Date()) {
  const moodKey = (profile?.mood as MoodKey) || 'productive';
  const mood = getMoodConfig(moodKey);
  const personalityKey = (profile?.personality_mode as PersonalityKey) || 'chill';
  const personality = getPersonalityConfig(personalityKey);
  const timeOfDay = getTimeOfDay(now);

  const dashboardQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'dashboard', now);
  const homeQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'home', now);
  const taskQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'tasks', now);
  const focusQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'focus', now);
  const statsQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'stats', now);

  return {
    mood,
    personality,
    dashboardGreeting: dashboardQuote,
    homePulse: homeQuote,
    focusCoaching: focusQuote,
    taskCoaching: taskQuote,
    statsReflection: statsQuote,
    completionMessage: `${personality.completionPrefix} work. ${mood.summary}`,
    ambientPreset: mood.ambientPreset,
  };
}
