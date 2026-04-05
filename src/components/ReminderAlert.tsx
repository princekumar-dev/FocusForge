import React from 'react';
import { useReminders } from '@/contexts/ReminderContext';
import { Button } from '@/components/ui/button';
import { BellRing, X } from 'lucide-react';

export function ReminderAlert() {
  const { alertTask, dismissAlert } = useReminders();

  if (!alertTask) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/20 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-md w-full glass p-8 rounded-[3rem] border-white/20 shadow-2xl space-y-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute inset-0 bg-primary/5 animate-pulse-glow -z-10" />
        
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl">
            <BellRing className="w-12 h-12 text-primary animate-bounce" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Mission Incoming</h2>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm truncate px-4">
            {alertTask.title}
          </h1>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Starts in less than 2 minutes!
          </p>
        </div>

        <div className="pt-4 space-y-4">
          <Button
            onClick={dismissAlert}
            className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-lg font-black uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
            STOP ALARM
          </Button>
          
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-6">
            Prepare your environment for tactical focus.
          </p>
        </div>

        <button
          onClick={dismissAlert}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
