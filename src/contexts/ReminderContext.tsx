import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { client } from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ReminderContextType {
  alertTask: any | null;
  dismissAlert: () => void;
}

const ReminderContext = createContext<ReminderContextType | null>(null);

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { user, backendReady } = useAuth();
  const [alertTask, setAlertTask] = useState<any | null>(null);
  const notified10m = useRef<Set<number>>(new Set());
  const notified2m = useRef<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const playSoothingAlarm = () => {
    if (audioContextRef.current) return;
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    
    const playChime = () => {
      if (!audioContextRef.current) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5); // A5
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 1);
      
      oscillatorRef.current = osc;
    };

    // Repeat every 2 seconds
    const interval = setInterval(() => {
      if (!audioContextRef.current) {
        clearInterval(interval);
        return;
      }
      playChime();
    }, 2000);
    playChime();
  };

  const stopAlarm = () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const dismissAlert = () => {
    stopAlarm();
    setAlertTask(null);
  };

  useEffect(() => {
    if (!user || !backendReady) return;
    requestPermission();

    const checkTasks = async () => {
      try {
        const res = await client.entities.tasks.query({
          query: { status: 'pending' },
          limit: 100,
        });
        const tasks = res?.data?.items || [];
        const now = new Date().getTime();

        tasks.forEach((task: any) => {
          if (!task.due_date) return;
          const due = new Date(task.due_date).getTime();
          const diffMinutes = (due - now) / (1000 * 60);

          // 10 Minute Warning
          if (diffMinutes > 9.5 && diffMinutes <= 10.5 && !notified10m.current.has(task.id)) {
            if (Notification.permission === 'granted') {
              new Notification('Mission Imminent', {
                body: `Mission "${task.title}" starts in 10 minutes!`,
                icon: '/favicon.ico'
              });
            }
            toast.info(`Upcoming Mission: ${task.title} (10m)`);
            notified10m.current.add(task.id);
          }

          // 2 Minute Alarm
          if (diffMinutes > 0 && diffMinutes <= 2.5 && !notified2m.current.has(task.id)) {
            setAlertTask(task);
            playSoothingAlarm();
            notified2m.current.add(task.id);
          }
        });
      } catch (err) {
        console.error('Reminder check failed:', err);
      }
    };

    const interval = setInterval(checkTasks, 30000); // Check every 30s
    checkTasks();

    return () => clearInterval(interval);
  }, [user, backendReady]);

  return (
    <ReminderContext.Provider value={{ alertTask, dismissAlert }}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders() {
  const context = useContext(ReminderContext);
  if (!context) throw new Error('useReminders must be used within ReminderProvider');
  return context;
}
