import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BUTTON, COLORS, RADIUS, S, SURFACE, TYPE } from '../constants/theme';
import { COGNITIVE_DISTORTIONS, CbtWorksheet } from '../data/cbt-worksheets';

type Phase = 'intro' | 'step' | 'closing';

interface SelfGuidedWorksheetProps {
  worksheet: CbtWorksheet;
}

/**
 * Walks a person through a CBT worksheet's steps one at a time — free-text
 * reflection for most steps, with the distortion-check step swapping in a
 * tappable list of thinking traps drawn from COGNITIVE_DISTORTIONS.
 */
export default function SelfGuidedWorksheet({ worksheet }: SelfGuidedWorksheetProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDistortions, setSelectedDistortions] = useState<Set<string>>(new Set());

  const step = worksheet.steps[stepIndex];
  const isDistortionStep = step?.id === 'distortions';

  const canAdvance = useMemo(() => {
    if (!step) return false;
    if (isDistortionStep) return true;
    return (answers[step.id] ?? '').trim().length > 0;
  }, [step, isDistortionStep, answers]);

  const toggleDistortion = (id: string) => {
    setSelectedDistortions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goNext = () => {
    if (stepIndex + 1 < worksheet.steps.length) {
      setStepIndex(stepIndex + 1);
    } else {
      setPhase('closing');
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else setPhase('intro');
  };

  const restart = () => {
    setPhase('intro');
    setStepIndex(0);
    setAnswers({});
    setSelectedDistortions(new Set());
  };

  if (phase === 'intro') {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[SURFACE.cardAccent, styles.card]}>
          <Text style={styles.overview}>{worksheet.overview}</Text>
          <Text style={styles.source}>{worksheet.source}</Text>
        </View>

        {worksheet.cautions.length > 0 && (
          <View style={[SURFACE.card, styles.cautionCard]}>
            <View style={styles.cautionHeader}>
              <Ionicons name="leaf-outline" size={16} color={COLORS.fgSecondary} />
              <Text style={styles.cautionHeading}>worth keeping in mind</Text>
            </View>
            {worksheet.cautions.map((caution, index) => (
              <View key={index} style={styles.cautionRow}>
                <View style={styles.cautionDot} />
                <Text style={styles.cautionText}>{caution}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.introText}>{worksheet.intro}</Text>

        <Pressable onPress={() => setPhase('step')} style={[BUTTON.primary, styles.actionButton]} accessibilityRole="button" accessibilityLabel="begin worksheet">
          <Text style={BUTTON.primaryText}>begin</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (phase === 'closing') {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[SURFACE.cardAccent, styles.card]}>
          <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.accent} style={styles.closingIcon} />
          <Text style={styles.overview}>{worksheet.closing}</Text>
        </View>

        <View style={styles.recapWrap}>
          {worksheet.steps.map((s) => {
            if (s.id === 'distortions') {
              if (selectedDistortions.size === 0) return null;
              return (
                <View key={s.id} style={[SURFACE.card, styles.recapCard]}>
                  <Text style={styles.recapLabel}>{s.title}</Text>
                  <Text style={styles.recapValue}>
                    {COGNITIVE_DISTORTIONS.filter((d) => selectedDistortions.has(d.id)).map((d) => d.name).join(' · ')}
                  </Text>
                </View>
              );
            }
            const value = answers[s.id];
            if (!value) return null;
            return (
              <View key={s.id} style={[SURFACE.card, styles.recapCard]}>
                <Text style={styles.recapLabel}>{s.title}</Text>
                <Text style={styles.recapValue}>{value}</Text>
              </View>
            );
          })}
        </View>

        <Pressable onPress={restart} style={[BUTTON.ghost, styles.actionButton]} accessibilityRole="button" accessibilityLabel="start over">
          <Text style={BUTTON.ghostText}>start over</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.progressRow}>
        {worksheet.steps.map((_, index) => (
          <View key={index} style={[styles.progressDot, index === stepIndex && styles.progressDotActive, index < stepIndex && styles.progressDotDone]} />
        ))}
      </View>

      <Text style={styles.stepTitle}>{step.title}</Text>
      <Text style={styles.stepPrompt}>{step.prompt}</Text>
      {step.helper && <Text style={styles.stepHelper}>{step.helper}</Text>}

      {isDistortionStep ? (
        <View style={styles.distortionList}>
          {COGNITIVE_DISTORTIONS.map((distortion) => {
            const active = selectedDistortions.has(distortion.id);
            return (
              <Pressable
                key={distortion.id}
                onPress={() => toggleDistortion(distortion.id)}
                style={[styles.distortionCard, active && styles.distortionCardActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={distortion.name}
              >
                <View style={styles.distortionHeader}>
                  <View style={[styles.distortionCheck, active && styles.distortionCheckActive]}>
                    {active && <Ionicons name="checkmark" size={13} color={COLORS.bg} />}
                  </View>
                  <Text style={[styles.distortionName, active && styles.distortionNameActive]}>{distortion.name}</Text>
                </View>
                <Text style={styles.distortionDefinition}>{distortion.definition}</Text>
                <Text style={styles.distortionExample}>{distortion.example}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <TextInput
          style={styles.textInput}
          placeholder={step.placeholder}
          placeholderTextColor={COLORS.fgSecondary}
          multiline
          textAlignVertical="top"
          value={answers[step.id] ?? ''}
          onChangeText={(text) => setAnswers((prev) => ({ ...prev, [step.id]: text }))}
        />
      )}

      <View style={styles.navRow}>
        <Pressable onPress={goBack} style={[BUTTON.ghost, styles.navButton]} accessibilityRole="button" accessibilityLabel="back">
          <Text style={BUTTON.ghostText}>back</Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          disabled={!canAdvance}
          style={[BUTTON.primary, styles.navButton, !canAdvance && styles.navButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel={stepIndex + 1 < worksheet.steps.length ? 'next' : 'finish'}
        >
          <Text style={BUTTON.primaryText}>{stepIndex + 1 < worksheet.steps.length ? 'next' : 'finish'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: S.lg,
    paddingBottom: S.huge,
    gap: S.md,
  },
  card: {
    gap: S.sm,
  },
  overview: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
  },
  source: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  cautionCard: {
    gap: S.sm,
  },
  cautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  cautionHeading: {
    ...TYPE.secondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cautionRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  cautionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 7,
  },
  cautionText: {
    ...TYPE.secondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  introText: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: S.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: S.xs,
    marginBottom: S.sm,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.accent,
  },
  progressDotDone: {
    backgroundColor: COLORS.accentBorder,
  },
  stepTitle: {
    ...TYPE.heading,
    fontSize: 19,
  },
  stepPrompt: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: S.xs,
  },
  stepHelper: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: S.xs,
  },
  textInput: {
    ...TYPE.body,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    minHeight: 120,
    padding: S.md,
    marginTop: S.md,
  },
  navRow: {
    flexDirection: 'row',
    gap: S.sm,
    marginTop: S.lg,
  },
  navButton: {
    flex: 1,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  distortionList: {
    gap: S.sm,
    marginTop: S.md,
  },
  distortionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
    gap: S.xs,
  },
  distortionCardActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  distortionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  distortionCheck: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distortionCheckActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  distortionName: {
    ...TYPE.body,
    fontSize: 14,
    fontWeight: '600',
  },
  distortionNameActive: {
    color: COLORS.accent,
  },
  distortionDefinition: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  distortionExample: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  closingIcon: {
    marginBottom: S.xs,
  },
  recapWrap: {
    gap: S.sm,
  },
  recapCard: {
    gap: 4,
  },
  recapLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  recapValue: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
  },
});
