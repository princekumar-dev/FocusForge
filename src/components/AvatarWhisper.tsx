import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarAura, getAvatarWhispers } from '@/lib/avatarPresence';
import LivingAvatar from '@/components/LivingAvatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type WhisperState = {
  tag: string;
  text: string;
  x: number;
  y: number;
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function AvatarWhisper() {
  const { profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [whisper, setWhisper] = useState<WhisperState | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const hideRef = useRef<number | null>(null);

  const avatar = profile?.avatar || '🌱';
  const aura = getAvatarAura(avatar);
  const whisperPool = useMemo(() => getAvatarWhispers(avatar), [avatar]);

  useEffect(() => {
    if (!user || !profile) return undefined;

    const clearTimers = () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (hideRef.current) {
        window.clearTimeout(hideRef.current);
        hideRef.current = null;
      }
    };

    const scheduleWhisper = () => {
      clearTimers();
      timeoutRef.current = window.setTimeout(() => {
        const selected = whisperPool[randomBetween(0, whisperPool.length - 1)];
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isGhost = avatar === '👻';

        setWhisper({
          ...selected,
          x: width <= 768 ? randomBetween(16, Math.max(16, width - 260)) : randomBetween(24, Math.max(24, width - 340)),
          y: isGhost
            ? randomBetween(88, Math.max(88, height - 260))
            : randomBetween(Math.max(110, height - 280), Math.max(120, height - 180)),
        });

        hideRef.current = window.setTimeout(() => {
          setWhisper(null);
          scheduleWhisper();
        }, isGhost ? 8500 : 7000);
      }, avatar === '👻' ? randomBetween(18000, 32000) : randomBetween(28000, 52000));
    };

    scheduleWhisper();

    return () => {
      clearTimers();
    };
  }, [avatar, profile, user, whisperPool]);

  if (!user || !profile || !whisper) return null;

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[70] transition-all duration-700',
        avatar === '👻' ? 'avatar-ghost-drift' : 'avatar-whisper-float'
      )}
      style={{ left: whisper.x, top: whisper.y }}
    >
      <div className={cn('pointer-events-auto w-[220px] rounded-[1.75rem] border glass shadow-2xl p-4 relative overflow-hidden', aura.ring)}>
        <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', aura.glow)} />
        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <LivingAvatar
              avatar={avatar}
              className="w-11 h-11 flex-shrink-0"
              emojiClassName="text-2xl"
              orbitClassName="scale-75"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase font-black tracking-[0.24em] text-foreground/55">{whisper.tag}</p>
                <Sparkles className="w-3.5 h-3.5 text-primary/70" />
              </div>
              <p className="text-sm font-semibold text-foreground/80 leading-relaxed mt-1">{whisper.text}</p>
            </div>
            <button
              className="rounded-full p-1 text-foreground/35 hover:text-foreground/70 transition-colors"
              onClick={() => setWhisper(null)}
              aria-label="Dismiss avatar whisper"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border-white/20 bg-white/10 hover:bg-white/15 text-[11px] font-black"
              onClick={() => navigate('/focus')}
            >
              Focus now
            </Button>
            {location.pathname !== '/tasks' && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl text-[11px] font-black"
                onClick={() => navigate('/tasks')}
              >
                Open tasks
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
