import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { COLORS } from '../constants/theme';

interface VoiceWaveProps {
  /** true while actively listening — mounts the wave and starts metering the mic */
  active: boolean;
}

const BAR_COUNT = 4;
const MIN_LEVEL = 0.12;
const IDLE_LEVEL = 0.18;

type WebAudioRig = {
  context: AudioContext;
  analyser: AnalyserNode;
  stream: MediaStream;
  data: Uint8Array;
};

/**
 * A tiny bar-wave that reacts to the user's live mic level while listening.
 * On web it samples the raw input via the Web Audio API (the Web Speech API
 * exposes no volume data of its own); elsewhere it falls back to a gentle
 * staggered pulse so the wave still feels alive without real amplitude data.
 */
export default function VoiceWave({ active }: VoiceWaveProps) {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(IDLE_LEVEL)),
  ).current;

  const frameRef = useRef<number | null>(null);
  const audioRef = useRef<WebAudioRig | null>(null);
  const fallbackLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      teardown();
      bars.forEach((bar) => {
        Animated.timing(bar, { toValue: IDLE_LEVEL, duration: 200, useNativeDriver: false }).start();
      });
      return;
    }

    const canMeterRealAudio =
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window !== 'undefined';

    if (canMeterRealAudio) {
      startRealMeter();
    } else {
      startFallbackPulse();
    }

    return teardown;

    function startRealMeter() {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const AudioCtx = window.AudioContext ?? (window as any).webkitAudioContext;
          const context: AudioContext = new AudioCtx();
          const source = context.createMediaStreamSource(stream);
          const analyser = context.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.6;
          source.connect(analyser);

          const data = new Uint8Array(analyser.frequencyBinCount);
          audioRef.current = { context, analyser, stream, data };

          // Each bar samples its own slice of the lower spectrum (where voice
          // sits), so the wave ripples rather than pulsing as one solid block.
          const sliceSize = Math.max(1, Math.floor(data.length / 2 / BAR_COUNT));

          const sample = () => {
            analyser.getByteFrequencyData(data);
            bars.forEach((bar, i) => {
              const start = i * sliceSize;
              let sum = 0;
              for (let j = start; j < start + sliceSize; j++) sum += data[j];
              const avg = sum / sliceSize;
              const level = Math.max(MIN_LEVEL, Math.min(1, avg / 140));
              bar.setValue(level);
            });
            frameRef.current = requestAnimationFrame(sample);
          };

          sample();
        })
        .catch(() => {
          // mic stream unavailable for metering (permissions, no device, etc.)
          // — keep the wave alive with the staggered fallback instead.
          startFallbackPulse();
        });
    }

    function startFallbackPulse() {
      const pulseFor = (bar: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 0.85, duration: 360, delay, useNativeDriver: false }),
            Animated.timing(bar, { toValue: MIN_LEVEL, duration: 360, useNativeDriver: false }),
          ]),
        );

      fallbackLoopRef.current = Animated.parallel(bars.map((bar, i) => pulseFor(bar, i * 110)));
      fallbackLoopRef.current.start();
    }

    function teardown() {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      if (audioRef.current) {
        const { context, analyser, stream } = audioRef.current;
        analyser.disconnect();
        stream.getTracks().forEach((track) => track.stop());
        context.close();
        audioRef.current = null;
      }
      fallbackLoopRef.current?.stop();
      fallbackLoopRef.current = null;
    }
  }, [active, bars]);

  if (!active) return null;

  return (
    <View style={styles.row} pointerEvents="none">
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: bar.interpolate({ inputRange: [0, 1], outputRange: [4, 18] }),
              opacity: bar.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 18,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
});
