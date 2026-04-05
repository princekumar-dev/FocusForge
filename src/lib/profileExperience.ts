import type { UserProfile } from '@/contexts/AuthContext';

type MoodKey = 'lazy' | 'productive' | 'overwhelmed';
type PersonalityKey = 'chill' | 'strict' | 'funny';
type AmbientPreset = 'rain' | 'forest' | 'focus';

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
    homePrompt: string;
    focusPrompt: string;
    completionPrefix: string;
  }
> = {
  chill: {
    label: 'Chill Buddy',
    homePrompt: 'Let’s keep today steady and satisfying.',
    focusPrompt: 'Breathe, settle in, and keep the pace smooth.',
    completionPrefix: 'Nice work',
  },
  strict: {
    label: 'Strict Coach',
    homePrompt: 'Pick the priority and finish it before you drift.',
    focusPrompt: 'Stay on task. This block has one job only.',
    completionPrefix: 'Good',
  },
  funny: {
    label: 'Funny Savage',
    homePrompt: 'Tiny chaos is acceptable. Missing the mission is not.',
    focusPrompt: 'Lock in before your brain opens twelve side quests.',
    completionPrefix: 'Clean',
  },
};

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
  const mood = getMoodConfig(profile?.mood);
  const personality = getPersonalityConfig(profile?.personality_mode);

  return {
    mood,
    personality,
    dashboardGreeting: `${personality.homePrompt} ${mood.summary}`,
    focusCoaching: `${personality.focusPrompt} ${mood.focusHint}`,
    taskCoaching: `${mood.taskHint}`,
    completionMessage: `${personality.completionPrefix} work. ${mood.summary}`,
    ambientPreset: mood.ambientPreset,
  };
}
