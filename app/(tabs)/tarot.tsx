import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import GradientBackground from '../../src/components/GradientBackground';
import Card from '../../src/components/Card';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, GLOW } from '../../src/constants/theme';
import { TAROT_CARDS, TarotCard } from '../../src/data/tarot';
import { getCardImage } from '../../src/data/tarot-images';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@inner_light/tarot_daily_pull';
const FLIP_DURATION = 600;

// Card image dimensions (Rider-Waite aspect ratio ~1:1.68)
const CARD_IMAGE_WIDTH = 200;
const CARD_IMAGE_HEIGHT = CARD_IMAGE_WIDTH * 1.68;

interface DailyPullRecord {
  date: string;
  cardId: number;
  isReversed: boolean;
}

type ReadingMode = 'guidance' | 'yesno';

// ---------------------------------------------------------------------------
// Yes/No/Maybe badge colors (dark mode friendly)
// ---------------------------------------------------------------------------

const YES_NO_COLORS = {
  yes: { bg: 'rgba(16,185,129,0.15)', text: '#10B981', label: 'Yes' },
  no: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', label: 'No' },
  maybe: { bg: 'rgba(212,165,116,0.15)', text: '#D4A574', label: 'Maybe' },
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
  const buttonScale = useRef(new Animated.Value(1)).current;

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

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [buttonScale]);

  // ---- render helpers ----
  const yesNoStyle = YES_NO_COLORS[card.yesNoMaybe];
  const cardImageSource = getCardImage(card.id);

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
              color={readingMode === 'guidance' ? '#FFFFFF' : COLORS.foregroundMuted}
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
              color={readingMode === 'yesno' ? '#FFFFFF' : COLORS.foregroundMuted}
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
              <View style={styles.cardBack}>
                <View style={styles.cardBackOrnate}>
                  <View style={styles.cardBackInner}>
                    <View style={styles.sparkleGlow}>
                      <Ionicons name="sparkles" size={64} color={COLORS.accent} />
                    </View>
                    <Text style={styles.tapHint}>Tap to Reveal</Text>
                    {readingMode === 'yesno' && (
                      <Text style={styles.tapSubHint}>Ask your question first</Text>
                    )}
                  </View>
                </View>
              </View>
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
            <Card style={styles.cardFront}>
              {/* Rider-Waite Card Image */}
              <View style={styles.cardImageContainer}>
                <View style={[styles.cardImageFrame, isReversed && styles.cardImageReversed]}>
                  <Image
                    source={cardImageSource}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Card Name */}
              <Text style={styles.cardName}>
                {card.name}
                {isReversed ? ' (Reversed)' : ''}
              </Text>

              {/* Astrology correspondence */}
              <View style={styles.astrologyBadge}>
                <Ionicons name="planet-outline" size={14} color={COLORS.foregroundMuted} />
                <Text style={styles.astrologyText}>{card.astrology}</Text>
              </View>

              {/* Yes/No mode: answer badge */}
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

              {/* Keywords as pills */}
              <View style={styles.keywordsRow}>
                {card.keywords.map((kw) => (
                  <View key={kw} style={styles.keywordTag}>
                    <Text style={styles.keywordText}>{kw}</Text>
                  </View>
                ))}
              </View>

              {/* Meaning */}
              <Text style={styles.sectionLabel}>
                {isReversed ? 'Upright Meaning' : 'Meaning'}
              </Text>
              <Text style={styles.meaningText}>{card.meaning}</Text>

              {/* Reversed Meaning */}
              {isReversed && (
                <>
                  <Text style={[styles.sectionLabel, styles.reversedLabel]}>
                    Reversed Meaning
                  </Text>
                  <View style={styles.reversedMeaningContainer}>
                    <Text style={styles.meaningText}>{card.reversed}</Text>
                  </View>
                </>
              )}

              {/* Guidance */}
              <Text style={styles.sectionLabel}>Guidance</Text>
              <Text style={styles.guidanceText}>
                {isReversed
                  ? `In reverse: ${card.reversed.split('.')[0]}. Reflect on what may be blocked or out of balance.`
                  : card.guidance}
              </Text>
            </Card>
          </Animated.View>
        </View>

        {/* New Reading Button */}
        {isRevealed && (
          <Pressable
            onPress={handleNewReading}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
          >
            <Animated.View
              style={[
                styles.newReadingButton,
                { transform: [{ scale: buttonScale }] },
              ]}
            >
              <Ionicons
                name="shuffle-outline"
                size={20}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
              <Text style={styles.newReadingText}>New Reading</Text>
            </Animated.View>
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
    paddingHorizontal: 20,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },

  // ---- Title ----
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
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
    color: COLORS.foregroundMuted,
  },

  modeToggleTextActive: {
    color: '#FFFFFF',
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
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accent,
    minHeight: 400,
    alignItems: 'center',
    justifyContent: 'center',
    ...GLOW.accentGlow,
  },

  cardBackOrnate: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(212,165,116,0.25)',
    padding: SPACING.xl,
    margin: SPACING.md,
  },

  cardBackInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },

  sparkleGlow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },

  tapHint: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
    marginTop: SPACING.sm,
  },

  tapSubHint: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.foregroundMuted,
    opacity: 0.7,
    fontStyle: 'italic',
  },

  // ---- Front of card ----
  cardFront: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  // ---- Card Image ----
  cardImageContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  cardImageFrame: {
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,165,116,0.3)',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },

  cardImageReversed: {
    transform: [{ rotate: '180deg' }],
  },

  cardImage: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
  },

  // ---- Card Name ----
  cardName: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.accent,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },

  // ---- Astrology badge ----
  astrologyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  astrologyText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: SPACING.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  keywordText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
  },

  // ---- Section labels ----
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
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

  reversedMeaningContainer: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
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
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 48,
    minWidth: 44,
    marginTop: SPACING.sm,
    ...GLOW.primaryGlow,
  },

  buttonIcon: {
    marginRight: SPACING.sm,
  },

  newReadingText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FFFFFF',
  },
});
