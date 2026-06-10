import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../../src/components/GradientBackground';
import { BUTTON, COLORS, RADIUS, S, SURFACE, TYPE } from '../../src/constants/theme';
import { getCbtTool } from '../../src/data/cbt-tools';
import { getCbtWorksheet } from '../../src/data/cbt-worksheets';
import AiGuidedConsent, { AI_CONSENT_KEY } from '../../src/components/AiGuidedConsent';
import SelfGuidedWorksheet from '../../src/components/SelfGuidedWorksheet';
import AiGuidedWorksheet from '../../src/components/AiGuidedWorksheet';

type WorksheetMode = 'self' | 'ai';
type Phase = 'picking' | 'worksheet';

const MODES: Array<{
  key: WorksheetMode;
  label: string;
  blurb: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: 'self',
    label: 'Self-guided',
    blurb: 'Work through it at your own pace, in your own words.',
    icon: 'create-outline',
  },
  {
    key: 'ai',
    label: 'AI-guided',
    blurb: 'Receive personalized prompts and reflections as you go, powered by Gemini.',
    icon: 'sparkles-outline',
  },
];

export default function ToolWorksheet() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tool = getCbtTool(id);
  const worksheet = getCbtWorksheet(id);

  const [phase, setPhase] = useState<Phase>('picking');
  const [mode, setMode] = useState<WorksheetMode | null>(null);
  const [consentVisible, setConsentVisible] = useState(false);
  const pendingModeRef = useRef<WorksheetMode | null>(null);

  useEffect(() => {
    setPhase('picking');
    setMode(null);
  }, [id]);

  const handleModeSelect = async (selected: WorksheetMode) => {
    if (selected === 'self') {
      setMode('self');
      return;
    }

    // AI mode — check if consent was already given
    try {
      const accepted = await AsyncStorage.getItem(AI_CONSENT_KEY);
      if (accepted === 'true') {
        setMode('ai');
      } else {
        pendingModeRef.current = 'ai';
        setConsentVisible(true);
      }
    } catch {
      pendingModeRef.current = 'ai';
      setConsentVisible(true);
    }
  };

  const handleConsentAccept = async () => {
    await AsyncStorage.setItem(AI_CONSENT_KEY, 'true').catch(() => {});
    setConsentVisible(false);
    if (pendingModeRef.current) {
      setMode(pendingModeRef.current);
      pendingModeRef.current = null;
    }
  };

  const handleConsentDecline = () => {
    setConsentVisible(false);
    pendingModeRef.current = null;
    // revert any tentative AI selection
    setMode((prev) => (prev === 'ai' ? null : prev));
  };

  const startWorksheet = () => {
    if (!mode) return;
    setPhase('worksheet');
  };

  if (!tool || !worksheet) {
    return (
      <GradientBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="go back"
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
          </Pressable>
          <Text style={styles.title}>tool not found</Text>
          <View style={styles.iconButton} />
        </View>
      </GradientBackground>
    );
  }

  if (phase === 'worksheet' && mode) {
    return (
      <GradientBackground>
        <View style={styles.header}>
          <Pressable
            onPress={() => setPhase('picking')}
            style={styles.iconButton}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="back to mode selection"
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
          </Pressable>
          <Text style={styles.title}>{tool.label.toLowerCase()}</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.modePill}>
          <Ionicons
            name={mode === 'ai' ? 'sparkles-outline' : 'create-outline'}
            size={13}
            color={COLORS.fgSecondary}
          />
          <Text style={styles.modePillText}>{mode === 'ai' ? 'AI-guided' : 'Self-guided'}</Text>
        </View>

        {mode === 'self' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.worksheetScroll}
          >
            <SelfGuidedWorksheet worksheet={worksheet} />
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.worksheetScroll}
          >
            <AiGuidedWorksheet worksheet={worksheet} />
          </ScrollView>
        )}
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="go back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
        </Pressable>
        <Text style={styles.title}>{tool.label.toLowerCase()}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[SURFACE.cardAccent, styles.introCard]}>
          <Ionicons name={tool.icon} size={28} color={COLORS.accent} />
          <Text style={styles.introText}>{tool.description}</Text>
        </View>

        <Text style={styles.sectionLabel}>how would you like to work through it?</Text>

        {MODES.map((option) => {
          const active = mode === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => handleModeSelect(option.key)}
              style={[styles.modeCard, active && styles.modeCardActive]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.modeIcon, active && styles.modeIconActive]}>
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={active ? COLORS.bg : COLORS.accent}
                />
              </View>
              <View style={styles.modeTextWrap}>
                <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>
                  {option.label}
                </Text>
                <Text style={styles.modeBlurb}>{option.blurb}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />}
            </Pressable>
          );
        })}

        {mode && (
          <Pressable
            onPress={startWorksheet}
            style={[BUTTON.primary, styles.startButton]}
            accessibilityRole="button"
            accessibilityLabel={`begin ${mode === 'ai' ? 'AI-guided' : 'self-guided'} session`}
          >
            <Text style={BUTTON.primaryText}>begin session</Text>
          </Pressable>
        )}
      </ScrollView>

      <AiGuidedConsent
        visible={consentVisible}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: S.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...TYPE.heading,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  scroll: {
    paddingTop: S.lg,
    paddingBottom: S.xxl,
    gap: S.md,
  },
  worksheetScroll: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
  },
  introText: {
    ...TYPE.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  sectionLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: S.sm,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
  },
  modeCardActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHover,
  },
  modeIconActive: {
    backgroundColor: COLORS.accent,
  },
  modeTextWrap: {
    flex: 1,
    gap: 2,
  },
  modeLabel: {
    ...TYPE.body,
    fontSize: 15,
    fontWeight: '600',
  },
  modeLabelActive: {
    color: COLORS.accent,
  },
  modeBlurb: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  startButton: {
    marginTop: S.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    alignSelf: 'flex-start',
    paddingVertical: S.xs,
    paddingHorizontal: S.sm,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: S.sm,
  },
  modePillText: {
    ...TYPE.secondary,
    fontSize: 12,
  },
});
