import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GLOW,
  PRESS,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import { useIdentity } from '../../src/hooks/useIdentity';
import GradientBackground from '../../src/components/GradientBackground';
import Card from '../../src/components/Card';
import { TAROT_CARDS } from '../../src/data/tarot';
import { getDailyItem } from '../../src/utils/shuffle';
import { getCardImage } from '../../src/data/tarot-images';

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
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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
      style={{ alignItems: 'center', flex: 1 }}
    >
      <Animated.View
        style={[
          styles.quickActionCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons name={icon} size={24} color={COLORS.primary} />
      </Animated.View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen (not onboarded)
// ---------------------------------------------------------------------------

function WelcomeScreen() {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

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
    <GradientBackground>
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIconWrapper}>
          <Ionicons name="sparkles-outline" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.welcomeTitle}>Inner Light</Text>

        <Text style={styles.welcomeSubtitle}>
          Discover your path through daily tarot, affirmations, and mindful journaling.
        </Text>

        <Pressable
          onPress={() => router.push('/onboarding')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              styles.welcomeButton,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.welcomeButtonText}>Begin Your Journey</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Animated.View>
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
  const cardImage = getCardImage(dailyCard.id);

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
        {/* 1. Header -- greeting + date */}
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {identity.name}
          </Text>
          <Text style={styles.date}>{getFormattedDate()}</Text>
        </View>

        {/* 2. Daily Card Preview */}
        <Card
          variant="default"
          onPress={() => router.navigate('/(tabs)/tarot')}
          style={styles.dailyCardContainer}
        >
          <View style={styles.dailyCardContent}>
            <Image
              source={cardImage}
              style={styles.dailyCardImage}
              resizeMode="cover"
            />
            <View style={styles.dailyCardInfo}>
              <Text style={styles.dailyCardLabel}>Today's Card</Text>
              <Text style={styles.dailyCardName}>{dailyCard.name}</Text>
              <Text style={styles.dailyCardCta}>Tap to view full reading</Text>
            </View>
          </View>
        </Card>

        {/* 3. Identity / Intention Section */}
        <View style={styles.identitySection}>
          <Text style={styles.identityBecoming}>I am becoming...</Text>
          <View style={styles.identityGlow}>
            <Text style={styles.identityIntention}>{identity.intention}</Text>
          </View>
        </View>

        {/* 4. Quick Actions */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            icon="sparkles"
            label="Guidance"
            onPress={() => router.navigate('/(tabs)/tarot')}
          />
          <QuickAction
            icon="heart"
            label="Affirm"
            onPress={() => router.navigate('/(tabs)/affirmations')}
          />
          <QuickAction
            icon="book"
            label="Journal"
            onPress={() => router.navigate('/(tabs)/journal')}
          />
        </View>

        {/* 5. Streak */}
        <View style={styles.streakSection}>
          <Ionicons name="flame" size={24} color={COLORS.accent} />
          <Text style={styles.streakText}>
            {streak} day streak
          </Text>
        </View>
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

  // 1. Header
  headerSection: {
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
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
    marginTop: SPACING.xs,
  },

  // 2. Daily Card Preview
  dailyCardContainer: {
    marginBottom: SPACING.lg,
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyCardImage: {
    width: 60,
    height: 100,
    borderRadius: BORDER_RADIUS.sm,
  },
  dailyCardInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  dailyCardLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  dailyCardName: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
    marginBottom: SPACING.xs,
  },
  dailyCardCta: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
  },

  // 3. Identity Section
  identitySection: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  identityBecoming: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
    marginBottom: SPACING.sm,
  },
  identityGlow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.accentGlow,
    ...GLOW.accentGlow,
  },
  identityIntention: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
  },

  // 4. Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  quickActionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },

  // 5. Streak
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  streakText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
    marginLeft: SPACING.sm,
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
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...GLOW.primaryGlow,
  },
  welcomeTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['3xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  welcomeSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
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
    ...GLOW.primaryGlow,
  },
  welcomeButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#FFFFFF',
    marginRight: SPACING.sm,
  },
});
