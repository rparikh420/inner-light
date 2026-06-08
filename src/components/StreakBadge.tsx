import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, RADIUS, S } from '../constants/theme';

interface StreakBadgeProps {
  count: number;
  style?: ViewStyle;
}

/**
 * A small flame that hovers in the corner of a screen, gently bobbing,
 * with a superscript count showing the current daily streak. Hidden
 * once the streak has lapsed back to zero.
 */
export default function StreakBadge({ count, style }: StreakBadgeProps) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  if (count <= 0) return null;

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY }] }, style]} pointerEvents="none">
      <View style={styles.bubble}>
        <Ionicons name="flame" size={20} color={COLORS.accent} />
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: S.md,
    right: S.md,
    zIndex: 20,
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.bg,
  },
});
