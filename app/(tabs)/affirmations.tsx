import React, { useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import * as Haptics from 'expo-haptics'; // TODO: re-enable when Node compat fixed

import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  GLOW,
  PRESS,
  SCREEN_PADDING,
} from '../../src/constants/theme';
import { AFFIRMATION_CATEGORIES, Affirmation } from '../../src/data/affirmations';
import GradientBackground from '../../src/components/GradientBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2;
const CARD_HEIGHT = 380;
const HOLD_DURATION = 500;

export default function AffirmationsScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(AFFIRMATION_CATEGORIES[0].id);
  const [affirmedIds, setAffirmedIds] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  const selectedCategory = AFFIRMATION_CATEGORIES.find((c) => c.id === selectedCategoryId)!;
  const affirmations = selectedCategory.affirmations;

  const categoryAffirmedCount = affirmations.filter((a) => affirmedIds.has(a.id)).length;

  // -----------------------------------------------------------------------
  // Category pill press
  // -----------------------------------------------------------------------
  const handleCategoryPress = useCallback((id: string) => {
    setSelectedCategoryId(id);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // -----------------------------------------------------------------------
  // Page indicator state
  // -----------------------------------------------------------------------
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // -----------------------------------------------------------------------
  // Render category pill
  // -----------------------------------------------------------------------
  const renderCategoryPill = (category: (typeof AFFIRMATION_CATEGORIES)[number]) => {
    const isSelected = category.id === selectedCategoryId;

    return (
      <Pressable
        key={category.id}
        onPress={() => handleCategoryPress(category.id)}
        style={({ pressed }) => [
          styles.pill,
          isSelected ? styles.pillSelected : styles.pillUnselected,
          pressed && { opacity: PRESS.opacity },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={category.name}
      >
        <Ionicons
          name={category.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : COLORS.foregroundMuted}
          style={styles.pillIcon}
        />
        <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
          {category.name}
        </Text>
      </Pressable>
    );
  };

  // -----------------------------------------------------------------------
  // Affirmation card
  // -----------------------------------------------------------------------
  const renderAffirmationCard = ({ item }: { item: Affirmation }) => {
    return (
      <AffirmationCard
        affirmation={item}
        isAffirmed={affirmedIds.has(item.id)}
        onAffirm={() => {
          setAffirmedIds((prev) => {
            const next = new Set(prev);
            next.add(item.id);
            return next;
          });
        }}
      />
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------
  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Affirmations</Text>

        {/* Category selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillContainer}
          style={styles.pillScroll}
        >
          {AFFIRMATION_CATEGORIES.map(renderCategoryPill)}
        </ScrollView>

        {/* Affirmation cards */}
        <View style={styles.cardSection}>
          <FlatList
            ref={flatListRef}
            data={affirmations}
            renderItem={renderAffirmationCard}
            keyExtractor={(item) => String(item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + SPACING.md}
            decelerationRate="fast"
            contentContainerStyle={styles.cardList}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          {/* Page dots */}
          <View style={styles.dotsContainer}>
            {affirmations.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Counter */}
        <View style={styles.counterRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accent} />
          <Text style={styles.counterText}>
            {categoryAffirmedCount} of {affirmations.length} affirmed
          </Text>
        </View>
      </View>
    </GradientBackground>
  );
}

// =========================================================================
// AffirmationCard -- handles long-press "Hold to Affirm"
// =========================================================================

interface AffirmationCardProps {
  affirmation: Affirmation;
  isAffirmed: boolean;
  onAffirm: () => void;
}

function AffirmationCard({ affirmation, isAffirmed, onAffirm }: AffirmationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const handlePressIn = () => {
    if (isAffirmed) return;

    // Scale down with spring
    Animated.spring(scaleAnim, {
      toValue: PRESS.scale,
      ...PRESS.springConfig,
    }).start();

    // Progress bar fill over HOLD_DURATION
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start();

    // Fire affirm after hold duration
    holdTimer.current = setTimeout(() => {
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAffirm();
      // Scale up then settle
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.02,
          ...PRESS.springConfig,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          ...PRESS.springConfig,
        }),
      ]).start();
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }

    // Reset scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...PRESS.springConfig,
    }).start();

    // Reset progress
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.cardPressable}
        accessibilityRole="button"
        accessibilityLabel={`${affirmation.text}. ${isAffirmed ? 'Affirmed' : 'Hold to affirm'}`}
        accessibilityHint={isAffirmed ? undefined : 'Long press to affirm'}
      >
        <View style={[styles.card, isAffirmed && styles.cardAffirmed]}>
          {/* Category icon */}
          <View style={[styles.cardIconContainer, isAffirmed && styles.cardIconContainerAffirmed]}>
            <Ionicons
              name={affirmation.icon as any}
              size={32}
              color={isAffirmed ? COLORS.accent : COLORS.accent}
            />
          </View>

          {/* Affirmation text */}
          <Text style={styles.cardText}>{affirmation.text}</Text>

          {/* Hold to Affirm / Affirmed label */}
          <View style={styles.affirmLabelRow}>
            {isAffirmed ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                <Text style={styles.affirmedLabel}>Affirmed</Text>
              </>
            ) : (
              <>
                <Ionicons name="finger-print-outline" size={20} color={COLORS.foregroundMuted} />
                <Text style={styles.holdLabel}>Hold to Affirm</Text>
              </>
            )}
          </View>

          {/* Progress bar (visible during hold) */}
          {!isAffirmed && (
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// =========================================================================
// Styles
// =========================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.md,
  },

  // -- Header --
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },

  // -- Category pills --
  pillScroll: {
    flexGrow: 0,
    marginBottom: SPACING.lg,
  },
  pillContainer: {
    paddingHorizontal: SCREEN_PADDING,
    gap: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.full,
    minHeight: 44,
    minWidth: 44,
  },
  pillSelected: {
    backgroundColor: COLORS.primary,
    ...GLOW.primaryGlow,
  },
  pillUnselected: {
    backgroundColor: COLORS.bgCard,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  pillIcon: {
    marginRight: SPACING.xs,
  },
  pillText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foregroundMuted,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },

  // -- Card section --
  cardSection: {
    flex: 1,
    justifyContent: 'center',
  },

  // -- Card list --
  cardList: {
    paddingHorizontal: SCREEN_PADDING,
    gap: SPACING.md,
    alignItems: 'center',
  },

  // -- Page dots --
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // -- Card --
  cardWrapper: {
    width: CARD_WIDTH,
  },
  cardPressable: {
    minHeight: 44,
    minWidth: 44,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  cardAffirmed: {
    borderColor: COLORS.accent,
    borderWidth: 1,
    ...GLOW.accentGlow,
  },

  cardIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  cardIconContainerAffirmed: {
    backgroundColor: COLORS.accentGlow,
    borderColor: COLORS.accent,
  },

  cardText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.relaxed,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },

  // -- Affirm label --
  affirmLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    minHeight: 44,
  },
  holdLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },
  affirmedLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.accent,
  },

  // -- Progress bar --
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },

  // -- Counter --
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  counterText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },
});
