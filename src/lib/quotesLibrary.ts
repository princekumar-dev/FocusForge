type MoodKey = 'lazy' | 'productive' | 'overwhelmed';
type PersonalityKey = 'chill' | 'strict' | 'funny';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
type QuoteCategory = 'dashboard' | 'home' | 'tasks' | 'focus' | 'stats';

const GREETINGS: Record<PersonalityKey, Record<TimeOfDay, string[]>> = {
  chill: {
    morning: ['Morning friend.', 'Easy morning.', 'Fresh start energy.', 'A calm new day.'],
    afternoon: ['Good afternoon.', 'Afternoon vibes.', 'Midday check-in.', 'The day is still yours.'],
    evening: ['Evening is here.', 'Soft landing time.', 'A slower hour has arrived.', 'Settle into the evening.'],
    night: ['Late night?', 'The world is quiet.', 'Peaceful night.', 'A quiet hour is here.'],
  },
  strict: {
    morning: ['Get up.', 'Day start. No excuses.', 'Morning is for execution.', 'Start moving.'],
    afternoon: ['Maintain output.', 'Half the day is gone.', 'Afternoon check.', 'Keep the pace.'],
    evening: ['Close strong.', 'Final push.', 'Evening means finish, not stop.', 'Keep working.'],
    night: ['Still awake?', 'Late hour. Stay sharp.', 'Night is for the dedicated.', 'Focus absolute.'],
  },
  funny: {
    morning: ['Morning. Systems online.', 'We exist again.', 'Coffee time.', 'Operating system loaded. Barely.'],
    afternoon: ['Afternoon panic check.', 'Still here?', 'Midday chaos report?', 'Caffeine wearing off?'],
    evening: ['Evening arc unlocked.', 'Almost done.', 'We made it this far somehow.', 'Fake it till bedtime.'],
    night: ['Night owl mode activated.', 'Why are we awake?', 'This feels medically late.', '2 AM vibes.'],
  },
};

const ADVICE: Record<PersonalityKey, Record<MoodKey, Record<QuoteCategory, string[]>>> = {
  chill: {
    lazy: {
      dashboard: [
        'Keep the bar low and kind today.',
        'Take it easy and protect your energy.',
        'Today can be gentle and still count.',
        'A soft pace is still forward motion.',
      ],
      home: [
        'Build the day around one manageable win.',
        'Let your home base feel calm and clear.',
        'Keep today simple enough to actually start.',
        'A quiet plan can carry the whole day.',
      ],
      tasks: [
        'Choose the least intimidating mission first.',
        'One tiny win is enough to begin.',
        'Small steps are perfectly valid here.',
        'Pick the easiest task and let momentum grow.',
      ],
      focus: [
        'Keep this focus session soft and simple.',
        'A little attention still counts.',
        'Ease into the work instead of forcing it.',
        'Gentle concentration is enough for now.',
      ],
      stats: [
        'Your progress still matters on slower days.',
        'Small wins stack up more than they seem.',
        'The numbers still tell a real story.',
        'Even a gentle pace leaves footprints behind.',
      ],
    },
    productive: {
      dashboard: [
        'This feels like a high-momentum day.',
        'You have real lift in the air today.',
        'Ride the wave smoothly.',
        'There is room for meaningful progress here.',
      ],
      home: [
        'Your dashboard is ready for a strong run.',
        'This is a good day to move the big pieces.',
        'Set the tone here and let the rest follow.',
        'You have enough energy to shape the day well.',
      ],
      tasks: [
        'This is a good moment for important work.',
        'Push the meaningful tasks forward first.',
        'Flow through the list with intent.',
        'Steady progress will feel natural today.',
      ],
      focus: [
        'This is the kind of day for deep focus.',
        'Lock into the work that matters most.',
        'Find your rhythm and stay with it.',
        'Longer focus should feel good right now.',
      ],
      stats: [
        'These numbers look like momentum, not luck.',
        'You are building a pattern worth keeping.',
        'The scoreboard is reflecting real consistency.',
        'Your progress has shape and direction now.',
      ],
    },
    overwhelmed: {
      dashboard: [
        'You do not need to solve everything at once.',
        'The day can shrink down to one step.',
        'Take a breath. We will handle this gently.',
        'It is okay to make today smaller.',
      ],
      home: [
        'Let home base stay quiet while the rest feels loud.',
        'Start here, then let the day narrow itself down.',
        'You only need one grounded next step from here.',
        'Use this space to reset before choosing the next move.',
      ],
      tasks: [
        'Choose the clearest next move.',
        'Let the list be bigger than today.',
        'One quiet task is enough for now.',
        'Ignore the whole pile and pick one thing.',
      ],
      focus: [
        'Borrow calm from the timer.',
        'One protected pocket of attention is enough.',
        'Let the noise fade to the edges.',
        'Just stay with this one thing.',
      ],
      stats: [
        'Your history proves you come back from heavy days.',
        'The record is bigger than today\'s stress.',
        'Your progress did not disappear because today feels loud.',
        'This timeline has more resilience than today suggests.',
      ],
    },
  },
  strict: {
    lazy: {
      dashboard: [
        'Momentum is created, not found.',
        'This drift ends now.',
        'Get moving.',
        'Your pace needs correction immediately.',
      ],
      home: [
        'Set the standard here and carry it through the day.',
        'This dashboard should become an execution board.',
        'Begin with clarity, then move fast.',
        'Establish control from the first screen.',
      ],
      tasks: [
        'Action first, motivation later.',
        'Clear one task and regain control.',
        'Stop staring at the list and execute.',
        'Pick the easiest target and finish it.',
      ],
      focus: [
        'Sit down and concentrate.',
        'Discipline begins with a single session.',
        'No excuses. Start working.',
        'Lock in right now.',
      ],
      stats: [
        'The numbers expose effort honestly.',
        'Progress is measurable. So is avoidance.',
        'Use the data and correct your pace.',
        'Your record does not care about excuses.',
      ],
    },
    productive: {
      dashboard: [
        'Strong day. Convert it into results.',
        'High capacity demands high standards.',
        'Good energy. Do not waste it.',
        'Maximize output while the window is open.',
      ],
      home: [
        'Use this position to direct the day aggressively.',
        'Strong overview. Strong execution should follow.',
        'This is the moment to align and advance.',
        'Start from the top and impose order quickly.',
      ],
      tasks: [
        'Attack the most important work first.',
        'Use this momentum with precision.',
        'Clear the board with intent.',
        'High-priority missions should fall today.',
      ],
      focus: [
        'This is a session for serious output.',
        'Concentrate with intent.',
        'Absolute concentration is available now.',
        'No distractions allowed.',
      ],
      stats: [
        'These totals are evidence of disciplined work.',
        'The scoreboard rewards consistency, not hype.',
        'Your output is becoming visible.',
        'This progress curve should continue upward.',
      ],
    },
    overwhelmed: {
      dashboard: [
        'Control returns when priorities are enforced.',
        'Reduce chaos through structure.',
        'Regain control.',
        'Discipline beats feeling overwhelmed.',
      ],
      home: [
        'Stabilize the board before engaging the work.',
        'Use this screen to reassert control.',
        'Order begins here, before the first task.',
        'Reset the plan, then act with discipline.',
      ],
      tasks: [
        'Rank the work, then act.',
        'Cut the noise and choose the critical task.',
        'Prioritize immediately.',
        'Focus on what matters and ignore the rest.',
      ],
      focus: [
        'A narrow target beats scattered effort.',
        'Constrain your attention and proceed.',
        'One task only.',
        'Silence the panic. Work.',
      ],
      stats: [
        'Past execution is your evidence, not your mood.',
        'Use the data to restore order.',
        'Your totals show capability even when today feels messy.',
        'This scoreboard is a control panel, not decoration.',
      ],
    },
  },
  funny: {
    lazy: {
      dashboard: [
        'Productivity has left the chat.',
        'This vibe is one strong yawn.',
        'Doing the absolute minimum today.',
        'Your energy levels are sending a warning.',
      ],
      home: [
        'Welcome home to the land of low battery.',
        'This dashboard is giving sleepy goblin energy.',
        'Let us act organized for at least five minutes.',
        'Home base looks stable, which is more than we can say for motivation.',
      ],
      tasks: [
        'Choose the task least likely to fight back.',
        'Let us complete one task for the illusion of control.',
        'Pick a task. Any task.',
        'Please click something useful.',
      ],
      focus: [
        'Let us cosplay as concentrated people.',
        'One tiny focus session for dramatic effect.',
        'Pretend you are working convincingly.',
        'Stare at the screen with purpose.',
      ],
      stats: [
        'The stats are trying not to judge you.',
        'Your progress chart survived your nap arc.',
        'Look, numbers. Proof that things happened.',
        'Honestly, this is better than expected.',
      ],
    },
    productive: {
      dashboard: [
        'This is suspiciously competent behavior.',
        'You are one spreadsheet away from being unstoppable.',
        'Overachiever mode detected.',
        'Who replaced your coffee with rocket fuel?',
      ],
      home: [
        'This home screen looks like it belongs to someone responsible.',
        'You are dangerously close to having your life together.',
        'The dashboard is locked in and mildly intimidating.',
        'This is premium main-character productivity framing.',
      ],
      tasks: [
        'This to-do list is about to get bullied.',
        'Please leave at least one task for tomorrow.',
        'Crushing missions like a boss.',
        'Calm down, terminator.',
      ],
      focus: [
        'This is premium locked-in behavior.',
        'Channel the chaos into something useful.',
        'Hyperfixation activated.',
        'Try not to break the keyboard.',
      ],
      stats: [
        'These stats are getting annoyingly impressive.',
        'The numbers say you might actually know what you are doing.',
        'This scoreboard is starting to brag on your behalf.',
        'Rude amount of progress, honestly.',
      ],
    },
    overwhelmed: {
      dashboard: [
        'Today feels like seven tabs playing audio at once.',
        'The circus is in town and it is your brain.',
        'Welcome to the chaos zone.',
        'Everything is on fire, but it is fine.',
      ],
      home: [
        'Home base is calm even if your brain is not.',
        'This dashboard is doing emotional support duties now.',
        'Let us stand here dramatically before touching the chaos.',
        'The control room looks stable. Please act like it.',
      ],
      tasks: [
        'Pick the task least likely to start a sequel.',
        'Let us choose one task before the plot thickens.',
        'Just pick one and hope the rest disappear.',
        'Close your eyes and point if needed.',
      ],
      focus: [
        'Use the timer as emotional camouflage.',
        'One task only. The rest can wait outside.',
        'Tunnel vision engaged.',
        'Hide from the responsibilities in here.',
      ],
      stats: [
        'The stats are calmer than your nervous system.',
        'Your progress survived the chaos gremlin.',
        'This chart says you are doing better than the panic claims.',
        'Even with the mess, the numbers kept counting.',
      ],
    },
  },
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
  const greeting = getStableRandomElement(greetingsList, `${seedPrefix}-${category}-greeting`);

  const adviceList = ADVICE[personality]?.[mood]?.[category] || ADVICE.chill.productive.dashboard;
  const advice = getStableRandomElement(adviceList, `${seedPrefix}-${category}-advice`);

  return `${greeting} ${advice}`;
}
