import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { COLORS, TYPE, S, SCREEN_PADDING, RADIUS } from '../../src/constants/theme';
import { AFFIRMATION_CATEGORIES, Affirmation } from '../../src/data/affirmations';
import GradientBackground from '../../src/components/GradientBackground';
import VoiceProgressRing from '../../src/components/VoiceProgressRing';
import StreakBadge from '../../src/components/StreakBadge';
import { useIdentity } from '../../src/hooks/useIdentity';
import { useSpeechToText } from '../../src/hooks/useSpeechToText';
import { speechMatchRatio } from '../../src/utils/speechMatch';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const REQUIRED_REPETITIONS = 3;
const MATCH_THRESHOLD = 0.65;

const ALL_AFFIRMATIONS = AFFIRMATION_CATEGORIES.flatMap((c) => c.affirmations);

export default function AffirmationsScreen() {
  const { getStreak, incrementStreak } = useIdentity();
  const [selectedCategoryId, setSelectedCategoryId] = useState(AFFIRMATION_CATEGORIES[0].id);
  const [affirmedIds, setAffirmedIds] = useState<Set<number>>(new Set());
  const [streak, setStreak] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    getStreak().then((value) => { if (mounted) setStreak(value); });
    return () => { mounted = false; };
  }, [getStreak]);

  // -- voice affirmation session (one shared recognizer; one active affirmation at a time) --
  const speech = useSpeechToText();
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [repCounts, setRepCounts] = useState<Record<number, number>>({});
  const [attemptProgress, setAttemptProgress] = useState(0);
  const [justCompletedId, setJustCompletedId] = useState<number | null>(null);
  const checkedSeqRef = useRef(0);
  const keepListeningRef = useRef(false);

  const selectedCategory = AFFIRMATION_CATEGORIES.find((c) => c.id === selectedCategoryId)!;
  const affirmations = selectedCategory.affirmations;
  const categoryAffirmedCount = affirmations.filter((a) => affirmedIds.has(a.id)).length;

  const stopSpeaking = useCallback(() => {
    keepListeningRef.current = false;
    speech.stop();
    setSpeakingId(null);
    setAttemptProgress(0);
    checkedSeqRef.current = speech.resultSeq;
  }, [speech]);

  const startSpeaking = useCallback(async (affirmation: Affirmation) => {
    checkedSeqRef.current = speech.resultSeq;
    setAttemptProgress(0);
    setSpeakingId(affirmation.id);
    keepListeningRef.current = true;
    await speech.start({ continuous: true, interimResults: true });
  }, [speech]);

  const handleToggleSpeaking = useCallback((affirmation: Affirmation) => {
    if (speakingId === affirmation.id) {
      stopSpeaking();
    } else {
      if (speakingId != null) stopSpeaking();
      startSpeaking(affirmation);
    }
  }, [speakingId, startSpeaking, stopSpeaking]);

  const handleCategoryPress = useCallback((id: string) => {
    stopSpeaking();
    setSelectedCategoryId(id);
    setActiveIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  }, [stopSpeaking]);

  const goToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, affirmations.length - 1));
    setActiveIndex(clamped);
    flatListRef.current?.scrollToIndex({ index: clamped, animated: true });
  }, [affirmations.length]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // -- live transcript → match against the affirmation currently being spoken --
  useEffect(() => {
    if (speakingId == null) return;
    const affirmation = ALL_AFFIRMATIONS.find((a) => a.id === speakingId);
    if (!affirmation) return;

    const liveText = speech.transcript || speech.interimTranscript;
    if (liveText) {
      setAttemptProgress(speechMatchRatio(liveText, affirmation.text));
    }

    if (speech.transcript && speech.resultSeq !== checkedSeqRef.current) {
      checkedSeqRef.current = speech.resultSeq;
      const ratio = speechMatchRatio(speech.transcript, affirmation.text);

      if (ratio >= MATCH_THRESHOLD) {
        const nextCount = (repCounts[affirmation.id] ?? 0) + 1;
        setRepCounts((prev) => ({ ...prev, [affirmation.id]: nextCount }));
        setAttemptProgress(0);
        setJustCompletedId(affirmation.id);
        setTimeout(() => {
          setJustCompletedId((current) => (current === affirmation.id ? null : current));
        }, 700);

        if (nextCount >= REQUIRED_REPETITIONS) {
          keepListeningRef.current = false;
          speech.stop();
          setSpeakingId(null);
          setAffirmedIds((prev) => {
            const next = new Set(prev);
            next.add(affirmation.id);
            return next;
          });
          incrementStreak().then(setStreak);
        }
      }
    }
  }, [speech.transcript, speech.interimTranscript, speech.resultSeq, speakingId, repCounts, speech, incrementStreak]);

  // -- continuous mode can end between phrases on some platforms; pick back up --
  useEffect(() => {
    if (!speech.isListening && speakingId != null && keepListeningRef.current) {
      const timer = setTimeout(() => {
        if (keepListeningRef.current) {
          speech.start({ continuous: true, interimResults: true });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [speech.isListening, speakingId, speech]);

  // -- surface permission/recognition errors by ending the session --
  useEffect(() => {
    if (speech.error && speakingId != null) {
      stopSpeaking();
    }
  }, [speech.error, speakingId, stopSpeaking]);

  const renderAffirmationPage = ({ item }: { item: Affirmation }) => (
    <AffirmationPage
      affirmation={item}
      isAffirmed={affirmedIds.has(item.id)}
      repCount={repCounts[item.id] ?? 0}
      isListening={speech.isListening && speakingId === item.id}
      progress={speakingId === item.id ? attemptProgress : 0}
      justCompleted={justCompletedId === item.id}
      onToggleSpeaking={() => handleToggleSpeaking(item)}
    />
  );

  return (
    <GradientBackground>
      <StreakBadge count={streak} style={styles.streakBadge} />
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
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollBeginDrag={stopSpeaking}
            getItemLayout={(_data, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>

        {/* navigation arrows + page indicator */}
        <View style={styles.navRow}>
          <Pressable
            onPress={() => { stopSpeaking(); goToIndex(activeIndex - 1); }}
            style={[styles.navArrow, activeIndex === 0 && styles.navArrowDisabled]}
            hitSlop={12}
            disabled={activeIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={activeIndex === 0 ? COLORS.border : COLORS.fgSecondary}
            />
          </Pressable>

          <View style={styles.navCenter}>
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

          <Pressable
            onPress={() => { stopSpeaking(); goToIndex(activeIndex + 1); }}
            style={[styles.navArrow, activeIndex >= affirmations.length - 1 && styles.navArrowDisabled]}
            hitSlop={12}
            disabled={activeIndex >= affirmations.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={activeIndex >= affirmations.length - 1 ? COLORS.border : COLORS.fgSecondary}
            />
          </Pressable>
        </View>
      </View>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// AffirmationPage — speak the affirmation aloud 3 times to complete it
// ---------------------------------------------------------------------------

interface AffirmationPageProps {
  affirmation: Affirmation;
  isAffirmed: boolean;
  repCount: number;
  isListening: boolean;
  progress: number;
  justCompleted: boolean;
  onToggleSpeaking: () => void;
}

function AffirmationPage({
  affirmation,
  isAffirmed,
  repCount,
  isListening,
  progress,
  justCompleted,
  onToggleSpeaking,
}: AffirmationPageProps) {
  const hint = isListening
    ? 'say it out loud…'
    : repCount > 0
      ? `${repCount} of ${REQUIRED_REPETITIONS} — tap to continue`
      : 'tap, then speak the affirmation aloud';

  return (
    <View style={styles.page}>
      <View style={styles.pageContent}>
        <Text
          style={[
            styles.affirmationText,
            isAffirmed && styles.affirmationTextAffirmed,
          ]}
        >
          {affirmation.text}
        </Text>

        {isAffirmed ? (
          <View style={styles.checkmarkWrap}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={28} color={COLORS.bg} />
            </View>
            <Text style={styles.affirmedLabel}>affirmed</Text>
          </View>
        ) : (
          <View style={styles.voiceWrap}>
            <Pressable
              onPress={onToggleSpeaking}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={
                isListening ? 'Stop speaking' : `Speak to affirm: ${affirmation.text}`
              }
              accessibilityHint="Say the affirmation aloud three times to complete it"
            >
              <VoiceProgressRing progress={progress} active={isListening} completed={justCompleted} />
            </Pressable>

            <View style={{ height: S.md }} />

            <Text style={styles.voiceHint}>{hint}</Text>

            <View style={{ height: S.sm }} />

            <View style={styles.repRow} accessibilityLabel={`${repCount} of ${REQUIRED_REPETITIONS} repetitions completed`}>
              {Array.from({ length: REQUIRED_REPETITIONS }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.repDot, i < repCount ? styles.repDotFilled : styles.repDotEmpty]}
                />
              ))}
            </View>
          </View>
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
  streakBadge: {
    top: S.lg + S.md,
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

  // -- speak-to-affirm --
  voiceWrap: {
    marginTop: S.xl,
    alignItems: 'center',
  },
  voiceHint: {
    fontFamily: TYPE.secondary.fontFamily,
    fontSize: 13,
    color: COLORS.fgSecondary,
    letterSpacing: 0.3,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  repDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  repDotEmpty: {
    backgroundColor: 'transparent',
  },
  repDotFilled: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
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

  // -- navigation --
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: S.md,
    paddingBottom: S.lg,
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  navCenter: {
    alignItems: 'center',
    gap: S.xs,
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
