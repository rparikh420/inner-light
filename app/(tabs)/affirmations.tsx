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

import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, SCREEN_PADDING } from '../../src/constants/theme';
import { AFFIRMATION_CATEGORIES, Affirmation } from '../../src/data/affirmations';
import GradientBackground from '../../src/components/GradientBackground';
import NeumorphicCard from '../../src/components/NeumorphicCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SCREEN_PADDING * 2;
const CARD_HEIGHT = 360;
const HOLD_DURATION = 500;

export default function AffirmationsScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(AFFIRMATION_CATEGORIES[0].id);
  const [affirmedIds, setAffirmedIds] = useState<Set<number>>(new Set());

  const selectedCategory = AFFIRMATION_CATEGORIES.find((c) => c.id === selectedCategoryId)!;
  const affirmations = selectedCategory.affirmations;

  const todayAffirmedCount = affirmedIds.size;
  const totalCount = AFFIRMATION_CATEGORIES.reduce((sum, cat) => sum + cat.affirmations.length, 0);

  // -----------------------------------------------------------------------
  // Category pill press
  // -----------------------------------------------------------------------
  const handleCategoryPress = useCallback((id: string) => {
    setSelectedCategoryId(id);
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // -----------------------------------------------------------------------
  // Render category pill
  // -----------------------------------------------------------------------
  const renderCategoryPill = (category: (typeof AFFIRMATION_CATEGORIES)[number]) => {
    const isSelected = category.id === selectedCategoryId;

    return (
      <Pressable
        key={category.id}
        onPress={() => handleCategoryPress(category.id)}
        style={[
          styles.pill,
          isSelected ? styles.pillSelected : styles.pillUnselected,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={category.name}
      >
        <Ionicons
          name={category.icon as any}
          size={16}
          color={isSelected ? '#FFFFFF' : COLORS.primary}
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

        {/* Counter */}
        <View style={styles.counterRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accent} />
          <Text style={styles.counterText}>
            {todayAffirmedCount}/{totalCount} affirmed today
          </Text>
        </View>

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
        <FlatList
          data={affirmations}
          renderItem={renderAffirmationCard}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + SPACING.md}
          decelerationRate="fast"
          contentContainerStyle={styles.cardList}
          style={styles.cardListContainer}
        />
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

    // Scale down subtly
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
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
      // Bounce scale
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.04, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
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

    // Reset
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

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
          {/* Icon */}
          <View style={styles.cardIconContainer}>
            <Ionicons
              name={affirmation.icon as any}
              size={48}
              color={isAffirmed ? COLORS.accent : COLORS.primary}
            />
          </View>

          {/* Text */}
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
                <Ionicons name="finger-print-outline" size={20} color={COLORS.secondary} />
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
    marginBottom: SPACING.xs,
  },

  // -- Counter --
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  counterText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
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
    ...SHADOWS.raised.dark,
  },
  pillUnselected: {
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.raised.dark,
    shadowOpacity: 0.15,
  },
  pillIcon: {
    marginRight: SPACING.xs,
  },
  pillText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },

  // -- Card list --
  cardListContainer: {
    flex: 1,
  },
  cardList: {
    paddingHorizontal: SCREEN_PADDING,
    gap: SPACING.md,
    alignItems: 'center',
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
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',

    // Neumorphic dual shadow (dark side -- light side handled by inner highlight)
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,

    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardAffirmed: {
    borderColor: COLORS.accent,
    borderWidth: 1.5,
  },

  cardIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,

    // Inner neumorphic look
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    color: COLORS.secondary,
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
    height: 4,
    backgroundColor: COLORS.border,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
  },
});
