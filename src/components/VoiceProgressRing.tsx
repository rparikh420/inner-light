import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, RADIUS } from '../constants/theme';

interface VoiceProgressRingProps {
  /** 0–1 fill level for the current attempt */
  progress: number;
  /** true while actively listening (pulses the ring) */
  active: boolean;
  /** true once the current attempt has been recognized (flashes gold) */
  completed: boolean;
  size?: number;
}

export default function VoiceProgressRing({
  progress,
  active,
  completed,
  size = 96,
}: VoiceProgressRingProps) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Animate the fill level smoothly toward the latest progress value
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  // Gentle breathing pulse while listening
  useEffect(() => {
    if (active) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    return () => pulseLoop.current?.stop();
  }, [active, pulseAnim]);

  // Gold flash the instant a repetition is recognized
  useEffect(() => {
    if (completed) {
      flashAnim.setValue(1);
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 650,
        useNativeDriver: false,
      }).start();
    }
  }, [completed, flashAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const flashOpacity = flashAnim;

  return (
    <Animated.View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <View style={[styles.clip, { borderRadius: size / 2 }]}>
        <Animated.View style={[styles.fill, { height: fillHeight }]}>
          <LinearGradient
            colors={[COLORS.accentSoft, COLORS.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]}
        />
      </View>

      <View style={styles.iconWrap}>
        <Ionicons
          name={active ? 'mic' : 'mic-outline'}
          size={size * 0.34}
          color={completed ? COLORS.bg : COLORS.fg}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    overflow: 'hidden',
  },
  clip: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  flash: {
    backgroundColor: COLORS.accent,
    borderRadius: RADIUS.pill,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
