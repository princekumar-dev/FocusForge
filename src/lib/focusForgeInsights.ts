import type { UserProfile } from '@/contexts/AuthContext';

export type InsightTask = {
  id: number;
  title?: string;
  priority?: string;
  xp_reward?: number;
  energy_cost?: number;
  category?: string;
  completed_at?: string;
};

export type RitualPreset = {
  id: string;
  name: string;
  tag: string;
  duration: number;
  ambient: 'rain' | 'forest' | 'focus';
  description: string;
  taskId?: number;
  taskLabel?: string;
};

const ORACLE_PATTERNS = [
  {
    title: 'Boss Battle Window',
    subtitle: 'Your strongest work deserves a dramatic entrance.',
    mantra: 'Pick one intimidating mission and turn it into tonight\'s trophy.',
    reward: '+25 confidence',
    cta: 'Enter focus mode',
    route: '/focus',
    tone: 'primary',
  },
  {
    title: 'Combo Chain',
    subtitle: 'Small wins can stack into a ridiculous momentum streak.',
    mantra: 'Clear two lighter missions back-to-back before touching the heavy one.',
    reward: '2-task combo',
    cta: 'Open missions',
    route: '/tasks',
    tone: 'emerald',
  },
  {
    title: 'Quiet Power',
    subtitle: 'A calm day can still become an elite day.',
    mantra: 'Protect your attention first. Output comes second.',
    reward: 'Lower stress, cleaner focus',
    cta: 'Tune a ritual',
    route: '/focus',
    tone: 'sky',
  },
  {
    title: 'Recovery Arc',
    subtitle: 'You do not need hype. You need traction.',
    mantra: 'Choose the easiest meaningful task and make it beautifully done.',
    reward: 'Momentum restored',
    cta: 'Find a starter task',
    route: '/tasks',
    tone: 'amber',
  },
  {
    title: 'Legend Seed',
    subtitle: 'Today looks ordinary until you complete the first mission.',
    mantra: 'Start now and let the streak story write itself.',
    reward: 'Future-you thanks you',
    cta: 'View hall of fame',
    route: '/stats',
    tone: 'violet',
  },
];

const BADGE_LIBRARY = [
  {
    id: 'evergreen',
    label: 'Evergreen Engine',
    unlocksWhen: (profile: UserProfile | null) => (profile?.focus_minutes || 0) >= 180,
    note: 'Three hours of focused output banked.',
  },
  {
    id: 'boss_slayer',
    label: 'Boss Slayer',
    unlocksWhen: (_profile: UserProfile | null, recentCompleted: InsightTask[]) =>
      recentCompleted.some((task) => task.priority === 'high'),
    note: 'You have cleared at least one high-priority mission.',
  },
  {
    id: 'combo_artist',
    label: 'Combo Artist',
    unlocksWhen: (profile: UserProfile | null) => (profile?.tasks_completed || 0) >= 10,
    note: 'Double digits in total completed missions.',
  },
  {
    id: 'streak_warden',
    label: 'Streak Warden',
    unlocksWhen: (profile: UserProfile | null) => (profile?.streak || 0) >= 3,
    note: 'Three or more active streak days protected.',
  },
  {
    id: 'mythic_bloom',
    label: 'Mythic Bloom',
    unlocksWhen: (profile: UserProfile | null) => (profile?.tree_stage || 1) >= 4,
    note: 'Your focus tree has reached its final visible form.',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function priorityWeight(priority?: string) {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
}

function seedFrom(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function sortTasks(tasks: InsightTask[]) {
  return [...tasks].sort((a, b) => {
    const priorityDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return (b.xp_reward || 0) - (a.xp_reward || 0);
  });
}

export function buildFocusForecast(profile: UserProfile | null, tasks: InsightTask[]) {
  const energy = profile?.energy || 0;
  const maxEnergy = profile?.max_energy || 100;
  const streak = profile?.streak || 0;
  const energyPercent = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
  const pending = tasks.length;
  const highPriority = tasks.filter((task) => task.priority === 'high').length;
  const weightedLoad = tasks.reduce(
    (total, task) => total + priorityWeight(task.priority) * 9 + (task.energy_cost || 0),
    0
  );

  const momentum = clamp(
    Math.round(energyPercent * 0.45 + Math.min(streak, 7) * 8 + Math.max(0, 24 - pending * 2)),
    8,
    99
  );
  const overload = clamp(
    Math.round(weightedLoad * 0.35 + highPriority * 14 - energyPercent * 0.18),
    4,
    96
  );

  let windowLabel = 'Steady Climb';
  let headline = 'Your systems are warm and ready.';
  if (energyPercent >= 75 && highPriority > 0) {
    windowLabel = 'Power Rush';
    headline = 'This is a premium hour for your hardest mission.';
  } else if (energyPercent <= 35 || overload >= 70) {
    windowLabel = 'Soft Reset';
    headline = 'Your best move is precision, not brute force.';
  } else if (pending <= 2) {
    windowLabel = 'Clean Sweep';
    headline = 'You are close enough to finish the board with style.';
  }

  const sparkLabel =
    momentum >= 75 ? 'Momentum signal is loud.' : overload >= 65 ? 'Pressure is rising.' : 'Cadence is healthy.';

  return {
    momentum,
    overload,
    windowLabel,
    headline,
    sparkLabel,
  };
}

export function buildDailyOracle(
  profile: UserProfile | null,
  tasks: InsightTask[],
  userId?: string
) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const seed = seedFrom(`${todayKey}:${userId || 'guest'}:${profile?.level || 1}:${tasks.length}`);
  const pattern = ORACLE_PATTERNS[seed % ORACLE_PATTERNS.length];
  const topTask = sortTasks(tasks)[0];

  const targetHint = topTask
    ? `Target lock: ${topTask.title || 'your top mission'}`
    : 'No mission selected yet. Forge a new one and claim the day.';

  return {
    ...pattern,
    targetHint,
  };
}

export function buildFocusRituals(profile: UserProfile | null, tasks: InsightTask[]): RitualPreset[] {
  const sorted = sortTasks(tasks);
  const bossTask = sorted[0];
  const lighterTask = [...sorted]
    .reverse()
    .sort((a, b) => (a.energy_cost || 0) - (b.energy_cost || 0))[0];
  const mediumTask = sorted[Math.min(1, Math.max(sorted.length - 1, 0))] || sorted[0];
  const mood = profile?.mood || 'productive';

  return [
    {
      id: 'boss-battle',
      name: 'Boss Battle',
      tag: 'High drama',
      duration: mood === 'productive' ? 45 : 30,
      ambient: 'focus',
      description: bossTask
        ? `Aim this session at ${bossTask.title}. Big output, no mercy.`
        : 'Reserve this for the hardest thing on your board.',
      taskId: bossTask?.id,
      taskLabel: bossTask?.title,
    },
    {
      id: 'ghost-sprint',
      name: 'Ghost Sprint',
      tag: 'Low friction',
      duration: 15,
      ambient: mood === 'overwhelmed' ? 'rain' : 'forest',
      description: lighterTask
        ? `Quick stealth win on ${lighterTask.title}. Rebuild motion without resistance.`
        : 'A quiet sprint to restart your engine.',
      taskId: lighterTask?.id,
      taskLabel: lighterTask?.title,
    },
    {
      id: 'combo-forge',
      name: 'Combo Forge',
      tag: 'Momentum stack',
      duration: 25,
      ambient: mood === 'lazy' ? 'forest' : 'focus',
      description: mediumTask
        ? `Use ${mediumTask.title} as your opener, then chain straight into the next win.`
        : 'Turn one clean session into a run of completions.',
      taskId: mediumTask?.id,
      taskLabel: mediumTask?.title,
    },
  ];
}

export function buildSignatureTraits(
  profile: UserProfile | null,
  recentCompleted: InsightTask[]
) {
  const streak = profile?.streak || 0;
  const focusMinutes = profile?.focus_minutes || 0;
  const totalXp = profile?.total_xp || 0;
  const highPriorityFinishes = recentCompleted.filter((task) => task.priority === 'high').length;

  return [
    {
      id: 'discipline',
      label: 'Discipline',
      value: clamp(Math.round(streak * 18 + Math.min(focusMinutes, 180) * 0.18), 12, 100),
      note: 'How reliably you come back and do the work.',
    },
    {
      id: 'intensity',
      label: 'Intensity',
      value: clamp(Math.round(Math.min(totalXp, 1200) * 0.08 + highPriorityFinishes * 16), 10, 100),
      note: 'How boldly you attack meaningful missions.',
    },
    {
      id: 'composure',
      label: 'Composure',
      value: clamp(
        Math.round((profile?.energy || 0) * 0.55 + (profile?.streak_freezes || 0) * 9),
        8,
        100
      ),
      note: 'How well you preserve energy when the day gets noisy.',
    },
  ];
}

export function buildLegendBadges(profile: UserProfile | null, recentCompleted: InsightTask[]) {
  return BADGE_LIBRARY.map((badge) => ({
    ...badge,
    unlocked: badge.unlocksWhen(profile, recentCompleted),
  }));
}
