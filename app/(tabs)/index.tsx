import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';

import { COLORS, TYPE, S, SCREEN_PADDING } from '../../src/constants/theme';
import { useIdentity } from '../../src/hooks/useIdentity';
import GradientBackground from '../../src/components/GradientBackground';
import { TAROT_CARDS } from '../../src/data/tarot';
import { getDailyItem } from '../../src/utils/shuffle';
import { getCardImage } from '../../src/data/tarot-images';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'good morning';
  if (hour < 17) return 'good afternoon';
  return 'good evening';
}

function getFormattedDate(): string {
  return new Date()
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    .toLowerCase();
}

// ---------------------------------------------------------------------------
// Home screen
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
    return <GradientBackground><View style={styles.blank} /></GradientBackground>;
  }

  // -- Not onboarded --------------------------------------------------------

  if (!isOnboarded || !identity) {
    return (
      <GradientBackground>
        <View style={styles.welcomeContainer}>
          <Pressable
            onPress={() => router.push('/onboarding')}
            hitSlop={20}
          >
            <Text style={styles.welcomeText}>begin</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  // -- Onboarded home -------------------------------------------------------

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* greeting */}
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>

        <View style={styles.gap64} />

        {/* daily card */}
        <Pressable
          onPress={() => router.push('/(tabs)/tarot')}
          hitSlop={{ top: 8, bottom: 8 }}
        >
          <View style={styles.dailyCardRow}>
            <Image
              source={cardImage}
              style={styles.dailyCardImage}
              resizeMode="contain"
            />
            <View style={styles.dailyCardInfo}>
              <Text style={styles.dailyCardName}>{dailyCard.name}</Text>
              <Text style={styles.dailyCardLabel}>your card today</Text>
            </View>
          </View>
          <View style={styles.hairline} />
        </Pressable>

        <View style={styles.gap64} />

        {/* identity / intention */}
        {identity.intention ? (
          <View>
            <Text style={styles.becomingLabel}>i am becoming</Text>
            <Text style={styles.intentionText}>{identity.intention}</Text>
          </View>
        ) : null}

        {identity.intention ? <View style={styles.gap64} /> : null}

        {/* nav links */}
        <View style={styles.linksRow}>
          <Pressable onPress={() => router.navigate('/(tabs)/tarot')} hitSlop={12}>
            <Text style={styles.linkText}>guidance</Text>
          </Pressable>
          <Text style={styles.linkDot}>  ·  </Text>
          <Pressable onPress={() => router.navigate('/(tabs)/affirmations')} hitSlop={12}>
            <Text style={styles.linkText}>affirm</Text>
          </Pressable>
          <Text style={styles.linkDot}>  ·  </Text>
          <Pressable onPress={() => router.navigate('/(tabs)/journal')} hitSlop={12}>
            <Text style={styles.linkText}>journal</Text>
          </Pressable>
        </View>

        <View style={styles.gap40} />

        {/* streak */}
        {streak > 0 ? (
          <View style={styles.streakRow}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}> days</Text>
          </View>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  blank: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: S.xl,
    paddingBottom: S.xxl,
  },

  // greeting
  greeting: {
    ...TYPE.accent,
    fontSize: 28,
  },
  date: {
    ...TYPE.muted,
    fontSize: 13,
    marginTop: S.xs,
  },

  // gaps
  gap64: {
    height: S.xxl,
  },
  gap40: {
    height: S.xl,
  },

  // daily card
  dailyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyCardImage: {
    width: 48,
    height: 80,
    borderRadius: 2,
  },
  dailyCardInfo: {
    marginLeft: S.md,
    flex: 1,
  },
  dailyCardName: {
    ...TYPE.accent,
    fontSize: 16,
  },
  dailyCardLabel: {
    ...TYPE.muted,
    fontSize: 12,
    marginTop: S.xs,
  },
  hairline: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginTop: S.md,
  },

  // identity
  becomingLabel: {
    ...TYPE.muted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  intentionText: {
    ...TYPE.heading,
    fontSize: 22,
    marginTop: S.sm,
    lineHeight: 30,
  },

  // nav links
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    ...TYPE.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  linkDot: {
    ...TYPE.muted,
    fontSize: 14,
  },

  // streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakNumber: {
    ...TYPE.accent,
    fontSize: 14,
  },
  streakLabel: {
    ...TYPE.muted,
    fontSize: 14,
  },

  // welcome
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    ...TYPE.heading,
    fontSize: 32,
  },
});
