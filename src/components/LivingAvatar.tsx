import { cn } from '@/lib/utils';
import { getAvatarAura } from '@/lib/avatarPresence';

type LivingAvatarProps = {
  avatar?: string;
  className?: string;
  emojiClassName?: string;
  orbitClassName?: string;
};

export default function LivingAvatar({
  avatar = '🌱',
  className,
  emojiClassName,
  orbitClassName,
}: LivingAvatarProps) {
  const aura = getAvatarAura(avatar);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <div className={cn('avatar-halo absolute inset-0 rounded-full border', aura.ring)} />
      <div className={cn('absolute inset-[-12%] rounded-full bg-gradient-to-br blur-xl', aura.glow)} />

      <span className={cn('avatar-orbit avatar-orbit-slow', orbitClassName)}>
        <span className={cn('avatar-orbit-dot', aura.orbit)} />
      </span>
      <span className={cn('avatar-orbit avatar-orbit-fast', orbitClassName)}>
        <span className={cn('avatar-orbit-dot avatar-orbit-dot-sm', aura.orbit)} />
      </span>

      <span className={cn('avatar-core relative z-10 select-none', emojiClassName)}>{avatar}</span>
    </div>
  );
}
