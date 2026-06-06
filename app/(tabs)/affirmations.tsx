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
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, TYPE, S, SCREEN_PADDING, RADIUS, BUTTON } from '../../src/constants/theme';
import { AFFIRMATION_CATEGORIES, Affirmation } from '../../src/data/affirmations';
import GradientBackground from '../../src/components/GradientBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOLD_DURATION = 600;

export default function AffirmationsScreen() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(AFFIRMATION_CATEGORIES[0].id);
  const [affirmedIds, setAffirmedIds] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedCategory = AFFIRMATION_CATEGORIES.find((c) => c.id === selectedCategoryId)!;
  const affirmations = selectedCategory.affirmations;
  const categoryAffirmedCount = affirmations.filter((a) => affirmedIds.has(a.id)).length;

  const handleCategoryPress = useCallback((id: string) => {
    setSelectedCategoryId(id);
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const renderAffirmationPage = ({ item }: { item: Affirmation }) => (
    <AffirmationPage
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

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* category selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScroll}
        >
          {AFFIRMATION_CATEGORIES.map((cat) => {
            const isActive = cat.id === selectedCategoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={cat.name}
                style={[
                  styles.categoryPill,
                  isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive ? styles.categoryActive : styles.categoryInactive,
                  ]}
                >
                  {cat.name.toLowerCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* affirmation pages */}
        <View style={styles.pageArea}>
          <FlatList
            ref={flatListRef}
            data={affirmations}
            renderItem={renderAffirmationPage}
            keyExtractor={(item) => String(item.id)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
        </View>

        {/* page indicator + counter */}
        <View style={styles.bottomSection}>
          <Text style={styles.pageIndicator}>
            {activeIndex + 1} / {affirmations.length}
          </Text>
          {categoryAffirmedCount > 0 && (
            <View style={styles.counterPill}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
              <Text style={styles.counterText}>
                {categoryAffirmedCount} affirmed
              </Text>
            </View>
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// AffirmationPage — with visible affirm button + clear affirmed state
// ---------------------------------------------------------------------------

interface AffirmationPageProps {
  affirmation: Affirmation;
  isAffirmed: boolean;
  onAffirm: () => void;
}

function AffirmationPage({ affirmation, isAffirmed, onAffirm }: AffirmationPageProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<Animated.CompositeAnimation | null>(null);

  // Progress bar width for hold feedback
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Checkmark animation
  const checkOpacity = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 1.2, 1],
  });

  const handlePressIn = () => {
    if (isAffirmed) return;

    // Scale card down slightly
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();

    // Fill progress bar
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: HOLD_DURATION,
      useNativeDriver: false,
    });
    progressRef.current.start();

    // Trigger affirm after hold
    holdTimer.current = setTimeout(() => {
      onAffirm();

      // Show checkmark with bounce
      Animated.spring(checkAnim, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        mass: 0.8,
        useNativeDriver: true,
      }).start();

      // Release scale
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        mass: 1,
        useNativeDriver: true,
      }).start();
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    if (progressRef.current) {
      progressRef.current.stop();
    }
    // Reset if not affirmed
    if (!isAffirmed) {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 150,
        mass: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.pageContent}>
        {/* Affirmation text */}
        <Text
          style={[
            styles.affirmationText,
            isAffirmed && styles.affirmationTextAffirmed,
          ]}
        >
          {affirmation.text}
        </Text>

        {/* Affirmed checkmark overlay */}
        {isAffirmed && (
          <Animated.View
            style={[
              styles.checkmarkWrap,
              {
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
              },
            ]}
          >
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={28} color={COLORS.bg} />
            </View>
            <Text style={styles.affirmedLabel}>affirmed</Text>
          </Animated.View>
        )}

        {/* Affirm button — only when NOT affirmed */}
        {!isAffirmed && (
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.affirmButtonWrap}
            accessibilityRole="button"
            accessibilityLabel={`Hold to affirm: ${affirmation.text}`}
            accessibilityHint="Long press to affirm"
          >
            <Animated.View
              style={[
                styles.affirmButton,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              {/* Progress fill bar */}
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: progressWidth },
                ]}
              />
              <View style={styles.affirmButtonContent}>
                <Ionicons name="heart-outline" size={18} color={COLORS.accent} />
                <Text style={styles.affirmButtonText}>hold to affirm</Text>
              </View>
            </Animated.View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: S.lg,
  },

  // -- category selector --
  categoryScroll: {
    flexGrow: 0,
    marginBottom: S.lg,
  },
  categoryRow: {
    paddingHorizontal: SCREEN_PADDING,
    alignItems: 'center',
    gap: S.sm,
  },
  categoryPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  categoryPillInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  categoryText: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 14,
  },
  categoryActive: {
    color: COLORS.fg,
  },
  categoryInactive: {
    color: COLORS.fgSecondary,
  },

  // -- page area --
  pageArea: {
    flex: 1,
    justifyContent: 'center',
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING + S.md,
  },

  // -- affirmation text --
  affirmationText: {
    fontFamily: TYPE.heading.fontFamily,
    fontSize: 24,
    color: COLORS.fg,
    textAlign: 'center',
    lineHeight: 38,
    maxWidth: 320,
  },
  affirmationTextAffirmed: {
    color: COLORS.accent,
  },

  // -- affirm button --
  affirmButtonWrap: {
    marginTop: S.xl,
    width: '100%',
    maxWidth: 240,
  },
  affirmButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    overflow: 'hidden',
    minHeight: 52,
    justifyContent: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
  },
  affirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    paddingVertical: 14,
    paddingHorizontal: S.lg,
  },
  affirmButtonText: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },

  // -- affirmed state --
  checkmarkWrap: {
    alignItems: 'center',
    marginTop: S.xl,
  },
  checkmarkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affirmedLabel: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 13,
    color: COLORS.accent,
    marginTop: S.sm,
    letterSpacing: 1,
  },

  // -- bottom --
  bottomSection: {
    alignItems: 'center',
    paddingBottom: S.lg,
    paddingTop: S.md,
    gap: S.sm,
  },
  pageIndicator: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 12,
    color: COLORS.fgSecondary,
  },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: S.md,
    paddingVertical: S.xs,
  },
  counterText: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 12,
    color: COLORS.accent,
  },
});
