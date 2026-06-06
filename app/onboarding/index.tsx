import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';

import { COLORS, TYPE, S, SCREEN_PADDING, SURFACE, BUTTON, RADIUS } from '../../src/constants/theme';
import GradientBackground from '../../src/components/GradientBackground';
import { useIdentity, UserIdentity } from '../../src/hooks/useIdentity';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const GOAL_OPTIONS = [
  'Career Growth',
  'Financial Freedom',
  'Better Health',
  'Self-Love',
  'Creativity',
  'Mindfulness',
  'Relationships',
  'Learning',
] as const;

type GoalOption = (typeof GOAL_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Step Indicator (3 dots)
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.stepIndicatorRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor:
                i === currentStep ? COLORS.accent : COLORS.fgSecondary,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen() {
  const { saveIdentity } = useIdentity();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [intention, setIntention] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<GoalOption[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  // -----------------------------------------------------------------------
  // Animate step transition (fade only)
  // -----------------------------------------------------------------------

  const animateTransition = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // -----------------------------------------------------------------------
  // Goal toggle
  // -----------------------------------------------------------------------

  const toggleGoal = (goal: GoalOption) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  // -----------------------------------------------------------------------
  // Navigation
  // -----------------------------------------------------------------------

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1);
    }
  };

  const handleBegin = async () => {
    const identity: UserIdentity = {
      name: name.trim(),
      intention: intention.trim(),
      goals: selectedGoals as unknown as string[],
      createdAt: new Date().toISOString(),
    };

    await saveIdentity(identity);
    router.replace('/(tabs)');
  };

  // -----------------------------------------------------------------------
  // Can proceed?
  // -----------------------------------------------------------------------

  const canProceedStep0 =
    name.trim().length > 0 && intention.trim().length > 0;
  const canProceedStep1 = selectedGoals.length > 0;

  // -----------------------------------------------------------------------
  // Step content
  // -----------------------------------------------------------------------

  const renderStep = () => {
    switch (step) {
      // ----- Step 1: Identity -----
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={styles.centerSection}>
              <Text style={styles.title}>who are you becoming?</Text>

              <View style={{ height: S.xl + S.sm }} />

              <TextInput
                style={styles.visibleInput}
                placeholder="your name"
                placeholderTextColor={COLORS.fgSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                textAlign="center"
              />

              <View style={{ height: S.lg }} />

              <TextInput
                style={[styles.visibleInput, styles.intentionInput]}
                placeholder="i want to become..."
                placeholderTextColor={COLORS.fgSecondary}
                value={intention}
                onChangeText={setIntention}
                multiline
                textAlign="center"
                textAlignVertical="top"
              />
            </View>

            <View style={styles.bottomAction}>
              <Pressable
                onPress={handleNext}
                disabled={!canProceedStep0}
                style={[
                  BUTTON.ghost,
                  !canProceedStep0 && styles.buttonDisabled,
                ]}
                hitSlop={12}
              >
                <Text style={BUTTON.ghostText}>next</Text>
              </Pressable>
            </View>
          </View>
        );

      // ----- Step 2: Goals -----
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.centerSection}>
              <Text style={[styles.title, { fontSize: 28 }]}>
                set your intentions
              </Text>

              <View style={{ height: S.xl }} />

              <View style={styles.goalsWrap}>
                {GOAL_OPTIONS.map((goal) => {
                  const selected = selectedGoals.includes(goal);
                  return (
                    <Pressable
                      key={goal}
                      onPress={() => toggleGoal(goal)}
                      style={[
                        styles.goalChip,
                        selected ? styles.goalChipSelected : styles.goalChipInactive,
                      ]}
                      hitSlop={4}
                    >
                      <Text
                        style={[
                          styles.goalChipText,
                          {
                            color: selected
                              ? COLORS.accent
                              : COLORS.fgSecondary,
                          },
                        ]}
                      >
                        {goal}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.bottomAction}>
              <Pressable
                onPress={handleNext}
                disabled={!canProceedStep1}
                style={[
                  BUTTON.ghost,
                  !canProceedStep1 && styles.buttonDisabled,
                ]}
                hitSlop={12}
              >
                <Text style={BUTTON.ghostText}>next</Text>
              </Pressable>
            </View>
          </View>
        );

      // ----- Step 3: Summary -----
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.centerSection}>
              <Text style={styles.intentionDisplay}>{intention}</Text>

              <View style={{ height: S.md }} />

              <Text style={styles.goalsDisplay}>
                {selectedGoals.join('  ·  ')}
              </Text>

              <View style={{ height: S.xxl }} />

              <Pressable
                onPress={handleBegin}
                style={BUTTON.primary}
                hitSlop={12}
              >
                <Text style={BUTTON.primaryText}>begin</Text>
              </Pressable>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <StepIndicator currentStep={step} />

          <Animated.View
            style={[
              styles.animatedContainer,
              { opacity: fadeAnim },
            ]}
          >
            {renderStep()}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: S.lg,
  },

  // -- Step Indicator --

  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: S.xl,
  },

  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // -- Animated container --

  animatedContainer: {
    flex: 1,
  },

  // -- Step content --

  stepContent: {
    flex: 1,
    justifyContent: 'space-between',
  },

  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // -- Typography --

  title: {
    ...TYPE.heading,
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
  },

  // -- Inputs (visible fields with surface bg + border) --

  visibleInput: {
    ...TYPE.body,
    fontSize: 18,
    color: COLORS.fg,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    width: '100%',
    minHeight: 44,
  },

  intentionInput: {
    minHeight: 64,
  },

  // -- Goals (chip layout) --

  goalsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.md,
  },

  goalChip: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },

  goalChipSelected: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },

  goalChipInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  goalChipText: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
  },

  // -- Bottom action --

  bottomAction: {
    alignItems: 'center',
    paddingBottom: S.xxl,
  },

  buttonDisabled: {
    opacity: 0.3,
  },

  // -- Step 3 --

  intentionDisplay: {
    ...TYPE.accent,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 34,
  },

  goalsDisplay: {
    ...TYPE.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },

  beginText: {
    ...TYPE.heading,
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
  },
});
