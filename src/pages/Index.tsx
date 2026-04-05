import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { getProfileExperience, getTimeGreeting, useQuoteClock } from '@/lib/profileExperience';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import BottomNav from '@/components/BottomNav';
import ConfettiEffect from '@/components/ConfettiEffect';
import {
  Flame, Zap, Trophy, Target, ChevronRight, Plus, Sparkles, LogIn,
} from 'lucide-react';
import { useAvatarSound } from '@/hooks/useAvatarSound';


const TREE_IMAGES = [
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/8be1b573-5ac2-42c0-aef4-e74b1927458b.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/2d779ed0-91f6-4136-9092-e2e6eb8d0b24.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/63a602a0-fd88-4fc1-a7fe-3767da930a20.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/49d8b50c-25e9-41ee-a8b9-a8f94fd15e10.png',
];

function xpForLevel(level: number) {
  return level * 100;
}

interface Task {
  id: number;
  title: string;
  priority: string;
  status: string;
  category: string;
  xp_reward: number;
  energy_cost: number;
}

const priorityColor = (p: string) => {
  switch (p) {
    case 'high': return 'text-destructive font-bold';
    case 'medium': return 'text-foreground font-semibold';
    default: return 'text-muted-foreground';
  }
};

function getGreeting(now: Date = new Date()) {
  return getTimeGreeting(now);
}

export default function DashboardPage() {
  const { user, profile, loading, login, refreshProfile, updateProfile, backendReady } = useAuth();
  const { playAvatarSound } = useAvatarSound();
  const now = useQuoteClock();
  const experience = getProfileExperience(profile, now);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user || !backendReady) return;
    const fetchTasks = async () => {
      try {
        const res = await client.entities.tasks.query({
          query: { status: 'pending' },
          sort: 'order_index',
          limit: 50,
        });
        setTasks((res?.data?.items || []) as Task[]);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [user, backendReady]);

  const completeTask = async (task: Task) => {
    if (!profile) return;
    try {
      await client.entities.tasks.update({
        id: String(task.id),
        data: { status: 'completed', completed_at: new Date().toISOString() },
      });

      const newXp = (profile.xp || 0) + (task.xp_reward ?? 10);
      const newTotalXp = (profile.total_xp || 0) + (task.xp_reward ?? 10);
      const newEnergy = Math.max(0, (profile.energy || 100) - (task.energy_cost ?? 10));
      const newTasksCompleted = (profile.tasks_completed || 0) + 1;
      const xpNeeded = xpForLevel(profile.level || 1);
      let newLevel = profile.level || 1;
      let remainingXp = newXp;

      if (remainingXp >= xpNeeded) {
        newLevel += 1;
        remainingXp -= xpNeeded;
      }

      const newTreeStage = Math.min(4, Math.max(1, Math.ceil(newLevel / 3)));

      await updateProfile({
        xp: remainingXp,
        total_xp: newTotalXp,
        energy: newEnergy,
        level: newLevel,
        tasks_completed: newTasksCompleted,
        tree_stage: newTreeStage,
      });

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] p-4 pb-safe flex items-center justify-center">
        <div className="max-w-lg w-full space-y-4">
          <Skeleton className="h-8 w-48 bg-white/20" />
          <Skeleton className="h-32 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-8 glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          <div className="w-40 h-40 mx-auto rounded-full overflow-hidden bg-white/20 shadow-2xl p-2 border border-white/30 relative z-10 transition-transform duration-500 group-hover:scale-105">
            <img src={TREE_IMAGES[0]} alt="FocusForge" className="w-full h-full object-cover rounded-full" loading="lazy" decoding="async" />
          </div>
          <div className="space-y-4 relative z-10">
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground drop-shadow-sm">FocusForge</h1>
            <p className="text-lg text-muted-foreground/80 font-medium leading-relaxed">
              Elevate your productivity through gamified focus. Grow your virtual tree, one task at a time. 🌱
            </p>
          </div>
          <Button onClick={login} className="w-full gap-3 bg-primary/90 hover:bg-primary backdrop-blur-md shadow-xl transition-all hover:scale-105 rounded-2xl py-6 text-lg relative z-10" size="lg">
            <LogIn className="w-6 h-6" />
            Sign in to start your journey
          </Button>
        </div>
      </div>
    );
  }

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const xpNeeded = xpForLevel(level);
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);
  const energy = profile?.energy || 100;
  const maxEnergy = profile?.max_energy || 100;
  const energyPercent = (energy / maxEnergy) * 100;
  const streak = profile?.streak || 0;
  const treeStage = Math.min(4, Math.max(1, profile?.tree_stage || 1));

  const todayTasks = tasks.slice(0, 5);
  const pendingCount = tasks.length;

  return (
    <div className="min-h-[100dvh] pb-safe">
      {showConfetti && <ConfettiEffect />}

      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-2 drop-shadow-sm">
              Good {getGreeting(now)} <span className="text-base">👋</span>
            </p>
            <h1 className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm">{profile?.display_name || 'Adventurer'}</h1>
            <p className="text-sm text-foreground/70 font-semibold leading-relaxed max-w-[20rem] text-shadow-sm">{experience.dashboardGreeting}</p>
          </div>
          <button
            onClick={() => {
              playAvatarSound(profile?.avatar || '🌱');
              navigate('/profile');
            }}
            className="w-12 h-12 rounded-full glass shadow-lg flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border-white/20"
          >
            {profile?.avatar || '🌱'}
          </button>

        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-5 pb-4">
        {/* XP & Level Card */}
        <Card className="glass p-5 rounded-[2rem] border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-bold tracking-tight">Level {level}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-foreground/70 drop-shadow-sm">{xp} / {xpNeeded} XP</span>
          </div>
          <div className="relative h-5 bg-white/10 rounded-full border border-white/5 mt-1">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]"
              style={{ transform: `translate3d(0, 0, 0)`, width: `${xpPercent}%` }}
            />
            {/* Avatar Caret */}
            <div
              className="absolute top-1/2 transition-all duration-1000 ease-out text-base active:scale-125 hover:scale-110 cursor-pointer drop-shadow-md z-10"
              style={{ left: `${xpPercent}%`, transform: `translate3d(-50%, -50%, 0)` }}
              onClick={() => playAvatarSound(profile?.avatar || '🌱')}
            >
              {profile?.avatar || '🌱'}
            </div>

          </div>

        </Card>

        <Card className="glass p-5 rounded-[2rem] border-white/20">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                {experience.personality.label} • {experience.mood.label}
              </p>
              <p className="text-sm font-black text-foreground drop-shadow-sm leading-relaxed">{experience.homePulse}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="rounded-xl border-white/20 hover:bg-white/10 transition-all font-bold text-[10px] uppercase tracking-wider">
              Tune vibe
            </Button>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass p-4 text-center rounded-[2rem] border-white/20 transition-transform hover:scale-[1.02]">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-black">{streak}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Streak</p>
          </Card>
          <Card className="glass p-4 text-center rounded-[2rem] border-white/20 transition-transform hover:scale-[1.02]">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-black">{energy}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Energy</p>
          </Card>
          <Card className="glass p-4 text-center rounded-[2rem] border-white/20 transition-transform hover:scale-[1.02]">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black">{pendingCount}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Tasks</p>
          </Card>
        </div>

        {/* Energy Bar */}
        <Card className="glass p-5 rounded-[2rem] border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold flex items-center gap-1.5 tracking-tight">
              <Zap className="w-4 h-4 text-yellow-500" /> Energy Reserves
            </span>
            <span className="text-xs font-black text-foreground/80 tracking-widest uppercase">{energy}/{maxEnergy}</span>
          </div>
          <div className="relative h-5 bg-white/10 rounded-full border border-white/5 mt-1">
            <div
              className="absolute inset-y-0 left-0 bg-yellow-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(234,179,8,0.3)]"
              style={{ transform: `translate3d(0, 0, 0)`, width: `${energyPercent}%` }}
            />
            {/* Avatar Caret */}
            <div
              className="absolute top-1/2 transition-all duration-1000 ease-out text-base active:scale-125 hover:scale-110 cursor-pointer drop-shadow-md z-10"
              style={{ left: `${energyPercent}%`, transform: `translate3d(-50%, -50%, 0)` }}
              onClick={() => playAvatarSound(profile?.avatar || '🌱')}
            >
              {profile?.avatar || '🌱'}
            </div>

          </div>

        </Card>

        {/* Virtual Tree */}
        <Card className="glass p-5 rounded-[2rem] border-white/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles className="w-24 h-24 rotate-12" />
          </div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white/10 p-1 flex-shrink-0 shadow-xl border border-white/20">
              <img
                src={TREE_IMAGES[treeStage - 1]}
                alt={`Tree stage ${treeStage}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-[1.2rem] transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <h3 className="font-black text-lg tracking-tight">Your Focus Tree</h3>
              <p className="text-xs text-foreground/80 font-black leading-relaxed text-shadow-sm">
                {treeStage === 1 && 'A tiny sprout. Keep going! 🌱'}
                {treeStage === 2 && 'Growing nicely! Stay focused. 🌿'}
                {treeStage === 3 && 'A strong tree! Almost there. 🌳'}
                {treeStage === 4 && 'Magnificent! You are unstoppable! ✨'}
              </p>
              <div className="flex gap-1.5 mt-3">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-2.5 rounded-full transition-all duration-500 ${s <= treeStage ? 'w-6 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'w-2.5 bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Tasks */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg font-black tracking-tight text-foreground">Today's Missions</h2>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground/80 hover:text-foreground font-bold text-xs uppercase tracking-wider" onClick={() => navigate('/tasks')}>
            Explore <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {tasksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-[1.5rem] bg-white/10" />)}
          </div>
        ) : todayTasks.length === 0 ? (
          <Card className="glass p-10 rounded-[2.5rem] text-center border-dashed border-white/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-foreground/60 font-black uppercase tracking-widest">No active missions. Start a new journey!</p>
            <Button variant="outline" size="sm" className="mt-5 gap-2 rounded-xl border-white/20 font-bold px-6" onClick={() => navigate('/tasks')}>
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <Card key={task.id} className="glass p-4 rounded-[1.5rem] border-white/10 flex items-center gap-4 group hover:border-white/30 transition-transform hover:translate-x-1">
                <button
                  onClick={() => completeTask(task)}
                  className="w-10 h-10 rounded-2xl border-2 border-white/20 flex-shrink-0 hover:bg-primary/20 hover:border-primary transition-all flex items-center justify-center group/btn active:scale-90"
                >
                  <span className="opacity-100 md:opacity-0 md:group-hover/btn:opacity-100 text-primary text-xl font-bold">✓</span>
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-lg font-black truncate tracking-tighter text-foreground drop-shadow-sm">{task.title}</p>
                  <div className="flex items-center gap-3">
                    {task.category && (
                      <Badge variant="secondary" className="glass text-[9px] px-2 py-0.5 rounded-lg border-white/10 uppercase font-black tracking-widest text-primary/80">
                        {task.category}
                      </Badge>
                    )}
                    <span className={`text-[10px] uppercase font-black tracking-widest ${priorityColor(task.priority)}`}>
                      {task.priority || 'low'}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground/60">+{task.xp_reward || 10} XP</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            variant="outline"
            className="glass h-auto py-5 flex flex-col items-center gap-2 rounded-[2rem] border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors group"
            onClick={() => navigate('/focus')}
          >
            <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Focus Mode</span>
          </Button>
          <Button
            variant="outline"
            className="glass h-auto py-5 flex flex-col items-center gap-2 rounded-[2rem] border-white/10 hover:border-white/30 hover:bg-white/5 transition-colors group"
            onClick={() => navigate('/stats')}
          >
            <div className="p-3 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">View Stats</span>
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
