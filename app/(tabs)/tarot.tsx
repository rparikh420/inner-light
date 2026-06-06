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
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../../src/components/GradientBackground';
import {
  COLORS,
  TYPE,
  S,
  RADIUS,
  SURFACE,
  BUTTON,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import { TAROT_CARDS, TarotCard } from '../../src/data/tarot';
import { getCardImage } from '../../src/data/tarot-images';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@inner_light/tarot_daily_pull';
const FLIP_DURATION = 600;

const CARD_WIDTH = 260;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.68);

const CARD_IMAGE_WIDTH = 260;
const CARD_IMAGE_HEIGHT = Math.round(CARD_IMAGE_WIDTH * 1.68);

interface DailyPullRecord {
  date: string;
  cardId: number;
  isReversed: boolean;
}

type ReadingMode = 'guidance' | 'yesno';

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

  const persistPull = useCallback(
    async (pulled: TarotCard, reversed: boolean) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const record: DailyPullRecord = {
          date: today,
          cardId: pulled.id,
          isReversed: reversed,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      } catch {
        // silently ignore
      }
    },
    [],
  );

  // ---- handlers ----
  const handleReveal = useCallback(() => {
    if (isRevealed) return;

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

  // ---- derived ----
  const cardImageSource = getCardImage(card.id);

  const yesNoAnswer = isReversed
    ? card.yesNoMaybe === 'yes'
      ? 'maybe'
      : card.yesNoMaybe === 'no'
        ? 'no'
        : 'unlikely'
    : card.yesNoMaybe;

  const yesNoColor =
    yesNoAnswer === 'yes'
      ? COLORS.success
      : yesNoAnswer === 'no'
        ? COLORS.danger
        : COLORS.accent;

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Mode Toggle ---- */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setReadingMode('guidance')}
            style={[
              styles.modePill,
              readingMode === 'guidance' && styles.modePillActive,
            ]}
          >
            <Text
              style={[
                styles.modePillText,
                readingMode === 'guidance' && styles.modePillTextActive,
              ]}
            >
              guidance
            </Text>
          </Pressable>
          <View style={{ width: S.sm }} />
          <Pressable
            onPress={() => setReadingMode('yesno')}
            style={[
              styles.modePill,
              readingMode === 'yesno' && styles.modePillActive,
            ]}
          >
            <Text
              style={[
                styles.modePillText,
                readingMode === 'yesno' && styles.modePillTextActive,
              ]}
            >
              yes / no
            </Text>
          </Pressable>
        </View>

        {/* ---- Card Area ---- */}
        <View style={styles.cardContainer}>
          {/* Back face — unrevealed */}
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
            <Pressable onPress={handleReveal} style={styles.cardBackPressable}>
              <View style={styles.cardBack}>
                <Ionicons
                  name="sparkles"
                  size={48}
                  color={COLORS.accent}
                  style={styles.cardBackIcon}
                />
                <Text style={styles.cardBackTitle}>inner light</Text>
                <Text style={styles.cardBackSubtitle}>tap to draw</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Front face — revealed */}
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
            <View style={styles.revealedContent}>
              {/* Hero card image */}
              <View style={styles.imageWrap}>
                <Image
                  source={cardImageSource}
                  style={[
                    styles.cardImage,
                    isReversed && { transform: [{ rotate: '180deg' }] },
                  ]}
                  resizeMode="contain"
                />
              </View>

              {/* Card name */}
              <Text style={styles.cardName}>
                {card.name}
                {isReversed && (
                  <Text style={styles.reversedSuffix}> reversed</Text>
                )}
              </Text>

              {/* Astrology */}
              <Text style={styles.astrology}>{card.astrology}</Text>

              {/* Yes/No answer */}
              {readingMode === 'yesno' && (
                <Text style={[styles.yesNoAnswer, { color: yesNoColor }]}>
                  {yesNoAnswer}
                </Text>
              )}

              {/* Guidance content */}
              {readingMode === 'guidance' && (
                <>
                  {/* Keywords */}
                  <Text style={styles.keywords}>
                    {card.keywords.join(' · ')}
                  </Text>

                  {/* Meaning */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>meaning</Text>
                    <Text style={styles.bodyText}>{card.meaning}</Text>
                  </View>

                  {/* Reversed meaning */}
                  {isReversed && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionLabel}>reversed</Text>
                      <View style={styles.reversedBlock}>
                        <Text style={styles.bodyText}>{card.reversed}</Text>
                      </View>
                    </View>
                  )}

                  {/* Guidance */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>guidance</Text>
                    <Text style={styles.guidanceText}>
                      {isReversed
                        ? `in reverse: ${card.reversed.split('.')[0]}. reflect on what may be blocked or out of balance.`
                        : card.guidance}
                    </Text>
                  </View>
                </>
              )}

              {/* Draw again button */}
              <View style={styles.drawAgainWrap}>
                <Pressable onPress={handleNewReading} style={BUTTON.ghost}>
                  <Text style={BUTTON.ghostText}>draw again</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
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
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: S.md,
    paddingBottom: S.xxl,
  },

  // ---- Mode toggle ----
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: S.xl,
  },
  modePill: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  modePillActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  modePillText: {
    ...TYPE.secondary,
    fontSize: 14,
  },
  modePillTextActive: {
    color: COLORS.fg,
  },

  // ---- Card container ----
  cardContainer: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
  },
  cardFace: {
    width: '100%',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
  },
  cardFaceAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // ---- Unrevealed card back ----
  cardBackPressable: {
    minHeight: 44,
  },
  cardBack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  cardBackIcon: {
    marginBottom: S.md,
  },
  cardBackTitle: {
    ...TYPE.accent,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: S.sm,
  },
  cardBackSubtitle: {
    ...TYPE.secondary,
    fontSize: 13,
    textAlign: 'center',
  },

  // ---- Revealed content ----
  revealedContent: {
    alignItems: 'center',
    width: '100%',
  },

  // ---- Hero image ----
  imageWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  cardImage: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accentBorder,
  },

  // ---- Card name ----
  cardName: {
    ...TYPE.accent,
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: S.sm,
  },
  reversedSuffix: {
    ...TYPE.secondary,
    fontSize: 26,
    fontFamily: TYPE.accent.fontFamily,
  },

  // ---- Astrology ----
  astrology: {
    ...TYPE.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 32,
  },

  // ---- Yes/No answer ----
  yesNoAnswer: {
    ...TYPE.heading,
    fontSize: 36,
    textAlign: 'center',
    marginTop: S.md,
    marginBottom: 32,
  },

  // ---- Keywords ----
  keywords: {
    ...TYPE.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },

  // ---- Sections ----
  sectionBlock: {
    width: '100%',
    marginBottom: S.lg,
  },
  sectionLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: S.sm,
  },
  bodyText: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 24,
  },
  reversedBlock: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
    paddingLeft: S.md,
  },
  guidanceText: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // ---- Draw again ----
  drawAgainWrap: {
    alignItems: 'center',
    marginTop: 48,
  },
});
