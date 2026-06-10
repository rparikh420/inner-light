import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';

import {
  COLORS,
  TYPE,
  S,
  RADIUS,
  SURFACE,
  BUTTON,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import { useIdentity } from '../../src/hooks/useIdentity';
import GradientBackground from '../../src/components/GradientBackground';
import { TAROT_CARDS } from '../../src/data/tarot';
import { getDailyItem } from '../../src/utils/shuffle';
import { getCardImage } from '../../src/data/tarot-images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return name ? `Good ${time}, ${name}` : `Good ${time}`;
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Quick Action Card
// ---------------------------------------------------------------------------

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ActionCard({ icon, title, subtitle, onPress }: ActionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={24} color={COLORS.accent} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Home Screen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const { identity, isOnboarded, loading } = useIdentity();

  const dailyCard = getDailyItem(TAROT_CARDS);
  const cardImage = getCardImage(dailyCard.id);

  // Loading
  if (loading) {
    return <GradientBackground><View style={{ flex: 1 }} /></GradientBackground>;
  }

  // Not onboarded
  if (!isOnboarded || !identity) {
    return (
      <GradientBackground>
        <View style={styles.welcomeWrap}>
          <View style={styles.welcomeContent}>
            <Ionicons name="sparkles" size={40} color={COLORS.accent} />
            <Text style={styles.welcomeTitle}>Inner Light</Text>
            <Text style={styles.welcomeSubtitle}>
              tarot · affirmations · journaling
            </Text>
            <Text style={styles.welcomeDesc}>
              Discover your path through daily guidance, personalized affirmations, and reflective journaling.
            </Text>
            <Pressable
              style={[BUTTON.primary, { marginTop: S.xl, width: '100%' }]}
              onPress={() => router.push('/onboarding')}
            >
              <Text style={BUTTON.primaryText}>Begin Your Journey</Text>
            </Pressable>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // Onboarded
  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Text style={styles.greeting}>{getGreeting(identity.name)}</Text>
        <Text style={styles.date}>{getFormattedDate()}</Text>

        {/* ── Daily Card (hero section) ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/tarot')}
          style={({ pressed }) => [
            styles.dailyCardWrap,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <View style={styles.dailyCard}>
            <Image
              source={cardImage}
              style={styles.dailyCardImage}
              resizeMode="contain"
            />
            <View style={styles.dailyCardText}>
              <Text style={styles.dailyCardLabel}>your card today</Text>
              <Text style={styles.dailyCardName}>{dailyCard.name}</Text>
              <Text style={styles.dailyCardKeywords}>
                {dailyCard.keywords.join(' · ')}
              </Text>
              <View style={styles.dailyCardArrow}>
                <Text style={styles.dailyCardCta}>view reading</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* ── Identity / Intention ── */}
        {identity.intention ? (
          <View style={styles.intentionSection}>
            <View style={[SURFACE.cardAccent, styles.intentionCard]}>
              <Text style={styles.intentionLabel}>i am becoming</Text>
              <Text style={styles.intentionText}>{identity.intention}</Text>
              {identity.goals && identity.goals.length > 0 && (
                <Text style={styles.intentionGoals}>
                  {identity.goals.join(' · ')}
                </Text>
              )}
            </View>
          </View>
        ) : null}

        {/* ── Quick Actions Grid ── */}
        <Text style={styles.sectionTitle}>explore</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="sparkles-outline"
            title="Guidance"
            subtitle="Draw a tarot card"
            onPress={() => router.navigate('/(tabs)/tarot')}
          />
          <ActionCard
            icon="book-outline"
            title="Reflection"
            subtitle="Journal & affirmations"
            onPress={() => router.navigate('/(tabs)/reflection')}
          />
          <ActionCard
            icon="flash-outline"
            title="Action"
            subtitle="CBT tools & practice"
            onPress={() => router.navigate('/(tabs)/action')}
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CARD_WIDTH = (SCREEN_WIDTH - SCREEN_PADDING * 2 - S.md) / 3;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: S.xxl + S.xl,
  },

  // ── Header ──
  greeting: {
    ...TYPE.heading,
    fontSize: 26,
    marginTop: S.lg,
  },
  date: {
    ...TYPE.secondary,
    fontSize: 14,
    marginTop: S.xs,
  },

  // ── Daily Card ──
  dailyCardWrap: {
    marginTop: S.xl,
  },
  dailyCard: {
    ...SURFACE.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: S.md,
  },
  dailyCardImage: {
    width: 70,
    height: 118,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
  },
  dailyCardText: {
    flex: 1,
    marginLeft: S.lg,
  },
  dailyCardLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  dailyCardName: {
    ...TYPE.accent,
    fontSize: 20,
    marginTop: S.xs,
  },
  dailyCardKeywords: {
    ...TYPE.secondary,
    fontSize: 12,
    marginTop: S.xs,
  },
  dailyCardArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: S.md,
    gap: S.xs,
  },
  dailyCardCta: {
    ...TYPE.accent,
    fontSize: 13,
  },

  // ── Intention ──
  intentionSection: {
    marginTop: S.xl,
  },
  intentionCard: {
    // SURFACE.cardAccent provides bg, border, radius, padding
  },
  intentionLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: S.sm,
  },
  intentionText: {
    ...TYPE.heading,
    fontSize: 22,
    lineHeight: 30,
  },
  intentionGoals: {
    ...TYPE.secondary,
    fontSize: 12,
    marginTop: S.md,
  },

  // ── Section Title ──
  sectionTitle: {
    ...TYPE.secondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: S.xl,
    marginBottom: S.md,
  },

  // ── Actions Grid ──
  actionsGrid: {
    flexDirection: 'row',
    gap: S.md,
  },
  actionCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.md,
  },
  actionTitle: {
    ...TYPE.body,
    fontSize: 14,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...TYPE.secondary,
    fontSize: 11,
    marginTop: S.xs,
  },


  // ── Welcome (not onboarded) ──
  welcomeWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: S.xl,
  },
  welcomeContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  welcomeTitle: {
    ...TYPE.heading,
    fontSize: 32,
    marginTop: S.lg,
  },
  welcomeSubtitle: {
    ...TYPE.secondary,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: S.sm,
  },
  welcomeDesc: {
    ...TYPE.secondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: S.lg,
  },
});
