import { useRef, useCallback, useEffect } from 'react';

export type AmbientPreset = 'rain' | 'forest' | 'focus';

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < channelData.length; i += 1) {
    channelData[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

export function useAmbientSound() {
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // Source may already be stopped
      }
      sourceRef.current.disconnect();
    }
    gainRef.current?.disconnect();
    filterRef.current?.disconnect();
    
    sourceRef.current = null;
    gainRef.current = null;
    filterRef.current = null;
  }, []);

  const play = useCallback((preset: AmbientPreset) => {
    stop();

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!contextRef.current) {
      contextRef.current = new AudioContextCtor();
    }
    const context = contextRef.current!;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    const profile = preset === 'rain' 
      ? { frequency: 900, q: 0.5, gain: 0.02 }
      : preset === 'forest'
      ? { frequency: 500, q: 1.2, gain: 0.018 }
      : { frequency: 180, q: 0.8, gain: 0.015 };

    source.buffer = createNoiseBuffer(context);
    source.loop = true;
    filter.type = preset === 'focus' ? 'lowpass' : 'bandpass';
    filter.frequency.value = profile.frequency;
    filter.Q.value = profile.q;
    gain.gain.value = profile.gain;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    if (context.state === 'suspended') {
      void context.resume();
    }
    
    source.start();

    sourceRef.current = source;
    filterRef.current = filter;
    gainRef.current = gain;
  }, [stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { play, stop };
}
