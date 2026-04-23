export function getAvatarAura(avatar?: string) {
  if (['⚡', '🔥', '✨'].includes(avatar || '')) {
    return {
      glow: 'from-amber-400/40 via-orange-400/20 to-transparent',
      orbit: 'bg-amber-400/70',
      ring: 'border-amber-300/30',
    };
  }

  if (['🌱', '🌿', '🌳'].includes(avatar || '')) {
    return {
      glow: 'from-emerald-400/35 via-lime-300/15 to-transparent',
      orbit: 'bg-emerald-400/70',
      ring: 'border-emerald-300/30',
    };
  }

  if (['🎯', '🏆'].includes(avatar || '')) {
    return {
      glow: 'from-sky-400/35 via-blue-300/15 to-transparent',
      orbit: 'bg-sky-400/70',
      ring: 'border-sky-300/30',
    };
  }

  if (avatar === '👻') {
    return {
      glow: 'from-violet-400/35 via-fuchsia-300/20 to-transparent',
      orbit: 'bg-fuchsia-400/70',
      ring: 'border-fuchsia-300/30',
    };
  }

  if (['🦊', '🐱', '🐼'].includes(avatar || '')) {
    return {
      glow: 'from-rose-400/30 via-orange-300/15 to-transparent',
      orbit: 'bg-rose-400/70',
      ring: 'border-rose-300/30',
    };
  }

  return {
    glow: 'from-primary/35 via-white/10 to-transparent',
    orbit: 'bg-primary/70',
    ring: 'border-white/20',
  };
}

type WhisperOption = {
  text: string;
  tag: string;
};

const AVATAR_WHISPERS: Record<string, WhisperOption[]> = {
  '👻': [
    { tag: 'Ghost ping', text: 'A distraction just walked through the wall. Ignore it and finish one clean mission.' },
    { tag: 'Haunting hint', text: 'The ghost votes for silent mode and ten minutes of deep work.' },
    { tag: 'Phantom combo', text: 'Sneak in a tiny win now. Nobody needs to know except your streak.' },
  ],
  '🌱': [
    { tag: 'Growth cue', text: 'Plant one tiny action now. Small roots still count as progress.' },
    { tag: 'Sprout move', text: 'Pick the easiest task with real value and let momentum grow from there.' },
  ],
  '🌿': [
    { tag: 'Calm cue', text: 'Keep it light and steady. One smooth session beats dramatic overthinking.' },
    { tag: 'Green path', text: 'A gentle twenty minutes would move today forward more than planning again.' },
  ],
  '🌳': [
    { tag: 'Tree wisdom', text: 'Protect your biggest block of attention like it is sacred territory.' },
    { tag: 'Deep roots', text: 'You look ready for the serious mission, not the pretend-busy one.' },
  ],
  '✨': [
    { tag: 'Spark note', text: 'Make the next task strangely beautiful. Clean work is memorable work.' },
    { tag: 'Shimmer cue', text: 'Your brightest move right now is focus, not more tabs.' },
  ],
  '🔥': [
    { tag: 'Heat check', text: 'Your energy is hot enough for one bold move. Spend it on the real target.' },
    { tag: 'Burn mode', text: 'Use this heat before it leaks into random scrolling.' },
  ],
  '⚡': [
    { tag: 'Charge spike', text: 'Fast strike: choose, start, and do not negotiate with yourself.' },
    { tag: 'Voltage tip', text: 'You have enough charge for a sharp sprint. Launch now.' },
  ],
  '🎯': [
    { tag: 'Aim assist', text: 'Pick one target. Not three. Precision is the flex.' },
    { tag: 'Lock on', text: 'The cleanest next move is whichever task actually matters by tonight.' },
  ],
  '🏆': [
    { tag: 'Champion ping', text: 'Do the task that future-you would brag about finishing today.' },
    { tag: 'Victory cue', text: 'One proud win changes the whole tone of a day.' },
  ],
  '🦊': [
    { tag: 'Fox move', text: 'Be clever, not loud. Slip past resistance with a quick meaningful win.' },
    { tag: 'Cunning cue', text: 'Shortcut the drama: start with the task most likely to unlock two others.' },
  ],
  '🐱': [
    { tag: 'Cat wisdom', text: 'Stretch, blink, then choose one thing and stare it down.' },
    { tag: 'Soft hunter', text: 'Quiet focus still counts as serious power.' },
  ],
  '🐼': [
    { tag: 'Panda mode', text: 'Protect your peace first. A calm task done well is enough.' },
    { tag: 'Soft power', text: 'Do not rush the whole day. Just land the next move.' },
  ],
};

const DEFAULT_WHISPERS: WhisperOption[] = [
  { tag: 'Avatar ping', text: 'Your avatar thinks the next meaningful action should start now.' },
  { tag: 'Live cue', text: 'Open one real task and let the rest of the noise wait.' },
];

export function getAvatarWhispers(avatar?: string) {
  return AVATAR_WHISPERS[avatar || ''] ?? DEFAULT_WHISPERS;
}
