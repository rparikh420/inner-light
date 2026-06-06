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
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GLOW,
  PRESS,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import GradientBackground from '../../src/components/GradientBackground';
import Card from '../../src/components/Card';
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
            i === currentStep ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Goal Chip
// ---------------------------------------------------------------------------

function GoalChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: PRESS.scale,
      ...PRESS.springConfig,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...PRESS.springConfig,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.goalChip,
          selected ? styles.goalChipSelected : styles.goalChipUnselected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text
          style={[
            styles.goalChipText,
            selected ? styles.goalChipTextSelected : null,
          ]}
        >
          {label}
        </Text>
        {selected && (
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={COLORS.foreground}
            style={styles.goalChipIcon}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Animated Button with press feedback
// ---------------------------------------------------------------------------

function AnimatedButton({
  onPress,
  disabled,
  style,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  style: any;
  children: React.ReactNode;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: PRESS.scale,
      ...PRESS.springConfig,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...PRESS.springConfig,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale: scaleAnim }] },
          disabled && styles.primaryButtonDisabled,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
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
  const slideAnim = useRef(new Animated.Value(0)).current;

  // -----------------------------------------------------------------------
  // Animate step transition
  // -----------------------------------------------------------------------

  const animateTransition = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
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

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const handleBegin = async () => {
    const identity: UserIdentity = {
      name: name.trim(),
      intention: intention.trim(),
      goals: selectedGoals,
      createdAt: new Date().toISOString(),
    };

    await saveIdentity(identity);
    router.replace('/(tabs)');
  };

  // -----------------------------------------------------------------------
  // Can proceed?
  // -----------------------------------------------------------------------

  const canProceedStep0 = name.trim().length > 0 && intention.trim().length > 0;
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
            <View style={styles.stepHeaderSection}>
              <Ionicons
                name="person-outline"
                size={40}
                color={COLORS.primary}
                style={styles.stepIcon}
              />
              <Text style={styles.stepTitle}>Who are you becoming?</Text>
              <Text style={styles.stepSubtitle}>
                Define the identity you want to step into
              </Text>
            </View>

            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.foregroundMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </Card>

            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>I want to become...</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="A person who lives with purpose and inner peace"
                placeholderTextColor={COLORS.foregroundMuted}
                value={intention}
                onChangeText={setIntention}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </Card>

            <AnimatedButton
              onPress={handleNext}
              disabled={!canProceedStep0}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Next</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.foreground}
                style={styles.buttonIcon}
              />
            </AnimatedButton>
          </View>
        );

      // ----- Step 2: Goals -----
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeaderSection}>
              <Ionicons
                name="compass-outline"
                size={40}
                color={COLORS.primary}
                style={styles.stepIcon}
              />
              <Text style={styles.stepTitle}>Set your intentions</Text>
              <Text style={styles.stepSubtitle}>
                Choose the areas of growth that matter most to you
              </Text>
            </View>

            <View style={styles.goalsGrid}>
              {GOAL_OPTIONS.map((goal) => (
                <GoalChip
                  key={goal}
                  label={goal}
                  selected={selectedGoals.includes(goal)}
                  onPress={() => toggleGoal(goal)}
                />
              ))}
            </View>

            <View style={styles.navRow}>
              <AnimatedButton
                onPress={handleBack}
                style={styles.secondaryButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={COLORS.primary}
                  style={styles.buttonIconLeft}
                />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </AnimatedButton>

              <AnimatedButton
                onPress={handleNext}
                disabled={!canProceedStep1}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={COLORS.foreground}
                  style={styles.buttonIcon}
                />
              </AnimatedButton>
            </View>
          </View>
        );

      // ----- Step 3: Summary -----
      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeaderSection}>
              <Ionicons
                name="sparkles-outline"
                size={40}
                color={COLORS.accent}
                style={styles.stepIcon}
              />
              <Text style={styles.stepTitle}>Your journey begins</Text>
              <Text style={styles.stepSubtitle}>
                Every great transformation starts with a single step
              </Text>
            </View>

            <Card style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Identity</Text>
              <Text style={styles.summaryNameValue}>{name}</Text>

              <View style={styles.summaryDivider} />

              <Text style={styles.summaryLabel}>Intention</Text>
              <Text style={styles.summaryIntentionValue}>{intention}</Text>

              <View style={styles.summaryDivider} />

              <Text style={styles.summaryLabel}>Focus Areas</Text>
              <View style={styles.summaryGoalsRow}>
                {selectedGoals.map((goal) => (
                  <View key={goal} style={styles.summaryGoalPill}>
                    <Text style={styles.summaryGoalPillText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </Card>

            <Text style={styles.inspirationalText}>
              "The light you seek is already within you. Let us help you uncover
              it, one mindful day at a time."
            </Text>

            <View style={styles.navRow}>
              <AnimatedButton
                onPress={handleBack}
                style={styles.secondaryButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={COLORS.primary}
                  style={styles.buttonIconLeft}
                />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </AnimatedButton>

              <AnimatedButton
                onPress={handleBegin}
                style={styles.beginButton}
              >
                <Text style={styles.beginButtonText}>Begin</Text>
                <Ionicons
                  name="sunny-outline"
                  size={20}
                  color={COLORS.bgDeep}
                  style={styles.buttonIcon}
                />
              </AnimatedButton>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator currentStep={step} />

          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {renderStep()}
          </Animated.View>
        </ScrollView>
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

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // -- Step Indicator --

  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },

  stepDot: {
    width: 10,
    height: 10,
    borderRadius: BORDER_RADIUS.full,
  },

  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 28,
  },

  stepDotInactive: {
    backgroundColor: COLORS.bgCard,
  },

  // -- Animated container --

  animatedContainer: {
    flex: 1,
  },

  // -- Step content --

  stepContent: {
    flex: 1,
  },

  stepHeaderSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },

  stepIcon: {
    marginBottom: SPACING.md,
  },

  stepTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes['2xl'] * TYPOGRAPHY.lineHeights.tight,
    marginBottom: SPACING.sm,
  },

  stepSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
    paddingHorizontal: SPACING.md,
  },

  // -- Input card --

  inputCard: {
    marginBottom: SPACING.md,
  },

  inputLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  textInput: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.foreground,
    backgroundColor: COLORS.bgElevated,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    minHeight: 44,
  },

  textInputMultiline: {
    minHeight: 88,
    paddingTop: SPACING.sm + 4,
  },

  // -- Goals grid (2x4) --

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm + 4,
    marginBottom: SPACING.xl,
  },

  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.xl,
    minHeight: 44,
    minWidth: 44,
    width: (SCREEN_WIDTH - SCREEN_PADDING * 2 - 12) / 2,
    justifyContent: 'center',
  },

  goalChipUnselected: {
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  goalChipSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.primary,
    ...GLOW.primaryGlow,
  },

  goalChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },

  goalChipTextSelected: {
    color: COLORS.foreground,
  },

  goalChipIcon: {
    marginLeft: SPACING.xs,
  },

  // -- Buttons --

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.xl,
    minHeight: 48,
    minWidth: 44,
    ...GLOW.primaryGlow,
  },

  primaryButtonDisabled: {
    backgroundColor: COLORS.bgCard,
    shadowOpacity: 0,
    elevation: 0,
  },

  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    minWidth: 44,
  },

  secondaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },

  beginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.xl,
    minHeight: 48,
    minWidth: 44,
    flex: 1,
    marginLeft: SPACING.sm,
    ...GLOW.accentGlow,
  },

  beginButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.bgDeep,
  },

  buttonIcon: {
    marginLeft: SPACING.sm,
  },

  buttonIconLeft: {
    marginRight: SPACING.sm,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },

  // -- Summary --

  summaryCard: {
    marginBottom: SPACING.lg,
  },

  summaryLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  summaryNameValue: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.accent,
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
  },

  summaryIntentionValue: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.accent,
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
  },

  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  summaryGoalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },

  summaryGoalPill: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },

  summaryGoalPillText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
  },

  inspirationalText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    fontStyle: 'italic',
    color: COLORS.foregroundMuted,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
