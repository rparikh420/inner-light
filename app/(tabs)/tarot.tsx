import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '../../src/components/GradientBackground';
import NeumorphicCard from '../../src/components/NeumorphicCard';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../src/constants/theme';
import { TAROT_CARDS, TarotCard } from '../../src/data/tarot';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@inner_light/tarot_daily_pull';
const FLIP_DURATION = 600;

interface DailyPullRecord {
  date: string;
  cardId: number;
  isReversed: boolean;
}

type ReadingMode = 'guidance' | 'yesno';

// ---------------------------------------------------------------------------
// Yes/No/Maybe badge colors
// ---------------------------------------------------------------------------

const YES_NO_COLORS = {
  yes: { bg: '#D1FAE5', text: '#065F46', label: 'Yes' },
  no: { bg: '#FEE2E2', text: '#991B1B', label: 'No' },
  maybe: { bg: '#FEF3C7', text: '#92400E', label: 'Maybe' },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TarotScreen() {
  // ---- state ----
  const [card, setCard] = useState<TarotCard>(() => getDailyItem(TAROT_CARDS));
  const [isRevealed, setIsRevealed] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [hasDrawnToday, setHasDrawnToday] = useState(false);
  const [readingMode, setReadingMode] = useState<ReadingMode>('guidance');

  // ---- animation ----
  const flipAnim = useRef(new Animated.Value(0)).current;

  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '180deg'],
  });
  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '90deg', '0deg'],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [1, 1, 0, 0],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.5, 1],
    outputRange: [0, 0, 1, 1],
  });

  // ---- AsyncStorage: check / persist daily pull ----
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const record: DailyPullRecord = JSON.parse(raw);
          const today = new Date().toISOString().split('T')[0];
          if (record.date === today) {
            const savedCard = TAROT_CARDS.find((c) => c.id === record.cardId);
            if (savedCard) {
              setCard(savedCard);
              setIsReversed(record.isReversed ?? false);
              setIsRevealed(true);
              setHasDrawnToday(true);
              flipAnim.setValue(1);
            }
          }
        }
      } catch {
        // silently ignore
      }
    })();
  }, [flipAnim]);

  const persistPull = useCallback(async (pulled: TarotCard, reversed: boolean) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const record: DailyPullRecord = { date: today, cardId: pulled.id, isReversed: reversed };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      // silently ignore
    }
  }, []);

  // ---- handlers ----
  const handleReveal = useCallback(() => {
    if (isRevealed) return;

    // ~30% chance of reversal
    const reversed = Math.random() < 0.3;
    setIsReversed(reversed);
    setIsRevealed(true);
    setHasDrawnToday(true);
    persistPull(card, reversed);

    Animated.timing(flipAnim, {
      toValue: 1,
      duration: FLIP_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isRevealed, card, flipAnim, persistPull]);

  const handleNewReading = useCallback(() => {
    flipAnim.setValue(0);
    setIsRevealed(false);
    setIsReversed(false);

    const nextCard = getRandomItem(TAROT_CARDS);
    const reversed = Math.random() < 0.3;
    setCard(nextCard);

    setTimeout(() => {
      setIsReversed(reversed);
      setIsRevealed(true);
      persistPull(nextCard, reversed);

      Animated.timing(flipAnim, {
        toValue: 1,
        duration: FLIP_DURATION,
        useNativeDriver: true,
      }).start();
    }, 300);
  }, [flipAnim, persistPull]);

  // ---- render helpers ----
  const yesNoStyle = YES_NO_COLORS[card.yesNoMaybe];

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Daily Guidance</Text>

        {/* Reading Mode Toggle */}
        <View style={styles.modeToggleRow}>
          <Pressable
            onPress={() => setReadingMode('guidance')}
            style={[
              styles.modeToggleButton,
              readingMode === 'guidance' && styles.modeToggleActive,
            ]}
          >
            <Ionicons
              name="compass-outline"
              size={16}
              color={readingMode === 'guidance' ? COLORS.background : COLORS.primary}
            />
            <Text
              style={[
                styles.modeToggleText,
                readingMode === 'guidance' && styles.modeToggleTextActive,
              ]}
            >
              Guidance
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setReadingMode('yesno')}
            style={[
              styles.modeToggleButton,
              readingMode === 'yesno' && styles.modeToggleActive,
            ]}
          >
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={readingMode === 'yesno' ? COLORS.background : COLORS.primary}
            />
            <Text
              style={[
                styles.modeToggleText,
                readingMode === 'yesno' && styles.modeToggleTextActive,
              ]}
            >
              Yes / No
            </Text>
          </Pressable>
        </View>

        {/* Card Area */}
        <View style={styles.cardContainer}>
          {/* Back face */}
          <Animated.View
            pointerEvents={isRevealed ? 'none' : 'auto'}
            style={[
              styles.cardFace,
              {
                transform: [{ perspective: 1000 }, { rotateY: backRotateY }],
                opacity: backOpacity,
              },
            ]}
          >
            <Pressable onPress={handleReveal} style={styles.pressable}>
              <NeumorphicCard style={styles.cardBack}>
                <View style={styles.cardBackInner}>
                  <Ionicons name="sparkles" size={64} color={COLORS.secondary} />
                  <Text style={styles.tapHint}>Tap to Reveal</Text>
                  {readingMode === 'yesno' && (
                    <Text style={styles.tapSubHint}>Ask your yes or no question first</Text>
                  )}
                </View>
              </NeumorphicCard>
            </Pressable>
          </Animated.View>

          {/* Front face */}
          <Animated.View
            pointerEvents={isRevealed ? 'auto' : 'none'}
            style={[
              styles.cardFace,
              styles.cardFaceAbsolute,
              {
                transform: [{ perspective: 1000 }, { rotateY: frontRotateY }],
                opacity: frontOpacity,
              },
            ]}
          >
            <NeumorphicCard style={styles.cardFront}>
              {/* Card Icon — rotated 180° if reversed */}
              <View style={[styles.cardIconWrap, isReversed && styles.cardIconReversed]}>
                <Ionicons
                  name={card.icon as keyof typeof Ionicons.glyphMap}
                  size={48}
                  color={isReversed ? COLORS.secondary : COLORS.primary}
                />
              </View>

              {/* Card Name + Reversed badge */}
              <Text style={styles.cardName}>
                {card.name}
                {isReversed ? ' (Reversed)' : ''}
              </Text>

              {/* Astrology correspondence */}
              <View style={styles.astrologyBadge}>
                <Ionicons name="planet-outline" size={14} color={COLORS.secondary} />
                <Text style={styles.astrologyText}>{card.astrology}</Text>
              </View>

              {/* Yes/No mode: big answer badge */}
              {readingMode === 'yesno' && (
                <View style={[styles.yesNoBadge, { backgroundColor: yesNoStyle.bg }]}>
                  <Text style={[styles.yesNoText, { color: yesNoStyle.text }]}>
                    {isReversed
                      ? card.yesNoMaybe === 'yes'
                        ? 'Maybe'
                        : card.yesNoMaybe === 'no'
                        ? 'No'
                        : 'Unlikely'
                      : yesNoStyle.label}
                  </Text>
                  {isReversed && card.yesNoMaybe === 'yes' && (
                    <Text style={[styles.yesNoSubtext, { color: yesNoStyle.text }]}>
                      Reversed energy clouds the outcome
                    </Text>
                  )}
                </View>
              )}

              {/* Keywords as tags */}
              <View style={styles.keywordsRow}>
                {card.keywords.map((kw) => (
                  <View key={kw} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{kw}</Text>
                  </View>
                ))}
              </View>

              {/* Upright Meaning */}
              <Text style={styles.sectionLabel}>
                {isReversed ? 'Upright Meaning' : 'Meaning'}
              </Text>
              <Text style={styles.meaningText}>{card.meaning}</Text>

              {/* Reversed Meaning — always show if card is reversed, or as supplementary info */}
              {isReversed && (
                <>
                  <Text style={[styles.sectionLabel, styles.reversedLabel]}>
                    Reversed Meaning
                  </Text>
                  <Text style={[styles.meaningText, styles.reversedMeaning]}>
                    {card.reversed}
                  </Text>
                </>
              )}

              {/* Guidance */}
              <Text style={styles.sectionLabel}>Guidance</Text>
              <Text style={styles.guidanceText}>
                {isReversed
                  ? `In reverse: ${card.reversed.split('.')[0]}. Reflect on what may be blocked or out of balance.`
                  : card.guidance}
              </Text>
            </NeumorphicCard>
          </Animated.View>
        </View>

        {/* New Reading Button */}
        {isRevealed && (
          <Pressable
            onPress={handleNewReading}
            style={({ pressed }) => [
              styles.newReadingButton,
              pressed && styles.newReadingButtonPressed,
            ]}
          >
            <Ionicons
              name="shuffle-outline"
              size={20}
              color={COLORS.background}
              style={styles.buttonIcon}
            />
            <Text style={styles.newReadingText}>New Reading</Text>
          </Pressable>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },

  title: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },

  // ---- Mode toggle ----
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 6,
    minHeight: 44,
  },

  modeToggleActive: {
    backgroundColor: COLORS.primary,
  },

  modeToggleText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },

  modeToggleTextActive: {
    color: COLORS.background,
  },

  // ---- Card container ----
  cardContainer: {
    width: '100%',
    minHeight: 420,
    marginBottom: SPACING.lg,
  },

  cardFace: {
    width: '100%',
    backfaceVisibility: 'hidden',
  },

  cardFaceAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  pressable: {
    width: '100%',
    minHeight: 44,
  },

  // ---- Back of card ----
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  cardBackInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },

  tapHint: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
    marginTop: SPACING.sm,
  },

  tapSubHint: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.secondary,
    opacity: 0.7,
    fontStyle: 'italic',
  },

  // ---- Front of card ----
  cardFront: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  cardIconWrap: {
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },

  cardIconReversed: {
    transform: [{ rotate: '180deg' }],
  },

  cardName: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  // ---- Astrology badge ----
  astrologyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: COLORS.muted,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  astrologyText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },

  // ---- Yes/No badge ----
  yesNoBadge: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },

  yesNoText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  yesNoSubtext: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: 4,
    opacity: 0.8,
  },

  // ---- Keywords ----
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },

  keywordTag: {
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  keywordText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },

  // ---- Section labels ----
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  reversedLabel: {
    color: COLORS.destructive,
  },

  meaningText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.md,
  },

  reversedMeaning: {
    opacity: 0.85,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.destructive,
    paddingLeft: SPACING.md,
  },

  guidanceText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    fontStyle: 'italic',
  },

  // ---- New Reading button ----
  newReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 48,
    minWidth: 44,
    marginTop: SPACING.sm,
  },

  newReadingButtonPressed: {
    opacity: 0.85,
  },

  buttonIcon: {
    marginRight: SPACING.sm,
  },

  newReadingText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.background,
  },
});
