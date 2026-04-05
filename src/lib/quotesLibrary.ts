type MoodKey = 'lazy' | 'productive' | 'overwhelmed';
type PersonalityKey = 'chill' | 'strict' | 'funny';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type QuoteCategory = 'dashboard' | 'tasks' | 'focus';

const GREETINGS: Record<PersonalityKey, Record<TimeOfDay, string[]>> = {
  chill: {
    morning: ['Morning friend.', 'Rise and easily shine.', 'A new dawn.', 'Easy morning.'],
    afternoon: ['Good afternoon.', 'Hope the day is flowing well.', 'Mid-day check-in.', 'Afternoon vibes.'],
    evening: ['Evening is here.', 'The day is winding down.', 'Almost sunset.', 'Relaxing evening.'],
    night: ['Late night?', 'The world is quiet.', 'Peaceful night.', 'Nighttime calm.']
  },
  strict: {
    morning: ['Get up.', 'Morning is for execution.', 'The day has begun.', 'Start moving.'],
    afternoon: ['Half the day is gone.', 'Keep up the pace.', 'Afternoon check.', 'No slacking.'],
    evening: ['The sun is setting.', 'Evening means finish, not stop.', 'Final push.', 'Keep working.'],
    night: ['Still awake?', 'Night is for the dedicated.', 'No sleep till done.', 'Focus absolute.']
  },
  funny: {
    morning: ['Morning! Brain buffering...', 'Rise and pretend to shine.', 'Coffee time.', 'We exist again.'],
    afternoon: ['Afternoon panic check.', 'Still here?', 'Surviving the day?', 'Caffeine wearing off?'],
    evening: ['Evening doomscroll incoming?', 'Sun is gone, you are still here.', 'Almost done.', 'Fake it till you sleep.'],
    night: ['2 AM vibes.', 'Go to sleep.', 'Night owl mode activated.', 'Why are we awake?']
  }
};

const ADVICE: Record<PersonalityKey, Record<MoodKey, Record<QuoteCategory, string[]>>> = {
  chill: {
    lazy: {
      dashboard: ['Let’s just take it slow today.', 'Don’t push too hard.', 'Take it easy.'],
      tasks: ['Pick the easiest mission.', 'Small steps are fine.', 'No rush on these.'],
      focus: ['A gentle focus session ahead.', 'Just breathe and do a little.', 'Ease into it.']
    },
    productive: {
      dashboard: ['You have great energy today.', 'Ride the wave smoothly.', 'Smooth sailing today.'],
      tasks: ['Let’s clear these missions effortlessly.', 'Flow through your list.', 'Steady progress.'],
      focus: ['Deep, flowing focus.', 'You have the energy, use it well.', 'Find your rhythm.']
    },
    overwhelmed: {
      dashboard: ['It’s a lot, but we’ll manage.', 'Take a deep breath. One thing at a time.', 'We will handle this gently.'],
      tasks: ['Ignore the big list. Pick one small thing.', 'We don’t need to do it all now.', 'Just one quiet task.'],
      focus: ['Just focus on this one thing.', 'Let the noise fade away.', 'Breathe out the overwhelm.']
    }
  },
  strict: {
    lazy: {
      dashboard: ['Stop being lazy and start executing.', 'Your lack of momentum is unacceptable.', 'Get moving.'],
      tasks: ['Do the easiest task just to start moving.', 'Stop staring at the list.', 'Pick one and execute.'],
      focus: ['Force yourself to focus for 10 minutes.', 'No excuses. Start working.', 'Lock in right now.']
    },
    productive: {
      dashboard: ['Good energy. Do not waste it.', 'Maximize your output today.', 'Total efficiency required.'],
      tasks: ['Crush these high-priority missions.', 'Clear the board. Total victory.', 'Leave nothing unfinished.'],
      focus: ['Absolute concentration.', 'Unleash your full potential right now.', 'No distractions allowed.']
    },
    overwhelmed: {
      dashboard: ['Overwhelmed? That means poor planning.', 'Discipline beats feeling overwhelmed.', 'Regain control.'],
      tasks: ['Stop crying about the list. Execute the top priority.', 'Focus on what matters, ignore the rest.', 'Prioritize immediately.'],
      focus: ['Block the noise. One task only.', 'Pure focus is your only escape.', 'Silence the panic. Work.']
    }
  },
  funny: {
    lazy: {
      dashboard: ['Wow, the energy levels are negative.', 'Is your bed holding you hostage?', 'Doing the absolute minimum today.'],
      tasks: ['Can we at least do one thing to pretend we tried?', 'Pick a task. Any task.', 'Please just click something.'],
      focus: ['Pretend you are working.', 'Let’s try to focus for a whole 5 minutes.', 'Stare at the screen very hard.']
    },
    productive: {
      dashboard: ['Who replaced your coffee with rocket fuel?', 'Look who decided to be a functional adult.', 'Overachiever mode.'],
      tasks: ['Don’t do them all at once, you’ll make us look bad.', 'Crushing missions like a boss.', 'Calm down, terminator.'],
      focus: ['Hyperfixation activated.', 'Don’t forget to blink while you focus.', 'Try not to break the keyboard.']
    },
    overwhelmed: {
      dashboard: ['Everything is on fire, but it’s fine.', 'Welcome to the chaos zone.', 'This is fine.'],
      tasks: ['So many tasks, so little desire to do them.', 'Just pick one and hope the rest disappear.', 'Close your eyes and point.'],
      focus: ['Focus on this so you can ignore everything else.', 'Hide from the responsibilities here.', 'Tunnel vision engaged.']
    }
  }
};

function getStableRandomElement(arr: string[], seedString: string): string {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  return arr[Math.abs(hash) % arr.length];
}

export function generateDynamicQuote(
  personality: PersonalityKey,
  mood: MoodKey,
  timeOfDay: TimeOfDay,
  category: QuoteCategory,
  now = new Date()
): string {
  const seedPrefix = `${now.toDateString()}-${now.getHours()}`;
  
  const greetingsList = GREETINGS[personality]?.[timeOfDay] || GREETINGS.chill.morning;
  const greeting = getStableRandomElement(greetingsList, seedPrefix + category + 'greeting');
  
  const adviceList = ADVICE[personality]?.[mood]?.[category] || ADVICE.chill.productive.dashboard;
  const advice = getStableRandomElement(adviceList, seedPrefix + category + 'advice');
  
  return `${greeting} ${advice}`;
}
