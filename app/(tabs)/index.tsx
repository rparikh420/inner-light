import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import { useIdentity } from '../../src/hooks/useIdentity';
import GradientBackground from '../../src/components/GradientBackground';
import NeumorphicCard from '../../src/components/NeumorphicCard';
import { TAROT_CARDS } from '../../src/data/tarot';
import { getDailyItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Quick-action button
// ---------------------------------------------------------------------------

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        pressed && styles.quickActionPressed,
      ]}
    >
      <View style={styles.quickActionIconContainer}>
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen (not onboarded)
// ---------------------------------------------------------------------------

function WelcomeScreen() {
  return (
    <GradientBackground>
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIconWrapper}>
          <Ionicons name="sparkles-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.welcomeTitle}>Welcome to Inner Light</Text>

        <Text style={styles.welcomeSubtitle}>
          Begin your journey by setting an intention for who you want to become.
        </Text>

        <Pressable
          onPress={() => router.push('/onboarding')}
          style={({ pressed }) => [
            styles.welcomeButton,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.welcomeButtonText}>Set Your Intention</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.card} />
        </Pressable>
      </View>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Home screen (onboarded)
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const { identity, isOnboarded, loading, getStreak } = useIdentity();
  const [streak, setStreak] = useState(0);

  const dailyCard = getDailyItem(TAROT_CARDS);

  useEffect(() => {
    let mounted = true;
    getStreak().then((value) => {
      if (mounted) setStreak(value);
    });
    return () => {
      mounted = false;
    };
  }, [getStreak]);

  // -- Loading state --------------------------------------------------------

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </GradientBackground>
    );
  }

  // -- Not onboarded --------------------------------------------------------

  if (!isOnboarded || !identity) {
    return <WelcomeScreen />;
  }

  // -- Onboarded home -------------------------------------------------------

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {identity.name}
          </Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </View>

        {/* Daily Tarot Card */}
        <NeumorphicCard
          style={styles.tarotCard}
          onPress={() => router.push('/(tabs)/tarot')}
        >
          <View style={styles.tarotHeader}>
            <Ionicons
              name={(dailyCard.icon as keyof typeof Ionicons.glyphMap) || 'star-outline'}
              size={32}
              color={COLORS.primary}
            />
            <View style={styles.tarotBadge}>
              <Text style={styles.tarotBadgeText}>Daily Card</Text>
            </View>
          </View>

          <Text style={styles.tarotName}>{dailyCard.name}</Text>

          <Text style={styles.tarotKeywords}>
            {dailyCard.keywords.join('  /  ')}
          </Text>

          <Text style={styles.tarotGuidance} numberOfLines={3}>
            {dailyCard.guidance}
          </Text>

          <View style={styles.viewCardRow}>
            <Text style={styles.viewCardText}>View Card</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </View>
        </NeumorphicCard>

        {/* Identity Reminder */}
        <NeumorphicCard style={styles.identityCard}>
          <View style={styles.identityHeader}>
            <Ionicons name="compass-outline" size={22} color={COLORS.accent} />
            <Text style={styles.identityLabel}>Your Intention</Text>
          </View>
          <Text style={styles.identityIntention}>{identity.intention}</Text>
        </NeumorphicCard>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="layers-outline"
            label="Pull Card"
            onPress={() => router.push('/(tabs)/tarot')}
          />
          <QuickAction
            icon="heart-outline"
            label="Affirm"
            onPress={() => router.push('/(tabs)/affirmations')}
          />
          <QuickAction
            icon="journal-outline"
            label="Journal"
            onPress={() => router.push('/(tabs)/journal')}
          />
        </View>

        {/* Streak Counter */}
        <NeumorphicCard style={styles.streakCard}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={28} color={COLORS.accent} />
            <View style={styles.streakTextContainer}>
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakLabel}>
                {streak === 1 ? 'day streak' : 'day streak'}
              </Text>
            </View>
          </View>
          <Text style={styles.streakMessage}>
            {streak === 0
              ? 'Start your streak today by completing a daily practice.'
              : 'Keep the flame alive. Show up for yourself every day.'}
          </Text>
        </NeumorphicCard>
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SPACING.xxl,
  },

  // Greeting
  greetingSection: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes['2xl'] * TYPOGRAPHY.lineHeights.tight,
  },
  date: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.secondary,
    marginTop: SPACING.xs,
  },

  // Tarot card
  tarotCard: {
    marginBottom: SPACING.md,
  },
  tarotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  tarotBadge: {
    backgroundColor: COLORS.muted,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  tarotBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tarotName: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  tarotKeywords: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  tarotGuidance: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.md,
  },
  viewCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCardText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },

  // Identity
  identityCard: {
    marginBottom: SPACING.lg,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  identityLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: SPACING.sm,
  },
  identityIntention: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
    fontStyle: 'italic',
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
  },

  // Quick Actions
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.xs,
    minHeight: 88,
    ...SHADOWS.raised.dark,
  },
  quickActionPressed: {
    ...SHADOWS.pressed.dark,
    opacity: 0.9,
  },
  quickActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.raised.dark,
  },
  quickActionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
  },

  // Streak
  streakCard: {
    marginBottom: SPACING.md,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  streakTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: SPACING.sm,
  },
  streakCount: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginRight: SPACING.xs,
  },
  streakLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.secondary,
  },
  streakMessage: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.secondary,
    lineHeight: TYPOGRAPHY.sizes.sm * TYPOGRAPHY.lineHeights.normal,
  },

  // Welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
  },
  welcomeIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.raised.dark,
  },
  welcomeTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  welcomeSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.secondary,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    minHeight: 52,
  },
  welcomeButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.card,
    marginRight: SPACING.sm,
  },
});
