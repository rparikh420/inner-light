import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, TYPE, S } from '../../src/constants/theme';
import GradientBackground from '../../src/components/GradientBackground';
import ToolWheel from '../../src/components/ToolWheel';

export default function Action() {
  return (
    <GradientBackground>
      <View style={styles.center}>
        <Ionicons name="flash-outline" size={36} color={COLORS.accent} />
        <Text style={styles.title}>Action</Text>
        <Text style={styles.subtitle}>
          Long-press the wheel to bloom it open, drag to a tool, and lift to open its
          worksheet. Drag it anywhere — it'll stay right where you leave it.
        </Text>
      </View>
      <ToolWheel />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    paddingHorizontal: S.lg,
  },
  title: {
    ...TYPE.heading,
    fontSize: 22,
    marginTop: S.xs,
  },
  subtitle: {
    ...TYPE.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
