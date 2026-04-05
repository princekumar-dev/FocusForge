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

type QuoteCategory = 'dashboard' | 'tasks' | 'focus';

const COACH_QUOTES: Record<PersonalityKey, Record<TimeOfDay, Record<QuoteCategory, string[]>>> = {
  chill: {
    morning: {
      dashboard: [
        'Ease into the morning, friend. One thing at a time.',
        'Sunlight and a fresh start. No rush, just steady progress.',
        'Good morning. Let’s keep things peaceful today.'
      ],
      tasks: [
        'Let’s gently outline what needs to be done today.',
        'No need to overwhelm yourself. Pick one mission to start.',
        'A calm morning is perfect for organizing your thoughts.'
      ],
      focus: [
        'Brew a warm drink, settle in, and let’s begin.',
        'Take a deep breath. We have all the time we need for this.',
        'Find your center before we dive into the details.'
      ]
    },
    afternoon: {
      dashboard: [
        'Mid-day check-in. Breathe and keep that flow going.',
        'Afternoon sun is here. Stay steady, you’re doing great.',
        'Nice and easy does it. You’ve got this handled.'
      ],
      tasks: [
        'Reviewing missions. Take it step by step.',
        'Don’t rush. Consistent effort beats sporadic speed.',
        'Clear your mind and let’s pick the next gentle step.'
      ],
      focus: [
        'Stay grounded. Gently return your attention to the task.',
        'Let the afternoon quiet guide your concentration.',
        'Smooth and steady focus. No sudden movements.'
      ]
    },
    evening: {
      dashboard: [
        'Winding down soon. Let’s finish the essentials gracefully.',
        'Evening vibes. A few more small wins and we’re done.',
        'Almost there. Keep the peace and finish strong.'
      ],
      tasks: [
        'Time to prioritize the final gentle tasks of the day.',
        'Focus on what matters most before the day ends.',
        'Let’s sort out the remaining missions with calm.'
      ],
      focus: [
        'Let the evening stillness deepen your focus.',
        'Almost done. Maintain your peaceful rhythm.',
        'Closing out the day with one last gentle push.'
      ]
    },
    night: {
      dashboard: [
        'Burning the late oil? Keep it calm and focused.',
        'Silence is focus. Let’s wrap this up gently.',
        'Quiet wins are the best. Peaceful night to you.'
      ],
      tasks: [
        'Preparing missions under the moonlight. Very chill.',
        'Keep the late-night planning simple and stress-free.',
        'Organizing thoughts in the quiet of the night.'
      ],
      focus: [
        'The world is asleep, leaving you space to think clearly.',
        'Focus deeply, but don’t forget to rest soon.',
        'A tranquil late session. Enjoy the silence.'
      ]
    }
  },
  strict: {
    morning: {
      dashboard: [
        'The day started 5 minutes ago. Get to work.',
        'Morning is for execution. No excuses.',
        'Priorities first. Everything else is noise.'
      ],
      tasks: [
        'Stop looking at the list and start checking boxes.',
        'Your missions won’t complete themselves. Move.',
        'Plan quickly, execute immediately.'
      ],
      focus: [
        'Shut out all distractions. Now.',
        'This block is for work. Nothing else matters.',
        'Lock your attention. Do not break focus.'
      ]
    },
    afternoon: {
      dashboard: [
        'Afternoon slump is for the weak. Push through.',
        'The clock is ticking. Are you producing value?',
        'Maintain the standard. Every second counts.'
      ],
      tasks: [
        'Half the day is gone. Is your list shrinking?',
        'Re-evaluate and attack the remaining missions.',
        'No hesitations. Pick a task and destroy it.'
      ],
      focus: [
        'Fatigue is an illusion. Keep pushing.',
        'Maintain absolute concentration. No slacking.',
        'Eyes on the goal until it is achieved.'
      ]
    },
    evening: {
      dashboard: [
        'Evening doesn’t mean stop. It means finish.',
        'The sun is down, but the work isn’t done.',
        'Final push. Discipline over motivation.'
      ],
      tasks: [
        'Secure tomorrow’s victories by planning tonight.',
        'Finish what you started before you sleep.',
        'Only weak minds leave tasks incomplete.'
      ],
      focus: [
        'One more block. Give it everything you have left.',
        'Do not let the approaching night soften your resolve.',
        'Finish strong. Accept no compromises.'
      ]
    },
    night: {
      dashboard: [
        'Night owl? Good. Use the silence to dominate.',
        'The day ends when the work is finished.',
        'Sleep is a reward, not a right.'
      ],
      tasks: [
        'Late night planning. Make sure tomorrow is flawless.',
        'Review the damages. Prepare the next assault.',
        'No loose ends before the day resets.'
      ],
      focus: [
        'Uninterrupted time. Maximum output expected.',
        'Focus until the task is dead. No questions.',
        'The late hours belong to the dedicated.'
      ]
    }
  },
  funny: {
    morning: {
      dashboard: [
        'Wake up, champ. Your brain is buffering, let’s help it.',
        'Rise and shine. Or just rise and look busy.',
        'New day, same chaos. Let’s make it productive chaos.'
      ],
      tasks: [
        'Let’s look at today’s ridiculous expectations.',
        'Time to prioritize which fires to put out first.',
        'Ah, the to-do list. My favorite daily fiction.'
      ],
      focus: [
        'Please attempt to focus. I know it’s hard.',
        'Let’s pretend we are capable of deep thought today.',
        'Hide your phone. We are attempting productivity.'
      ]
    },
    afternoon: {
      dashboard: [
        'Afternoon! Your brain is currently 40% coffee, 60% panic.',
        'Focus! The internet isn’t going anywhere, unfortunately.',
        'Is that productivity I smell? Or just burnt toast?'
      ],
      tasks: [
        'Let’s see what we’ve procrastinated on so far.',
        'Moving tasks to tomorrow is a valid strategy, right?',
        'Pick the least painful mission and get it over with.'
      ],
      focus: [
        'Keep going before your brain opens twelve side quests.',
        'Staring at the screen counts as working, technically.',
        'Let’s try to stay on one tab for more than 3 minutes.'
      ]
    },
    evening: {
      dashboard: [
        'Evening! Time to pretend we did a lot of work.',
        'The sun is leaving. Maybe you should finish something too.',
        'Almost done. Don’’t let your bed win just yet.'
      ],
      tasks: [
        'Let’s desperately finish things before the day ends.',
        'Tomorrow is looking suspiciously crowded already.',
        'One more task before we succumb to the doomscrolling.'
      ],
      focus: [
        'Focusing at this hour? Your desperation is showing.',
        'Let’s power through the end-of-day delusions.',
        'Just a little more effort to avoid tomorrow’s regret.'
      ]
    },
    night: {
      dashboard: [
        'Late night? Your sleep schedule is officially a myth.',
        'Focusing at 2 AM? You’re either a genius or desperate.',
        'Wrap it up, space explorer. Reality is calling.'
      ],
      tasks: [
        'Planning at night because the day was a disaster.',
        'Let’s add things to the list we both know won’t happen.',
        'Organizing chaos in the dark.'
      ],
      focus: [
        'Last mission before the hallucinations start.',
        'Your bed is begging you to stop. Don’t listen.',
        'Late night focus: fueled by regret and caffeine.'
      ]
    }
  }
};

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function getStableRandomQuote(quotes: string[], category: QuoteCategory): string {
  // Use current hour + date + category as seed for stable randomness within the time slot
  const seed = new Date().toDateString() + new Date().getHours() + category;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % quotes.length;
  return quotes[index];
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
  const mood = getMoodConfig(profile?.mood);
  const personalityKey = (profile?.personality_mode as PersonalityKey) || 'chill';
  const personality = getPersonalityConfig(personalityKey);
  const timeOfDay = getTimeOfDay();

  const timeQuotes = COACH_QUOTES[personalityKey]?.[timeOfDay] || COACH_QUOTES.chill.morning;
  
  const dashboardQuote = getStableRandomQuote(timeQuotes.dashboard, 'dashboard');
  const taskQuote = getStableRandomQuote(timeQuotes.tasks, 'tasks');
  const focusQuote = getStableRandomQuote(timeQuotes.focus, 'focus');

  return {
    mood,
    personality,
    dashboardGreeting: `${dashboardQuote} ${mood.summary}`,
    focusCoaching: `${focusQuote} ${mood.focusHint}`,
    taskCoaching: `${taskQuote}`,
    completionMessage: `${personality.completionPrefix} work. ${mood.summary}`,
    ambientPreset: mood.ambientPreset,
  };
}
