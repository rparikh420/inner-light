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

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, SCREEN_PADDING } from '../../src/constants/theme';
import GradientBackground from '../../src/components/GradientBackground';
import NeumorphicCard from '../../src/components/NeumorphicCard';
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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.goalChip,
        selected ? styles.goalChipSelected : styles.goalChipUnselected,
        pressed && !selected ? styles.goalChipPressed : null,
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
          color={COLORS.card}
          style={styles.goalChipIcon}
        />
      )}
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
                Your journey begins with intention. Tell us who you are and who
                you aspire to become.
              </Text>
            </View>

            <NeumorphicCard style={styles.inputCard}>
              <Text style={styles.inputLabel}>Your name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.border}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </NeumorphicCard>

            <NeumorphicCard style={styles.inputCard}>
              <Text style={styles.inputLabel}>I want to become...</Text>
              <TextInput
                style={[styles.textInput, styles.textInputMultiline]}
                placeholder="A person who lives with purpose and inner peace"
                placeholderTextColor={COLORS.border}
                value={intention}
                onChangeText={setIntention}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </NeumorphicCard>

            <Pressable
              onPress={handleNext}
              disabled={!canProceedStep0}
              style={({ pressed }) => [
                styles.primaryButton,
                !canProceedStep0 && styles.primaryButtonDisabled,
                pressed && canProceedStep0 && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.card}
                style={styles.buttonIcon}
              />
            </Pressable>
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
                Choose the areas of growth that matter most to you. These will
                shape your daily practices.
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
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={COLORS.primary}
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleNext}
                disabled={!canProceedStep1}
                style={({ pressed }) => [
                  styles.primaryButton,
                  !canProceedStep1 && styles.primaryButtonDisabled,
                  pressed && canProceedStep1 && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={COLORS.card}
                  style={styles.buttonIcon}
                />
              </Pressable>
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
                Every great transformation starts with a single step. You have
                already taken yours.
              </Text>
            </View>

            <NeumorphicCard style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Identity</Text>
              <Text style={styles.summaryValue}>{name}</Text>

              <View style={styles.summaryDivider} />

              <Text style={styles.summaryLabel}>Intention</Text>
              <Text style={styles.summaryValue}>{intention}</Text>

              <View style={styles.summaryDivider} />

              <Text style={styles.summaryLabel}>Focus Areas</Text>
              <View style={styles.summaryGoalsRow}>
                {selectedGoals.map((goal) => (
                  <View key={goal} style={styles.summaryGoalTag}>
                    <Text style={styles.summaryGoalTagText}>{goal}</Text>
                  </View>
                ))}
              </View>
            </NeumorphicCard>

            <Text style={styles.inspirationalText}>
              The light you seek is already within you. Let us help you uncover
              it, one mindful day at a time.
            </Text>

            <View style={styles.navRow}>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={COLORS.primary}
                  style={styles.buttonIcon}
                />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleBegin}
                style={({ pressed }) => [
                  styles.beginButton,
                  pressed && styles.beginButtonPressed,
                ]}
              >
                <Text style={styles.beginButtonText}>Begin</Text>
                <Ionicons
                  name="sunny-outline"
                  size={20}
                  color={COLORS.card}
                  style={styles.buttonIcon}
                />
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
    ...SHADOWS.raised.dark,
  },

  stepDotInactive: {
    backgroundColor: COLORS.border,
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
    color: COLORS.foreground,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
    opacity: 0.7,
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
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },

  textInput: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.foreground,
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    minHeight: 44,
  },

  textInputMultiline: {
    minHeight: 88,
    paddingTop: SPACING.sm + 4,
  },

  // -- Goals grid --

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
  },

  goalChipUnselected: {
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.raised.dark,
  },

  goalChipSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.pressed.dark,
  },

  goalChipPressed: {
    ...SHADOWS.pressed.dark,
  },

  goalChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foreground,
  },

  goalChipTextSelected: {
    color: COLORS.card,
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
    ...SHADOWS.raised.dark,
  },

  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
    ...SHADOWS.flat.dark,
  },

  primaryButtonPressed: {
    ...SHADOWS.pressed.dark,
  },

  primaryButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.card,
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 6,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    minWidth: 44,
    ...SHADOWS.raised.dark,
  },

  secondaryButtonPressed: {
    ...SHADOWS.pressed.dark,
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
    ...SHADOWS.raised.dark,
  },

  beginButtonPressed: {
    ...SHADOWS.pressed.dark,
  },

  beginButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.card,
  },

  buttonIcon: {
    marginLeft: SPACING.sm,
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
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },

  summaryValue: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  summaryGoalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },

  summaryGoalTag: {
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
  },

  summaryGoalTagText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },

  inspirationalText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    fontStyle: 'italic',
    color: COLORS.foreground,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    opacity: 0.6,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
