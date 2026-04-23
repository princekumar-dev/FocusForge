export const TREE_IMAGES = [
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/8be1b573-5ac2-42c0-aef4-e74b1927458b.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/2d779ed0-91f6-4136-9092-e2e6eb8d0b24.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/63a602a0-fd88-4fc1-a7fe-3767da930a20.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/49d8b50c-25e9-41ee-a8b9-a8f94fd15e10.png',
] as const;

export const MAX_TREE_STAGE = 9;

export function getTreeStageForLevel(level: number) {
  return Math.min(MAX_TREE_STAGE, Math.max(1, Math.ceil(level / 3)));
}

export function getTreeImageIndex(stage: number) {
  if (stage <= 2) return 0;
  if (stage <= 4) return 1;
  if (stage <= 6) return 2;
  return 3;
}

export function getTreeCopy(stage: number) {
  if (stage <= 1) return 'A tiny sprout. Your system is just waking up.';
  if (stage <= 2) return 'Fresh roots are forming. Consistency is starting to show.';
  if (stage <= 3) return 'A young bloom. Momentum is becoming visible.';
  if (stage <= 4) return 'Growing nicely. You are no longer guessing, you are building.';
  if (stage <= 5) return 'Branches are stretching. Hard days are turning into real output.';
  if (stage <= 6) return 'A strong tree. Your focus habits now have weight.';
  if (stage <= 7) return 'Dense canopy. The app can feel your routine locking in.';
  if (stage <= 8) return 'Ancient growth. You are operating with real discipline.';
  return 'Mythic bloom. Level 27 means this tree belongs in legend.';
}
