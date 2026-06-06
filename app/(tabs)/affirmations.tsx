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

import { COLORS, TYPE, S, SCREEN_PADDING, RADIUS } from '../../src/constants/theme';
import { AFFIRMATION_CATEGORIES, Affirmation } from '../../src/data/affirmations';
import GradientBackground from '../../src/components/GradientBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOLD_DURATION = 500;

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

        {/* page indicator */}
        <Text style={styles.pageIndicator}>
          {activeIndex + 1} / {affirmations.length}
        </Text>

        {/* bottom section */}
        <View style={styles.bottomSection}>
          {categoryAffirmedCount > 0 && (
            <Text style={styles.affirmedCount}>
              {categoryAffirmedCount} affirmed
            </Text>
          )}
          <Text style={styles.holdHint}>hold to affirm</Text>
        </View>
      </View>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// AffirmationPage — single full-width page with long-press gold flash
// ---------------------------------------------------------------------------

interface AffirmationPageProps {
  affirmation: Affirmation;
  isAffirmed: boolean;
  onAffirm: () => void;
}

function AffirmationPage({ affirmation, isAffirmed, onAffirm }: AffirmationPageProps) {
  const colorAnim = useRef(new Animated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.fg, COLORS.accent],
  });

  const handlePressIn = () => {
    if (isAffirmed) return;

    holdTimer.current = setTimeout(() => {
      onAffirm();
      // flash to gold then back
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ]).start();
    }, HOLD_DURATION);
  };

  const handlePressOut = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.page}
      accessibilityRole="button"
      accessibilityLabel={`${affirmation.text}. ${isAffirmed ? 'Affirmed' : 'Hold to affirm'}`}
      accessibilityHint={isAffirmed ? undefined : 'Long press to affirm'}
    >
      <View style={styles.pageContent}>
        <Animated.Text
          style={[
            styles.affirmationText,
            { color: textColor },
          ]}
        >
          {affirmation.text}
        </Animated.Text>
      </View>
    </Pressable>
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
    marginBottom: S.xl,
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
    minHeight: 44,
    minWidth: 44,
  },
  pageContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
  },
  affirmationText: {
    fontFamily: TYPE.heading.fontFamily,
    fontSize: 24,
    color: COLORS.fg,
    textAlign: 'center',
    lineHeight: 38,
    maxWidth: 300,
  },

  // -- page indicator --
  pageIndicator: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 12,
    color: COLORS.fgSecondary,
    textAlign: 'center',
    marginTop: S.md,
  },

  // -- bottom --
  bottomSection: {
    alignItems: 'center',
    paddingBottom: S.lg,
    paddingTop: S.xl,
    gap: S.xs,
  },
  affirmedCount: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 12,
    color: COLORS.fgSecondary,
  },
  holdHint: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 13,
    color: COLORS.fgSecondary,
  },
});
