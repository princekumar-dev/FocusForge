import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileExperience } from '@/lib/profileExperience';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import BottomNav from '@/components/BottomNav';
import { LogOut, User, Smile, Brain, Snowflake, Moon, Sun, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarSound } from '@/hooks/useAvatarSound';


const AVATARS = ['🌱', '🌿', '🌳', '✨', '🔥', '⚡', '🎯', '🏆', '🦊', '🐱', '🐼', '👻'];

const PERSONALITY_MODES = [
  { id: 'chill', label: 'Chill Buddy', emoji: '😎', desc: 'Relaxed and supportive' },
  { id: 'strict', label: 'Strict Coach', emoji: '💼', desc: 'Disciplined and direct' },
  { id: 'funny', label: 'Funny Savage', emoji: '😂', desc: 'Witty and motivating' },
];

const MOODS = [
  { id: 'lazy', label: 'Lazy', emoji: '😴', desc: 'Lighter tasks today' },
  { id: 'productive', label: 'Productive', emoji: '💪', desc: 'Ready to crush it' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '😰', desc: 'Take it easy' },
];

export default function ProfilePage() {
  const { user, profile, login, logout, updateProfile } = useAuth();
  const { playAvatarSound } = useAvatarSound();
  const [editName, setEditName] = useState(false);

  const [nameValue, setNameValue] = useState(profile?.display_name || '');
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const experience = useMemo(() => getProfileExperience(profile), [profile]);

  useEffect(() => {
    setNameValue(profile?.display_name || '');
  }, [profile?.display_name]);

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveName = async () => {
    if (!nameValue.trim()) return;
    await updateProfile({ display_name: nameValue.trim() });
    setEditName(false);
    toast.success('Identity updated!');
  };

  const selectAvatar = (avatar: string) => {
    playAvatarSound(avatar);
    updateProfile({ avatar });
    toast.success('Avatar updated!');
  };

  const selectPersonality = (mode: string) => {
    const selected = PERSONALITY_MODES.find(m => m.id === mode);
    if (selected) playAvatarSound(selected.emoji);
    updateProfile({ personality_mode: mode });
    toast.success('Personality mode synced!');
  };

  const selectMood = (mood: string) => {
    const selected = MOODS.find(m => m.id === mood);
    if (selected) playAvatarSound(selected.emoji);
    updateProfile({ mood });
    toast.success('Internal vibe set. Missions adjusted.');
  };


  const useStreakFreeze = async () => {
    if (!profile || (profile.streak_freezes || 0) <= 0) {
      toast.error('No streak freezes available!');
      return;
    }
    await updateProfile({ streak_freezes: (profile.streak_freezes || 0) - 1 });
    toast.success('Temporal freeze active! Streak protected. ❄️');
  };

  const avatarsGrid = useMemo(() => AVATARS.map((avatar) => (
    <button
      key={avatar}
      onClick={() => selectAvatar(avatar)}
      className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 shadow-lg ${
        profile?.avatar === avatar
          ? 'bg-primary text-primary-foreground shadow-primary/30 scale-110 ring-4 ring-primary/20 border-transparent z-10'
          : 'glass hover:bg-white/20 border-white/10 grayscale-50 opacity-70 hover:opacity-100 hover:grayscale-0 hover:scale-105'
      }`}
    >
      {avatar}
    </button>
  )), [profile?.avatar]);

  const personalityGrid = useMemo(() => PERSONALITY_MODES.map((mode) => (
    <button
      key={mode.id}
      onClick={() => selectPersonality(mode.id)}
      className={`w-full p-4.5 rounded-[1.5rem] text-left flex items-center gap-4 transition-[transform,colors,shadow] duration-300 ease-out border shadow-xl ${
        profile?.personality_mode === mode.id
          ? 'bg-primary text-primary-foreground border-transparent z-10 shadow-primary/20'
          : 'glass border-white/10 hover:border-white/30 hover:bg-white/10'
      }`}
      style={{ transform: profile?.personality_mode === mode.id ? 'translate3d(0,0,10px) scale(1.02)' : 'translate3d(0,0,0)' }}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
        profile?.personality_mode === mode.id ? 'bg-white/20 shadow-white/10' : 'bg-white/5 border border-white/5'
      }`}>
        {mode.emoji}
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-base font-black tracking-tighter drop-shadow-sm">{mode.label}</p>
        <p className={`text-[11px] font-semibold leading-relaxed ${
          profile?.personality_mode === mode.id ? 'text-primary-foreground/80' : 'text-foreground/50'
        }`}>{mode.desc}</p>
      </div>
      {profile?.personality_mode === mode.id && <ShieldCheck className="w-6 h-6 text-white/50" />}
    </button>
  )), [profile?.personality_mode]);

  const moodsGrid = useMemo(() => MOODS.map((mood) => (
    <button
      key={mood.id}
      onClick={() => selectMood(mood.id)}
      className={`px-2 py-6 rounded-[1.8rem] text-center transition-[transform,colors,shadow] duration-300 ease-out border shadow-xl ${
        profile?.mood === mood.id
          ? 'bg-primary text-primary-foreground border-transparent scale-110 shadow-primary/30 z-10'
          : 'glass border-white/10 opacity-70 hover:opacity-100 hover:scale-105'
      }`}
      style={{ transform: profile?.mood === mood.id ? 'translate3d(0,0,10px) scale(1.1)' : 'translate3d(0,0,0)' }}
    >
      <span className="text-4xl block mb-2 drop-shadow-lg">{mood.emoji}</span>
      <p className="text-[9px] font-black uppercase tracking-tight whitespace-nowrap px-1">{mood.label}</p>
    </button>
  )), [profile?.mood]);

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6 glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-md">FocusForge</h1>
            <p className="text-sm text-foreground/70 font-black uppercase tracking-widest leading-relaxed">Sign in to configure your identity</p>
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
        <h1 className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm mb-6">Identity</h1>

        <Card className="glass p-5 rounded-[2rem] border-white/20 mb-6 group transition-all hover:border-white/30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1.5">
            System Config • Bio-Metrics
          </p>
          <p className="text-sm font-black text-foreground drop-shadow-sm leading-relaxed">
            Current Vibe: {experience.mood.label}. This affects all tactical recommendations.
          </p>
          <p className="text-[11px] text-foreground/50 font-semibold mt-3 italic text-shadow-sm">
            Coaching style is set to {experience.personality.label}.
          </p>
        </Card>

        {/* Profile Header */}
        <Card className="glass p-6 rounded-[2.5rem] border-white/20 mb-6 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-[1.5rem] glass flex items-center justify-center text-4xl shadow-2xl border border-white/30 transition-transform hover:scale-105 active:scale-95">
              {profile?.avatar || '🌱'}
            </div>
            <div className="flex-1 space-y-1">
              {editName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="glass h-10 rounded-xl border-white/30 font-black text-foreground"
                    autoFocus
                  />
                  <Button size="sm" className="rounded-xl shadow-xl bg-primary" onClick={saveName}>Save</Button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <h2 className="text-3xl font-black tracking-tighter text-foreground drop-shadow-sm">{profile?.display_name || 'Adventurer'}</h2>
                  <button
                    onClick={() => { setNameValue(profile?.display_name || ''); setEditName(true); }}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 hover:text-primary transition-colors"
                  >
                    Modify ID Tag
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest py-1 px-3 glass rounded-lg border-white/10 text-primary drop-shadow-sm">Level {profile?.level || 1}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/30">{profile?.total_xp || 0} XP Total</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Avatar Selection */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-4 flex items-center gap-2 drop-shadow-sm">
            <User className="w-4 h-4 text-primary" /> Visual Uplink
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {avatarsGrid}
          </div>
        </Card>

        {/* Personality Mode */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-5 flex items-center gap-2 drop-shadow-sm">
            <Brain className="w-4.5 h-4.5 text-primary" /> Neural Pattern
          </h3>
          <div className="space-y-3.5">
            {personalityGrid}
          </div>
        </Card>

        {/* Mood Selector */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-5 flex items-center gap-2 drop-shadow-sm">
            <Smile className="w-4.5 h-4.5 text-primary" /> Core Vitality
          </h3>
          <div className="grid grid-cols-3 gap-3.5">
            {moodsGrid}
          </div>
        </Card>

        {/* Streak Freeze */}
        <Card className="glass p-5 rounded-[2rem] border-white/20 mb-6 group transition-all hover:border-white/40 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.2rem] bg-blue-500/20 flex items-center justify-center text-blue-500 shadow-inner border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Snowflake className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <p className="text-base font-black tracking-tighter text-foreground drop-shadow-sm">Cryo-Storage</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">{profile?.streak_freezes || 0} Freezes Remaining</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl glass border-blue-500/40 text-blue-500 hover:bg-blue-500/10 font-black tracking-widest px-6 shadow-md transition-all active:scale-90"
              onClick={useStreakFreeze}
              disabled={(profile?.streak_freezes || 0) <= 0}
            >
              DEPLOY
            </Button>
          </div>
        </Card>

        {/* Settings */}
        <Card className="glass p-6 rounded-[2rem] border-white/20 mb-6 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground mb-5 drop-shadow-sm">Environment Controls</h3>
          <div className="flex items-center justify-between glass p-5 rounded-[1.5rem] border-white/10 shadow-inner">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1rem] glass flex items-center justify-center text-foreground border border-white/10 shadow-lg">
                {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-orange-500" />}
              </div>
              <Label className="text-base font-black tracking-tighter text-foreground">Nocturnal Protocol</Label>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} className="data-[state=checked]:bg-primary shadow-lg" />
          </div>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-16 rounded-[1.8rem] glass border-red-500/40 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-[0.3em] mb-10 transition-all hover:scale-[0.98] active:scale-95 shadow-2xl"
          onClick={logout}
        >
          <LogOut className="w-5 h-5 mr-4" />
          Terminate Session
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
