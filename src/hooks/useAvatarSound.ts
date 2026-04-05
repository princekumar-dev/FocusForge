import { useCallback, useRef } from 'react';

export function useAvatarSound() {
  const contextRef = useRef<AudioContext | null>(null);

  const playAvatarSound = useCallback((avatar: string) => {
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!contextRef.current) {
      contextRef.current = new AudioContextCtor();
    }
    const context = contextRef.current!;
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    const now = context.currentTime;

    // Define sound based on avatar category
    console.log(`[SoundEngine] Playing sound for avatar: ${avatar}`);

    if (['⚡', '🔥', '✨'].includes(avatar)) {
      const isThunder = avatar === '⚡';
      const isFire = avatar === '🔥';
      const isShimmer = avatar === '✨';

      if (isThunder) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1); // Snappier
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.12, now); // Slightly boosted
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        const rumbleOsc = context.createOscillator();
        const rumbleGain = context.createGain();
        rumbleOsc.type = 'triangle';
        rumbleOsc.frequency.setValueAtTime(70, now);
        rumbleOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
        rumbleGain.gain.setValueAtTime(0.18, now); // Boosted rumble
        for (let i = 0; i < 15; i++) {
          rumbleGain.gain.setValueAtTime(0.1 + (Math.sin(i * 1.5) * 0.05), now + i * 0.03);
        }
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        rumbleOsc.connect(filter);
        rumbleOsc.start();
        rumbleOsc.stop(now + 1.0);
      } else if (isFire) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1500, now); // Higher for crispness
        gain.gain.setValueAtTime(0.08, now); // Boosted
        for (let i = 0; i < 15; i++) {
          gain.gain.setValueAtTime(0.05 + Math.random() * 0.03, now + i * 0.02);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      } else if (isShimmer) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, now);
        gain.gain.setValueAtTime(0.1, now);
        for (let i = 0; i < 20; i++) {
          gain.gain.setValueAtTime(i % 2 === 0 ? 0.1 : 0.03, now + i * 0.015);
        }
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      }
    }
    else if (['🌱', '🌿', '🌳'].includes(avatar)) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.2);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    }
    else if (['🎯', '🏆'].includes(avatar)) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.05);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2500, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    }
    else if (['🦊', '🐱', '🐼', '👻'].includes(avatar)) {
      const isGhost = avatar === '👻';
      const isPanda = avatar === '🐼';
      const isCat = avatar === '🐱';
      const isFox = avatar === '🦊';

      if (isGhost) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1); // Sharper
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.1, now); // Boosted
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      } else if (isPanda) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now); // Audible on most speakers
        osc.frequency.linearRampToValueAtTime(360, now + 0.15);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.value = 5;
        gain.gain.setValueAtTime(0.2, now); // Boosted
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      } else if (isCat) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(1300, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(850, now + 0.12);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        gain.gain.setValueAtTime(0.12, now); // Boosted
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      } else if (isFox) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(1000, now + 0.04);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(700, now);
        filter.Q.value = 4;
        gain.gain.setValueAtTime(0.12, now); // Boosted
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      }
    } else {
      // Clean Snappy Tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.1);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    if (context.state === 'suspended') {
      void context.resume();
    }

    osc.start();
    osc.stop(now + 1.0); // Stop later to allow envelope to finish
  }, []);

  return { playAvatarSound };
}


