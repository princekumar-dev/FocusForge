import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { useAmbientSound, type AmbientPreset } from '@/hooks/useAmbientSound';
import { useAvatarSound } from '@/hooks/useAvatarSound';

import { getAmbientPresetLabel, getProfileExperience } from '@/lib/profileExperience';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import ConfettiEffect from '@/components/ConfettiEffect';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Target, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: number;
  title: string;
  priority: string;
  xp_reward: number;
  energy_cost: number;
  status: string;
}

const TIMER_PRESETS = [
  { label: '25 min', value: 25 },
  { label: '15 min', value: 15 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
];

export default function FocusPage() {
  const { user, profile, login, updateProfile, backendReady } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setLeft] = useState(duration * 60);
  const [isRunning, setRunning] = useState(false);
  const [isBreak, setBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [ambientSound, setAmbientSound] = useState(false);
  const { playAvatarSound } = useAvatarSound();
  const [ambientPreset, setAmbientPreset] = useState<AmbientPreset>('focus');
  const [showConfetti, setShowConfetti] = useState(false);

  const experience = getProfileExperience(profile);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { play, stop } = useAmbientSound();

  useEffect(() => {
    if (ambientSound && isRunning && !isBreak) {
      play(ambientPreset);
    } else {
      stop();
    }
    return () => stop();
  }, [ambientSound, isRunning, isBreak, ambientPreset, play, stop]);

  useEffect(() => {
    if (!user || !backendReady) return;
    client.entities.tasks.query({ query: { status: 'pending' }, limit: 50 })
      .then(res => setTasks(res?.data?.items as Task[] || []));
  }, [user, backendReady]);

  const startTimer = () => {
    playAvatarSound(profile?.avatar || '🌱');
    setRunning(true);
  };
  const pauseTimer = () => {
    playAvatarSound('tap');
    setRunning(false);
  };
  const resetTimer = useCallback(() => {
    playAvatarSound('tap');
    setRunning(false);
    setLeft((isBreak ? 5 : duration) * 60);
  }, [duration, isBreak, playAvatarSound]);


  const completeSession = useCallback(async () => {
    setRunning(false);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    if (!isBreak) {
      setSessionsCompleted(prev => prev + 1);
      const xpGained = 25;
      const minsGained = duration;

      if (profile) {
        await updateProfile({
          xp: (profile.xp || 0) + xpGained,
          total_xp: (profile.total_xp || 0) + xpGained,
          focus_minutes: (profile.focus_minutes || 0) + minsGained,
        });
      }
      toast.success(`Focus session complete! +${xpGained} XP`);
      setBreak(true);
      setLeft(5 * 60);
    } else {
      toast.info("Break over. Ready to work?");
      setBreak(false);
      setLeft(duration * 60);
    }
  }, [isBreak, duration, profile, updateProfile]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setLeft(t => t - 1);
        console.log('Timer heartbeat:', timeLeft);
      }, 1000);
    } else if (timeLeft === 0) {
      completeSession();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft, completeSession]);

  const changeDuration = (val: string) => {
    playAvatarSound(profile?.avatar || '🌱');
    const d = parseInt(val);
    setDuration(d);
    if (!isRunning) setLeft(d * 60);
  };


  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / ((isBreak ? 5 : duration) * 60)) * 100;
  const radius = 122;
  const circumference = 2 * Math.PI * radius;
  // Reverse logic: fills up as time reduces
  const strokeDashoffset = (progress / 100) * circumference;

  const currentTask = tasks.find(t => String(t.id) === selectedTask);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6 glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-md">FocusForge</h1>
            <p className="text-sm text-foreground/70 font-black uppercase tracking-widest leading-relaxed">Sign in to start your focus session</p>
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
      {showConfetti && <ConfettiEffect />}

      <div className="px-4 pt-8 max-w-lg mx-auto">
        <h1 className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm mb-6">Focus Zone</h1>

        <Card className="glass p-5 rounded-[2rem] border-white/20 mb-6 group transition-all hover:border-white/30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1.5">
            {experience.personality.label} • {experience.mood.label}
          </p>
          <p className="text-sm font-black text-foreground drop-shadow-sm leading-relaxed">{experience.focusCoaching}</p>
          <p className="text-[11px] text-foreground/50 font-semibold mt-3 italic text-shadow-sm">
            Recommended: {experience.mood.recommendedDuration}m focus with {getAmbientPresetLabel(ambientPreset).toLowerCase()} tones.
          </p>
        </Card>

        <div className="flex flex-col items-center py-8 relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <Target className="w-64 h-64 text-primary" />
          </div>

          <div className="relative w-72 h-72 group transition-transform duration-500 hover:scale-[1.02]">
            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_40px_rgba(0,0,0,0.15)]" viewBox="0 0 260 260">
              {/* Refined Track - Light Grey Base */}
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="#EEEEEE"
                strokeWidth="20"
                className="opacity-100"
              />

              {/* Smooth Black Progress Bar - Fills as time elapses */}
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="#000000"
                strokeWidth="20"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />

              {/* Finishing Inner Border */}
              <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full m-4 border border-black/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mb-2 drop-shadow-sm">{isBreak ? 'Cooling Down' : 'Deep Work'}</span>
              <span className="text-7xl font-black text-black drop-shadow-md tracking-tighter text-shadow-md">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1.5 mt-4 px-3.5 py-1.5 bg-black/5 rounded-full border border-black/10">
                <Trophy className="w-3.5 h-3.5 text-black/60" />
                <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">Session {sessionsCompleted + 1}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-10">
            <Button variant="ghost" size="icon" className="w-14 h-14 rounded-2xl glass hover:bg-white/10 text-muted-foreground/70 hover:text-foreground transition-all" onClick={resetTimer}>
              <RotateCcw className="w-6 h-6" />
            </Button>
            <Button size="icon" className="w-20 h-20 rounded-[2rem] bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" onClick={isRunning ? pauseTimer : startTimer}>
              {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`w-14 h-14 rounded-2xl glass transition-all ${ambientSound ? 'text-primary bg-primary/10 border-primary/30' : 'text-muted-foreground/70 hover:text-foreground'}`}
              onClick={() => setAmbientSound(!ambientSound)}
            >
              {ambientSound ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <Card className="glass p-5 rounded-[2rem] border-white/20 transition-all hover:border-white/30">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-3 block ml-1 drop-shadow-sm">Timer Protocol</label>
            <div className="grid grid-cols-4 gap-2.5">
              {TIMER_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="ghost"
                  size="sm"
                  className={`h-11 rounded-xl font-bold transition-all border border-transparent ${duration === preset.value
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'hover:bg-white/5 text-muted-foreground font-semibold'
                    }`}
                  onClick={() => changeDuration(String(preset.value))}
                  disabled={isRunning}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="glass p-5 rounded-[2rem] border-white/20 transition-all hover:border-white/30">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 mb-3 block ml-1 flex items-center gap-1.5 drop-shadow-sm">
              <Target className="w-3.5 h-3.5" /> Target Mission
            </label>
            <Select value={selectedTask} onValueChange={setSelectedTask}>
              <SelectTrigger className="glass rounded-xl h-12 border-white/20 font-bold text-sm">
                <SelectValue placeholder="Select objective..." />
              </SelectTrigger>
              <SelectContent className="glass border-white/20 rounded-xl">
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={String(task.id)} className="font-medium">
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTask && (
              <div className="flex items-center gap-3 mt-3 px-1">
                <Badge variant="secondary" className="glass text-[9px] uppercase font-black tracking-widest border-white/10">+{currentTask.xp_reward || 10} XP</Badge>
                <Badge variant="outline" className="glass text-[9px] uppercase font-black tracking-widest border-white/10">{currentTask.priority} priority</Badge>
              </div>
            )}
          </Card>

          <Card className="glass p-5 rounded-[2rem] border-white/20 transition-all hover:border-white/30">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60 ml-1 flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5" /> Audio Scape
              </label>
              <Switch checked={ambientSound} onCheckedChange={setAmbientSound} className="data-[state=checked]:bg-primary" />
            </div>

            <Select value={ambientPreset} onValueChange={(value) => setAmbientPreset(value as AmbientPreset)}>
              <SelectTrigger className="glass rounded-xl h-12 border-white/20 font-bold text-sm">
                <SelectValue placeholder="Ambient texture" />
              </SelectTrigger>
              <SelectContent className="glass border-white/20 rounded-xl">
                <SelectItem value="rain" className="font-medium">Rain Wash</SelectItem>
                <SelectItem value="forest" className="font-medium">Forest Air</SelectItem>
                <SelectItem value="focus" className="font-medium">Deep Focus</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-[11px] text-foreground/50 font-semibold mt-3 ml-1 text-shadow-sm">
              {ambientSound
                ? `${getAmbientPresetLabel(ambientPreset)} is active while work is in progress.`
                : `Toggle on for dynamic ${getAmbientPresetLabel(ambientPreset).toLowerCase()} generated audio.`}
            </p>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card className="glass p-5 rounded-[2rem] border-white/20 text-center">
              <p className="text-3xl font-black text-foreground drop-shadow-sm">{sessionsCompleted}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">Sessions</p>
            </Card>
            <Card className="glass p-5 rounded-[2rem] border-white/20 text-center">
              <p className="text-3xl font-black text-foreground drop-shadow-sm">{profile?.focus_minutes || 0}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mt-1">Total Mins</p>
            </Card>
          </div>

          <div className="h-2" aria-hidden="true" />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
