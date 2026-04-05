import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/lib/api';
import { getProfileExperience, useQuoteClock } from '@/lib/profileExperience';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';
import ConfettiEffect from '@/components/ConfettiEffect';
import { Plus, Trash2, Check, GripVertical, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarSound } from '@/hooks/useAvatarSound';


const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning', 'Creative', 'Other'];
const PRIORITIES = ['low', 'medium', 'high'];

interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  category: string;
  status: string;
  xp_reward: number;
  energy_cost: number;
  order_index: number;
  due_date: string;
  completed_at: string;
  created_at: string;
}

export default function TasksPage() {
  const { user, profile, login, updateProfile, backendReady } = useAuth();
  const { playAvatarSound } = useAvatarSound();
  const now = useQuoteClock();
  const experience = getProfileExperience(profile, now);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [swipeId, setSwipeId] = useState<number | null>(null);
  const [swipeX, setSwipeX] = useState(0);
  const touchStartX = useRef(0);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formCategory, setFormCategory] = useState('Work');
  const [formXp, setFormXp] = useState<number | string>(10);
  const [formEnergy, setFormEnergy] = useState<number | string>(10);
  const [formDueDate, setFormDueDate] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await client.entities.tasks.query({
        query: { status: 'pending' },
        sort: 'order_index',
        limit: 100,
      });
      setTasks((res?.data?.items || []) as Task[]);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && backendReady) {
      void fetchTasks();
    } else {
      setLoading(false);
    }
  }, [user, backendReady]);

  useEffect(() => {
    if (!profile || showAdd || editTask) return;
    setFormXp(experience.mood.defaultXpReward);
    setFormEnergy(experience.mood.defaultEnergyCost);
  }, [editTask, experience.mood.defaultEnergyCost, experience.mood.defaultXpReward, profile, showAdd]);

  const resetForm = () => {
    setFormTitle('');
    setFormDesc('');
    setFormPriority('medium');
    setFormCategory('Work');
    setFormXp(experience.mood.defaultXpReward);
    setFormEnergy(experience.mood.defaultEnergyCost);
    setFormDueDate('');
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority || 'medium');
    setFormCategory(task.category || 'Work');
    setFormXp(task.xp_reward || 10);
    setFormEnergy(task.energy_cost || 10);
    // Format ISO to datetime-local (YYYY-MM-DDTHH:mm)
    const d = task.due_date ? new Date(task.due_date) : null;
    setFormDueDate(d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('Task title is required');
      return;
    }

    const data = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      priority: formPriority,
      category: formCategory,
      status: 'pending',
      xp_reward: Number(formXp),
      energy_cost: Number(formEnergy),
      due_date: formDueDate ? new Date(formDueDate).toISOString() : null,
      order_index: tasks.length,
      created_at: new Date().toISOString(),
    };

    try {
      if (editTask) {
        await client.entities.tasks.update({ id: String(editTask.id), data });
        toast.success('Task updated');
      } else {
        await client.entities.tasks.create({ data });
        toast.success(`${experience.personality.label} approved the plan.`);
      }
      setShowAdd(false);
      setEditTask(null);
      resetForm();
      await fetchTasks();
    } catch (err) {
      toast.error('Failed to save task');
      console.error(err);
    }
  };

  const completeTask = async (task: Task) => {
    if (!profile) return;
    playAvatarSound(profile.avatar || '🌱');
    try {

      await client.entities.tasks.update({
        id: String(task.id),
        data: { status: 'completed', completed_at: new Date().toISOString() },
      });

      const newXp = (profile.xp || 0) + (task.xp_reward ?? 10);
      const newTotalXp = (profile.total_xp || 0) + (task.xp_reward ?? 10);
      const newEnergy = Math.max(0, (profile.energy || 100) - (task.energy_cost ?? 10));
      const newTasksCompleted = (profile.tasks_completed || 0) + 1;
      const xpNeeded = (profile.level || 1) * 100;
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
      toast.success(`${experience.personality.completionPrefix} work. +${task.xp_reward ?? 10} XP`);
    } catch (err) {
      toast.error('Failed to complete task');
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await client.entities.tasks.delete({ id: String(taskId) });
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleTouchStart = (id: number, e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setSwipeId(id);
    setSwipeX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (swipeId === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    setSwipeX(diff);
  };

  const handleTouchEnd = (task: Task) => {
    if (swipeX > 80) {
      void completeTask(task);
    } else if (swipeX < -80) {
      void deleteTask(task.id);
    }
    setSwipeId(null);
    setSwipeX(0);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return <Badge className="bg-red-500/90 hover:bg-red-500 text-white text-[10px] uppercase font-black tracking-widest border border-red-400/30 shadow-lg shadow-red-500/20">High</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="glass text-[10px] uppercase font-black tracking-widest border-white/10">Med</Badge>;
      default:
        return <Badge variant="outline" className="glass text-[10px] uppercase font-black tracking-widest border-white/10">Low</Badge>;
    }
  };

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <div className="max-w-sm space-y-6 glass p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          <div className="space-y-3 relative z-10">
            <h1 className="text-5xl font-black tracking-tighter text-foreground drop-shadow-md">FocusForge</h1>
            <p className="text-sm text-foreground/70 font-black uppercase tracking-widest leading-relaxed">Sign in to manage your missions</p>
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

      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-1 relative z-10">
            <h1 className="text-5xl font-black text-foreground tracking-tighter drop-shadow-sm">Missions</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{tasks.length} active objectives</p>
          </div>
          <Button size="sm" className="gap-2 bg-primary/90 hover:bg-primary shadow-lg rounded-xl px-4" onClick={() => { resetForm(); setEditTask(null); setShowAdd(true); }}>
            <Plus className="w-4 h-4" /> <span className="font-bold">Add Task</span>
          </Button>
        </div>

        <Card className="glass p-5 rounded-[2rem] border-white/20 mt-6 group transition-all hover:border-white/30">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1.5">
            {experience.personality.label} • {experience.mood.label}
          </p>
          <p className="text-sm font-black text-foreground drop-shadow-sm leading-relaxed">{experience.taskCoaching}</p>
          <p className="text-[11px] text-foreground/50 font-semibold mt-3 italic text-shadow-sm">
            New tasks default to {experience.mood.defaultXpReward} XP based on your current vibe.
          </p>
        </Card>

        <div className="flex items-center gap-3 mt-6 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex-shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="glass h-9 text-xs w-auto min-w-[100px] rounded-xl border-white/10 font-bold uppercase tracking-wider">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="glass border-white/20 rounded-xl">
              <SelectItem value="all" className="text-xs font-bold uppercase">All Priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} className="text-xs font-bold uppercase">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="glass h-9 text-xs w-auto min-w-[110px] rounded-xl border-white/10 font-bold uppercase tracking-wider">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="glass border-white/20 rounded-xl">
              <SelectItem value="all" className="text-xs font-bold uppercase">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs font-bold uppercase">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-3 pb-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[1.5rem] bg-white/10" />)
        ) : filteredTasks.length === 0 ? (
          <Card className="glass p-12 rounded-[2.5rem] text-center border-dashed border-white/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-[1.5rem] bg-white/5 flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              {tasks.length === 0 ? 'No missions found. Time to chart your course!' : 'No missions match your current focus.'}
            </p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="relative overflow-hidden rounded-[1.5rem] transition-all hover:scale-[1.01]"
              onTouchStart={(e) => handleTouchStart(task.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(task)}
            >
              <div className="absolute inset-0 flex items-center justify-between px-6 bg-primary/5">
                <div 
                  className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest transition-opacity"
                  style={{ opacity: swipeId === task.id && swipeX > 0 ? Math.min(1, swipeX / 50) : 0 }}
                >
                  <Check className="w-5 h-5" />
                  <span>Complete</span>
                </div>
                <div 
                  className="flex items-center gap-2 text-destructive font-black uppercase text-[10px] tracking-widest transition-opacity"
                  style={{ opacity: swipeId === task.id && swipeX < 0 ? Math.min(1, Math.abs(swipeX) / 50) : 0 }}
                >
                  <span>Delete</span>
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>

              <Card
                className="glass p-5 rounded-[1.5rem] border-white/10 flex items-center gap-4 relative transition-all cursor-pointer group hover:border-white/30"
                style={{ transform: swipeId === task.id ? `translateX(${swipeX}px)` : 'translateX(0)' }}
                onClick={() => openEdit(task)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); void completeTask(task); }}
                  className="w-10 h-10 rounded-2xl border-2 border-white/20 flex-shrink-0 hover:bg-primary/20 hover:border-primary transition-all flex items-center justify-center group/btn active:scale-95"
                >
                  <Check className="w-5 h-5 opacity-100 md:opacity-0 md:group-hover/btn:opacity-100 text-primary transition-opacity" />
                </button>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-base font-bold truncate tracking-tight text-foreground drop-shadow-sm">{task.title}</p>
                  <div className="flex items-center gap-3">
                    {task.category && (
                      <Badge variant="secondary" className="glass text-[9px] px-2 py-0.5 rounded-lg border-white/10 uppercase font-black tracking-widest text-primary/80">
                        {task.category}
                      </Badge>
                    )}
                    {priorityBadge(task.priority)}
                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">+{task.xp_reward || 10} XP</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); void deleteTask(task.id); }}
                    className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-5 h-5 text-muted-foreground/30 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                </div>
              </Card>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) { setEditTask(null); resetForm(); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md glass border-white/20 rounded-[2.5rem] shadow-3xl p-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 pointer-events-none" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground drop-shadow-sm">
              {editTask ? 'Edit Mission' : 'New Mission'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 relative z-10 py-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Title</label>
              <Input
                placeholder="What's the objective?"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="glass rounded-2xl border-white/20 focus:border-primary/50 transition-all text-base py-6 px-4 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Description</label>
              <Textarea
                placeholder="Tactical details (optional)..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                className="glass rounded-2xl border-white/20 focus:border-primary/50 transition-all text-sm px-4 font-medium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Priority</label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger className="glass rounded-2xl border-white/20 h-12 font-bold uppercase text-[11px] tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/20 rounded-2xl">
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="font-bold uppercase text-[11px] tracking-wider">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger className="glass rounded-2xl border-white/20 h-12 font-bold uppercase text-[11px] tracking-wider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/20 rounded-2xl">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-bold uppercase text-[11px] tracking-wider">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Mission Start Time</label>
              <Input
                type="datetime-local"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="glass rounded-2xl border-white/20 h-12 px-4 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">XP Reward</label>
                <Input
                  type="number"
                  value={formXp}
                  onChange={(e) => setFormXp(e.target.value)}
                  min={1}
                  max={100}
                  className="glass rounded-2xl border-white/20 h-12 text-center font-black"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/90 ml-1">Energy Cost</label>
                <Input
                  type="number"
                  value={formEnergy}
                  onChange={(e) => setFormEnergy(e.target.value)}
                  min={1}
                  max={50}
                  className="glass rounded-2xl border-white/20 h-12 text-center font-black"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-row gap-3 pt-4 border-t border-white/10 relative z-10">
            <Button variant="ghost" className="flex-1 rounded-2xl font-bold uppercase text-xs tracking-widest text-foreground/70 hover:bg-white/5" onClick={() => { setShowAdd(false); setEditTask(null); resetForm(); }}>
              Cancel
            </Button>
            <Button className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-xs tracking-[0.15em] py-6 shadow-xl" onClick={handleSave}>
              {editTask ? 'Update Mission' : 'Deploy Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
