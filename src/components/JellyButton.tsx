import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, RADIUS, S, TYPE } from '../constants/theme';

interface JellyButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'accent' | 'purple';
  style?: ViewStyle;
}

/**
 * A soft, glossy "jelly" button — squashes and spreads on press like a gel
 * capsule, with a translucent sheen for a bubbly highlight. Used for the
 * journal's secondary entry points (history, pattern analysis) where a plain
 * pill would feel too flat against the warm, tactile rest of the screen.
 */
export default function JellyButton({ label, icon, onPress, tone = 'accent', style }: JellyButtonProps) {
  const press = useRef(new Animated.Value(0)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(press, {
      toValue,
      useNativeDriver: true,
      speed: toValue ? 30 : 14,
      bounciness: toValue ? 0 : 12,
    }).start();
  };

  const colors: [string, string] = tone === 'purple'
    ? ['rgba(107,91,149,0.22)', 'rgba(107,91,149,0.10)']
    : ['rgba(201,168,124,0.26)', 'rgba(201,168,124,0.12)'];
  const borderColor = tone === 'purple' ? COLORS.purpleBorder : COLORS.accentBorder;
  const tint = tone === 'purple' ? COLORS.purple : COLORS.accent;

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  const scaleX = press.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const scaleY = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.outer,
          { borderColor, transform: [{ scale }, { scaleX }, { scaleY }] },
          style,
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheen} pointerEvents="none" />
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={20} color={tint} />
        </View>
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18,
    paddingHorizontal: S.lg,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: -36,
    left: -16,
    right: -16,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    transform: [{ rotate: '-8deg' }],
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...TYPE.body,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
