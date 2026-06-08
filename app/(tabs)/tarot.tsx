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
import { CARD_ANNOTATIONS } from '../../src/data/tarot-annotations';
import { getCardAstrology } from '../../src/utils/astrology';
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

const ANNOTATED_IMAGE_WIDTH = CARD_IMAGE_WIDTH * 0.62;
const ANNOTATED_IMAGE_HEIGHT = Math.round(ANNOTATED_IMAGE_WIDTH * 1.68);
const ANNOTATION_MARGIN = 92;

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
  const [showAnnotations, setShowAnnotations] = useState(false);

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
  const astro = getCardAstrology(card);

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
          <View style={{ width: S.sm }} />
          <Pressable
            onPress={() => setShowAnnotations((prev) => !prev)}
            style={[
              styles.modePill,
              showAnnotations && styles.modePillActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: showAnnotations }}
            accessibilityLabel="Toggle card annotations"
          >
            <Text
              style={[
                styles.modePillText,
                showAnnotations && styles.modePillTextActive,
              ]}
            >
              annotate
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
              {/* Eyebrow — number · arcana */}
              <Text style={styles.eyebrow}>
                {astro.numeral} · {card.arcana} arcana
              </Text>

              {/* Card name */}
              <Text style={styles.cardName}>
                {card.name}
                {isReversed && (
                  <Text style={styles.reversedSuffix}> reversed</Text>
                )}
              </Text>

              {showAnnotations ? (
                <>
                  {/* Smaller placement chips, stacked above the card */}
                  <View style={styles.miniBadgeRow}>
                    <MiniBadge label="planet" value={astro.planetName} />
                    <MiniBadge label="element" value={astro.sign.element} />
                    <MiniBadge label="number" value={String(card.number)} />
                    <MiniBadge label="zodiac" value={astro.sign.name} />
                  </View>

                  {/* Card illustration with symbol callouts */}
                  <View style={styles.annotatedWrap}>
                    <View style={styles.annotatedImageWrap}>
                      <Image
                        source={cardImageSource}
                        style={[
                          styles.annotatedImage,
                          isReversed && { transform: [{ rotate: '180deg' }] },
                        ]}
                        resizeMode="contain"
                      />
                    </View>
                    <CardAnnotations
                      annotations={CARD_ANNOTATIONS[card.id] ?? []}
                      isReversed={isReversed}
                    />
                  </View>
                </>
              ) : (
                /* Astrology badges flanking the card image */
                <View style={styles.astroSection}>
                  <View style={styles.badgeColumn}>
                    <AstroBadge label="planet" value={astro.planetName} />
                    <AstroBadge label="element" value={astro.sign.element} />
                  </View>

                  <View style={styles.heroImageWrap}>
                    <Image
                      source={cardImageSource}
                      style={[
                        styles.heroImage,
                        isReversed && { transform: [{ rotate: '180deg' }] },
                      ]}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.badgeColumn}>
                    <AstroBadge label="number" value={String(card.number)} />
                    <AstroBadge label="zodiac" value={astro.sign.name} />
                  </View>
                </View>
              )}

              {/* Keywords */}
              <Text style={styles.keywords}>
                {card.keywords.join(' · ').toUpperCase()}
              </Text>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Ionicons name="sparkles" size={12} color={COLORS.accent} />
                <View style={styles.dividerLine} />
              </View>

              {/* Astrological aspects to this placement */}
              <View style={styles.aspectGrid}>
                {astro.aspects.map((aspect) => (
                  <View key={aspect.label} style={styles.aspectCell}>
                    <Text style={styles.aspectLabel}>{aspect.label.toUpperCase()}</Text>
                    <Text style={styles.aspectValue}>
                      {aspect.signs.map((sign) => sign.name).join(' · ')}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Yes/No answer */}
              {readingMode === 'yesno' && (
                <Text style={[styles.yesNoAnswer, { color: yesNoColor }]}>
                  {yesNoAnswer}
                </Text>
              )}

              {/* Guidance content */}
              {readingMode === 'guidance' && (
                <>
                  {/* Meaning — labeled by the card's current orientation */}
                  {isReversed ? (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionLabel}>reversed meaning</Text>
                      <View style={styles.reversedBlock}>
                        <Text style={styles.bodyText}>{card.reversed}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.sectionBlock}>
                      <Text style={styles.sectionLabel}>upright meaning</Text>
                      <Text style={styles.bodyText}>{card.meaning}</Text>
                    </View>
                  )}

                  {/* Guidance, as a daily mantra */}
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>&ldquo;{card.guidance}&rdquo;</Text>
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
// Astrology badge — small label/value chip used in the placement layout
// ---------------------------------------------------------------------------

function AstroBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mini badge — compact placement chip for the annotated layout
// ---------------------------------------------------------------------------

function MiniBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniBadge}>
      <Text style={styles.miniBadgeLabel}>{label}</Text>
      <Text style={styles.miniBadgeValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Card annotations — leader lines from symbols in the illustration out to
// short captions in the margins either side of the image
// ---------------------------------------------------------------------------

function CardAnnotations({
  annotations,
  isReversed,
}: {
  annotations: import('../../src/data/tarot-annotations').CardAnnotation[];
  isReversed: boolean;
}) {
  return (
    <>
      {annotations.map((annotation, index) => {
        // When the card is displayed reversed, the image is rotated 180° —
        // mirror the callout position so the line still meets its symbol.
        const x = isReversed ? 100 - annotation.x : annotation.x;
        const y = isReversed ? 100 - annotation.y : annotation.y;

        const dotLeft = ANNOTATION_MARGIN + (x / 100) * ANNOTATED_IMAGE_WIDTH;
        const dotTop = (y / 100) * ANNOTATED_IMAGE_HEIGHT;
        const pointsLeft = x < 50;
        const lineLeft = pointsLeft ? ANNOTATION_MARGIN : dotLeft;
        const lineWidth = pointsLeft
          ? dotLeft - ANNOTATION_MARGIN
          : ANNOTATION_MARGIN + ANNOTATED_IMAGE_WIDTH - dotLeft;

        return (
          <React.Fragment key={index}>
            <View style={[styles.annotationDot, { left: dotLeft - 3, top: dotTop - 3 }]} />
            <View style={[styles.annotationLine, { left: lineLeft, top: dotTop, width: lineWidth }]} />
            <View
              style={[
                styles.annotationCaption,
                pointsLeft
                  ? { left: 0, width: ANNOTATION_MARGIN - 10, alignItems: 'flex-end', top: dotTop - 14 }
                  : {
                      left: ANNOTATION_MARGIN + ANNOTATED_IMAGE_WIDTH + 10,
                      width: ANNOTATION_MARGIN - 10,
                      alignItems: 'flex-start',
                      top: dotTop - 14,
                    },
              ]}
            >
              <Text style={[styles.annotationLabel, { textAlign: pointsLeft ? 'right' : 'left' }]}>
                {annotation.label}
              </Text>
              <Text style={[styles.annotationMeaning, { textAlign: pointsLeft ? 'right' : 'left' }]}>
                {annotation.meaning}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </>
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

  // ---- Eyebrow (number · arcana) ----
  eyebrow: {
    ...TYPE.secondary,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: S.sm,
  },

  // ---- Card name ----
  cardName: {
    ...TYPE.accent,
    fontSize: 26,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: S.xs,
  },
  reversedSuffix: {
    ...TYPE.secondary,
    fontSize: 26,
    fontFamily: TYPE.accent.fontFamily,
  },

  // ---- Astrology badge layout (flanking the card image) ----
  astroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: S.lg,
  },
  badgeColumn: {
    flex: 1,
    alignItems: 'center',
  },
  badge: {
    width: '100%',
    maxWidth: 108,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    paddingVertical: S.sm,
    paddingHorizontal: S.sm,
    alignItems: 'center',
    marginBottom: S.sm,
  },
  badgeLabel: {
    ...TYPE.secondary,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  badgeValue: {
    ...TYPE.accent,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  // ---- Hero image (between the badge columns) ----
  heroImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: S.sm,
  },
  heroImage: {
    width: CARD_IMAGE_WIDTH * 0.5,
    height: CARD_IMAGE_HEIGHT * 0.5,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accentBorder,
  },

  // ---- Mini placement chips (annotated layout) ----
  miniBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    marginBottom: S.lg,
  },
  miniBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    paddingVertical: 6,
    paddingHorizontal: S.sm,
    alignItems: 'center',
  },
  miniBadgeLabel: {
    ...TYPE.secondary,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  miniBadgeValue: {
    ...TYPE.accent,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ---- Annotated illustration ----
  annotatedWrap: {
    width: ANNOTATION_MARGIN * 2 + ANNOTATED_IMAGE_WIDTH,
    height: ANNOTATED_IMAGE_HEIGHT,
    marginBottom: S.lg,
  },
  annotatedImageWrap: {
    position: 'absolute',
    left: ANNOTATION_MARGIN,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  annotatedImage: {
    width: ANNOTATED_IMAGE_WIDTH,
    height: ANNOTATED_IMAGE_HEIGHT,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.accentBorder,
  },
  annotationDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  annotationLine: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(201,168,124,0.55)',
  },
  annotationCaption: {
    position: 'absolute',
  },
  annotationLabel: {
    ...TYPE.accent,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.fgSecondary,
    lineHeight: 16,
  },
  annotationMeaning: {
    ...TYPE.secondary,
    fontSize: 9,
    color: COLORS.accent,
    letterSpacing: 0.4,
    textTransform: 'lowercase',
    lineHeight: 12,
    marginTop: 1,
  },

  // ---- Keywords ----
  keywords: {
    ...TYPE.secondary,
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: S.lg,
  },

  // ---- Yes/No answer ----
  yesNoAnswer: {
    ...TYPE.heading,
    fontSize: 36,
    textAlign: 'center',
    marginTop: S.md,
    marginBottom: 32,
  },

  // ---- Divider ----
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: S.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginHorizontal: S.sm,
  },

  // ---- Aspect grid ----
  aspectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: S.lg,
  },
  aspectCell: {
    width: '48%',
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    marginBottom: S.sm,
  },
  aspectLabel: {
    ...TYPE.secondary,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  aspectValue: {
    ...TYPE.accent,
    fontSize: 14,
  },

  // ---- Quote box (daily guidance as mantra) ----
  quoteBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    padding: S.md,
    marginBottom: S.lg,
  },
  quoteText: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
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

  // ---- Draw again ----
  drawAgainWrap: {
    alignItems: 'center',
    marginTop: 48,
  },
});
