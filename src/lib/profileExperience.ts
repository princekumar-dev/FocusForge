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

export type QuoteCategory = 'dashboard' | 'tasks' | 'focus';

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
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

export function getProfileExperience(profile: UserProfile | null) {
  const moodKey = (profile?.mood as MoodKey) || 'productive';
  const mood = getMoodConfig(moodKey);
  const personalityKey = (profile?.personality_mode as PersonalityKey) || 'chill';
  const personality = getPersonalityConfig(personalityKey);
  const timeOfDay = getTimeOfDay();

  const dashboardQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'dashboard');
  const taskQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'tasks');
  const focusQuote = generateDynamicQuote(personalityKey, moodKey, timeOfDay, 'focus');

  return {
    mood,
    personality,
    dashboardGreeting: dashboardQuote,
    focusCoaching: focusQuote,
    taskCoaching: taskQuote,
    completionMessage: `${personality.completionPrefix} work. ${mood.summary}`,
    ambientPreset: mood.ambientPreset,
  };
}
