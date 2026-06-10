import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, RADIUS, S } from '../../src/constants/theme';
import JournalView from '../../src/screens/JournalView';
import AffirmationsView from '../../src/screens/AffirmationsView';

type ReflectionMode = 'journal' | 'affirm';

const MODES: Array<{ key: ReflectionMode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'journal', label: 'Journal', icon: 'book-outline' },
  { key: 'affirm', label: 'Affirm', icon: 'heart-outline' },
];

export default function Reflection() {
  const [mode, setMode] = useState<ReflectionMode>('journal');

  return (
    <View style={styles.fill}>
      {mode === 'journal' ? <JournalView /> : <AffirmationsView />}

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.switcher}>
          {MODES.map((option) => {
            const active = mode === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setMode(option.key)}
                style={[styles.pill, active && styles.pillActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
              >
                <Ionicons
                  name={option.icon}
                  size={15}
                  color={active ? COLORS.accent : COLORS.fgSecondary}
                />
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: S.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  switcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    shadowColor: COLORS.bg,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    paddingVertical: S.xs + 2,
    paddingHorizontal: S.md,
    borderRadius: RADIUS.pill,
  },
  pillActive: {
    backgroundColor: COLORS.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.fgSecondary,
  },
  pillTextActive: {
    color: COLORS.accent,
  },
});
