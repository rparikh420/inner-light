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

import GradientBackground from '../../src/components/GradientBackground';
import { COLORS, TYPE, S, RADIUS, SCREEN_PADDING } from '../../src/constants/theme';
import { TAROT_CARDS, TarotCard } from '../../src/data/tarot';
import { getCardImage } from '../../src/data/tarot-images';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '@inner_light/tarot_daily_pull';
const FLIP_DURATION = 600;

const CARD_IMAGE_WIDTH = 280;
const CARD_IMAGE_HEIGHT = CARD_IMAGE_WIDTH * 1.68;

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
        {/* mode toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            onPress={() => setReadingMode('guidance')}
            hitSlop={8}
          >
            <Text
              style={[
                styles.modeText,
                readingMode === 'guidance' && styles.modeTextActive,
              ]}
            >
              guidance
            </Text>
          </Pressable>
          <Text style={styles.modeDot}>{'  ·  '}</Text>
          <Pressable
            onPress={() => setReadingMode('yesno')}
            hitSlop={8}
          >
            <Text
              style={[
                styles.modeText,
                readingMode === 'yesno' && styles.modeTextActive,
              ]}
            >
              yes / no
            </Text>
          </Pressable>
        </View>

        {/* card area */}
        <View style={styles.cardContainer}>
          {/* back face — unrevealed */}
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
            <Pressable onPress={handleReveal} style={styles.unrevealed}>
              <Text style={styles.tapText}>tap</Text>
            </Pressable>
          </Animated.View>

          {/* front face — revealed */}
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
              {/* hero card image */}
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

              {/* card name */}
              <Text style={styles.cardName}>
                {card.name}
                {isReversed && (
                  <Text style={styles.reversedSuffix}>{' (reversed)'}</Text>
                )}
              </Text>

              {/* astrology */}
              <Text style={styles.astrology}>{card.astrology}</Text>

              {/* yes/no answer */}
              {readingMode === 'yesno' && (
                <Text style={[styles.yesNoAnswer, { color: yesNoColor }]}>
                  {yesNoAnswer}
                </Text>
              )}

              {/* guidance content — skip for yesno mode */}
              {readingMode === 'guidance' && (
                <>
                  {/* keywords */}
                  <Text style={styles.keywords}>
                    {card.keywords.join(', ')}
                  </Text>

                  {/* meaning */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>meaning</Text>
                    <Text style={styles.bodyText}>{card.meaning}</Text>
                  </View>

                  {/* reversed meaning */}
                  {isReversed && (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionLabel}>reversed</Text>
                      <View style={styles.reversedBlock}>
                        <Text style={styles.bodyText}>{card.reversed}</Text>
                      </View>
                    </View>
                  )}

                  {/* guidance */}
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionLabel}>guidance</Text>
                    <Text style={styles.guidanceText}>
                      {isReversed
                        ? `in reverse: ${card.reversed.split('.')[0]}. reflect on what may be blocked or out of balance.`
                        : card.guidance}
                    </Text>
                  </View>

                  {/* shuffle link */}
                  <View style={styles.shuffleWrap}>
                    <Pressable onPress={handleNewReading} hitSlop={12}>
                      <Text style={styles.shuffleText}>shuffle</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* shuffle link for yesno mode */}
              {readingMode === 'yesno' && (
                <View style={styles.shuffleWrap}>
                  <Pressable onPress={handleNewReading} hitSlop={12}>
                    <Text style={styles.shuffleText}>shuffle</Text>
                  </Pressable>
                </View>
              )}
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

  // ---- mode toggle ----
  modeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: S.xl,
    minHeight: 44,
  },
  modeText: {
    ...TYPE.muted,
    fontSize: 14,
    minHeight: 44,
    textAlignVertical: 'center',
    lineHeight: 44,
  },
  modeTextActive: {
    color: COLORS.fg,
    textDecorationLine: 'underline',
  },
  modeDot: {
    ...TYPE.muted,
    fontSize: 14,
  },

  // ---- card container ----
  cardContainer: {
    width: '100%',
    flex: 1,
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

  // ---- unrevealed state ----
  unrevealed: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: {
    ...TYPE.muted,
    fontSize: 14,
    textAlign: 'center',
  },

  // ---- revealed content ----
  revealedContent: {
    alignItems: 'center',
  },

  // ---- hero image ----
  imageWrap: {
    alignItems: 'center',
    marginBottom: S.xl,
  },
  cardImage: {
    width: CARD_IMAGE_WIDTH,
    height: CARD_IMAGE_HEIGHT,
    borderRadius: RADIUS.sm,
  },

  // ---- card name ----
  cardName: {
    ...TYPE.accent,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: S.xs,
  },
  reversedSuffix: {
    ...TYPE.muted,
    fontSize: 28,
    fontFamily: TYPE.accent.fontFamily,
  },

  // ---- astrology ----
  astrology: {
    ...TYPE.muted,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: S.lg,
  },

  // ---- yes/no answer ----
  yesNoAnswer: {
    ...TYPE.heading,
    fontSize: 40,
    textAlign: 'center',
    marginTop: S.md,
    marginBottom: S.lg,
  },

  // ---- keywords ----
  keywords: {
    ...TYPE.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 32,
  },

  // ---- sections ----
  sectionBlock: {
    width: '100%',
    marginBottom: S.lg,
  },
  sectionLabel: {
    ...TYPE.muted,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: S.sm,
  },
  bodyText: {
    ...TYPE.body,
    fontSize: 16,
    lineHeight: 26,
  },
  reversedBlock: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: S.md,
  },
  guidanceText: {
    ...TYPE.body,
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
  },

  // ---- shuffle ----
  shuffleWrap: {
    alignItems: 'center',
    marginTop: 48,
    minHeight: 44,
    justifyContent: 'center',
  },
  shuffleText: {
    ...TYPE.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
