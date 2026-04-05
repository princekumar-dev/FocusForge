import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { getProfileExperience } from '@/lib/profileExperience';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import {
  Trophy, Flame, Target, Clock, TrendingUp, CheckCircle2, Calendar,
} from 'lucide-react';

const TREE_IMAGES = [
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/8be1b573-5ac2-42c0-aef4-e74b1927458b.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/2d779ed0-91f6-4136-9092-e2e6eb8d0b24.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/63a602a0-fd88-4fc1-a7fe-3767da930a20.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/431794/2026-04-04/49d8b50c-25e9-41ee-a8b9-a8f94fd15e10.png',
];

export default function StatsPage() {
  const { user, profile, login } = useAuth();
  const experience = getProfileExperience(profile);
  const [completedCount, setCompletedCount] = useState(0);
  const [recentCompleted, setRecentCompleted] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const res = await client.entities.tasks.query({
          query: { status: 'completed' },
          sort: '-completed_at',
          limit: 100,
        });
        const items = res?.data?.items || [];
        setCompletedCount(items.length);
        setRecentCompleted(items); // Keep more for the timeline check
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [user]);

  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const totalXp = profile?.total_xp || 0;
  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, (xp / xpNeeded) * 100);
  const streak = profile?.streak || 0;
  const bestStreak = profile?.best_streak || 0;
  const tasksCompleted = profile?.tasks_completed || 0;
  const focusMinutes = profile?.focus_minutes || 0;
  const treeStage = Math.min(4, Math.max(1, profile?.tree_stage || 1));

  // Generate last 7 days for streak calendar
  const last7Days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);

      const isToday = d.getTime() === today.getTime();
      const hasCompleted = recentCompleted.some(task => {
        if (!task.completed_at) return false;
        const taskDate = new Date(task.completed_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === d.getTime();
      });

      return {
        day: d.toLocaleDateString('en', { weekday: 'short' }),
        date: d.getDate(),
        active: hasCompleted,
        isToday,
      };
    });
  }, [recentCompleted]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6 glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-md">FocusForge</h1>
            <p className="text-sm text-foreground/70 font-black uppercase tracking-widest leading-relaxed">Sign in to view your achievements</p>
          </div>
          <Button onClick={login} className="w-full gap-3 bg-primary/90 hover:bg-primary backdrop-blur-md shadow-xl transition-all hover:scale-105 rounded-2xl py-6 text-lg" size="lg">
            Sign In
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-safe">
      <div className="px-4 pt-8 max-w-lg mx-auto">
        <h1 className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm mb-6">Hall of Fame</h1>

        <Card className="glass p-5 rounded-[2rem] border-white/20 mb-6 group transition-all hover:border-white/30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1.5">
            {experience.personality.label} • {experience.mood.label}
          </p>
          <p className="text-sm font-black text-foreground drop-shadow-sm leading-relaxed">{experience.dashboardGreeting}</p>
        </Card>

        {/* Level & XP */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Trophy className="w-24 h-24 rotate-12" />
          </div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center shadow-inner border border-primary/30">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 space-y-1.5">
              <h2 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">Level {level}</h2>
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-1 drop-shadow-sm">
                <span>{xp} XP</span>
                <span>{xpNeeded} XP NEXT</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-out"
                  style={{ transform: `translate3d(0, 0, 0)`, width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-foreground/40 mt-1 uppercase tracking-widest text-shadow-sm">Total Earned: {totalXp} XP</p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="glass p-5 rounded-[2rem] border-white/10 transition-all hover:scale-[1.02] hover:border-white/30 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-500 group-hover:bg-orange-500/30 transition-colors border border-orange-500/20">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Streak</span>
            </div>
            <p className="text-4xl font-black text-foreground drop-shadow-md text-shadow-md">{streak}</p>
            <p className="text-[10px] font-black text-foreground/30 mt-1 uppercase tracking-widest">Best: {bestStreak}</p>
          </Card>
          
          <Card className="glass p-5 rounded-[2rem] border-white/10 transition-all hover:scale-[1.02] hover:border-white/30 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-green-500/20 text-green-500 group-hover:bg-green-500/30 transition-colors border border-green-500/20">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Missions</span>
            </div>
            <p className="text-4xl font-black text-foreground drop-shadow-md text-shadow-md">{tasksCompleted}</p>
            <p className="text-[10px] font-black text-foreground/30 mt-1 uppercase tracking-widest">Completed</p>
          </Card>
          
          <Card className="glass p-5 rounded-[2rem] border-white/10 transition-all hover:scale-[1.02] hover:border-white/30 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500 group-hover:bg-blue-500/30 transition-colors border border-blue-500/20">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Focus</span>
            </div>
            <p className="text-4xl font-black text-foreground drop-shadow-md text-shadow-md">{focusMinutes}</p>
            <p className="text-[10px] font-black text-foreground/30 mt-1 uppercase tracking-widest">Minutes</p>
          </Card>
          
          <Card className="glass p-5 rounded-[2rem] border-white/10 transition-all hover:scale-[1.02] hover:border-white/30 group">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-500 group-hover:bg-yellow-500/30 transition-colors border border-yellow-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Efficiency</span>
            </div>
            <p className="text-4xl font-black text-foreground drop-shadow-md text-shadow-md">{streak > 0 ? Math.round(totalXp / streak) : xp}</p>
            <p className="text-[10px] font-black text-foreground/30 mt-1 uppercase tracking-widest">Avg XP / Day</p>
          </Card>
        </div>

        {/* Streak Calendar */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/20">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground drop-shadow-sm">Mission Timeline</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {last7Days.map((day, i) => (
              <div key={i} className="text-center space-y-2">
                <p className={`text-[9px] font-black uppercase tracking-widest ${day.isToday ? 'text-primary drop-shadow-sm' : 'text-foreground/40'}`}>
                  {day.day}
                </p>
                <div
                  className={`w-9 h-9 rounded-2xl mx-auto flex items-center justify-center text-[11px] font-black transition-all relative ${
                    day.active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                      : 'glass text-foreground/40 border-white/5 bg-white/5'
                  } ${day.isToday && !day.active ? 'border-primary/50 border-2' : ''}`}
                >
                  {day.date}
                  {day.isToday && (
                    <div className="absolute -top-1.5 -right-1.5 animate-pulse">
                      {day.active ? (
                        <Flame className="w-4 h-4 text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                      ) : (
                        <div className="w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tree Progress */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6 relative overflow-hidden group">
           <div className="absolute -bottom-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Target className="w-48 h-48" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-5 flex items-center gap-2 relative z-10 drop-shadow-sm">
            <Target className="w-4 h-4 text-primary" /> Biological Growth
          </h3>
          <div className="grid grid-cols-4 gap-4 relative z-10">
            {TREE_IMAGES.map((img, i) => (
              <div key={i} className="text-center space-y-2.5">
                <div
                  className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-700 ${
                    i + 1 <= treeStage 
                      ? 'border-primary/50 shadow-2xl shadow-primary/20 opacity-100 scale-100' 
                      : 'border-white/5 opacity-20 grayscale scale-90 hover:scale-95 hover:opacity-40 hover:grayscale-0'
                  }`}
                >
                  <img src={img} alt={`Stage ${i + 1}`} className="w-full h-full object-cover" />
                </div>
                <p className={`text-[9px] font-black uppercase tracking-widest transition-colors ${i + 1 <= treeStage ? 'text-primary' : 'text-foreground/30'}`}>Lv {(i + 1) * 3}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Completed */}
        {recentCompleted.length > 0 && (
          <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6 font-premium">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-4 drop-shadow-sm">Tactical Log</h3>
            <div className="space-y-3">
              {recentCompleted.slice(0, 7).map((task: any) => (
                <div key={task.id} className="flex items-center gap-4 text-sm glass p-3.5 rounded-2xl border-white/10 group hover:border-white/30 transition-all shadow-md">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate flex-1 font-black tracking-tighter text-foreground drop-shadow-sm">{task.title}</span>
                  <Badge variant="secondary" className="glass text-[9px] font-black uppercase tracking-widest border-white/20 text-primary drop-shadow-sm">
                    +{task.xp_reward || 10} XP
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
