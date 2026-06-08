import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../src/components/GradientBackground';
import { COLORS, RADIUS, S, TYPE } from '../src/constants/theme';
import { useIdentity, JournalEntry } from '../src/hooks/useIdentity';
import { JOURNAL_PROMPTS } from '../src/data/journal-prompts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_SPACING = SCREEN_WIDTH * 0.58;
const SWIPE_THRESHOLD = CARD_SPACING * 0.32;

// Warm parchment palette — the card reads as a taped-in keepsake page rather
// than another dark surface, so it stands out against the night-sky backdrop.
const PAPER = '#F6EEE1';
const INK = '#4A3B2A';
const INK_SOFT = 'rgba(74,59,42,0.62)';

const PHOTO_THEMES = [
  { gradient: ['#E3C397', '#A9824F'] as [string, string], tape: 'rgba(201,168,124,0.6)', stickerBg: COLORS.accentSoft, stickerBorder: COLORS.accentBorder, stickerTint: COLORS.accent },
  { gradient: ['#C2B3DE', '#7C6AAE'] as [string, string], tape: 'rgba(107,91,149,0.55)', stickerBg: COLORS.purpleSoft, stickerBorder: COLORS.purpleBorder, stickerTint: COLORS.purple },
  { gradient: ['#AAD6BE', '#5C9479'] as [string, string], tape: 'rgba(107,175,141,0.5)', stickerBg: 'rgba(107,175,141,0.12)', stickerBorder: 'rgba(107,175,141,0.25)', stickerTint: COLORS.success },
];

const POLAROID_TILTS = ['-5deg', '4deg', '-3deg', '6deg'];
const STICKER_ICONS: Array<keyof typeof Ionicons.glyphMap> = ['star', 'heart', 'sparkles', 'flower'];

function formatStamp(iso: string): { date: string; time: string; weekday: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
  };
}

interface PolaroidCardProps {
  entry: JournalEntry;
  themeIndex: number;
  centered: boolean;
  cardStyle: Animated.WithAnimatedValue<ViewStyle>;
  onToggleFavorite: (id: string) => void;
}

// A single journal entry rendered as a taped-in polaroid + handwritten note —
// the snapshot anchors the memory, the annotations (tape, sticker, scrawled
// caption) make it feel kept rather than merely stored.
function PolaroidCard({ entry, themeIndex, centered, cardStyle, onToggleFavorite }: PolaroidCardProps) {
  const prompt = JOURNAL_PROMPTS.find((p) => p.id === entry.promptId);
  const theme = PHOTO_THEMES[themeIndex % PHOTO_THEMES.length];
  const tilt = POLAROID_TILTS[themeIndex % POLAROID_TILTS.length];
  const sticker = STICKER_ICONS[themeIndex % STICKER_ICONS.length];
  const { date, time, weekday } = formatStamp(entry.date);
  const extraImages = entry.images?.slice(1) ?? [];

  return (
    <Animated.View style={[styles.card, cardStyle]} pointerEvents={centered ? 'auto' : 'none'}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={centered}
      >
        <View style={styles.snapshotRow}>
          <View style={[styles.polaroid, { transform: [{ rotate: tilt }] }]}>
            <View style={[styles.washiTape, { backgroundColor: theme.tape }]} />
            <Pressable
              onPress={() => onToggleFavorite(entry.id)}
              style={styles.favoriteButton}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={entry.favorite ? 'remove from favorites' : 'mark as favorite'}
            >
              <Ionicons
                name={entry.favorite ? 'star' : 'star-outline'}
                size={15}
                color={entry.favorite ? '#D7A53D' : INK_SOFT}
              />
            </Pressable>
            <View style={styles.polaroidPhoto}>
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {entry.images?.[0] ? (
                <Image source={{ uri: entry.images[0].uri }} style={StyleSheet.absoluteFill} />
              ) : (
                prompt && <Ionicons name={prompt.icon as keyof typeof Ionicons.glyphMap} size={38} color="rgba(255,255,255,0.92)" />
              )}
            </View>
            <Text style={styles.polaroidCaption} numberOfLines={1}>{weekday}, {date}</Text>
          </View>

          <View style={styles.headNote}>
            {prompt && (
              <View style={styles.categoryRow}>
                <Ionicons name={prompt.icon as keyof typeof Ionicons.glyphMap} size={13} color={INK_SOFT} />
                <Text style={styles.category}>{prompt.category}</Text>
              </View>
            )}
            {prompt && <Text style={styles.promptText}>{prompt.prompt}</Text>}
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={12} color={INK_SOFT} />
              <Text style={styles.timeText}>{time}</Text>
              {!!entry.location && (
                <>
                  <Text style={styles.timeText}> · </Text>
                  <Ionicons name="location-outline" size={12} color={INK_SOFT} />
                  <Text style={styles.timeText} numberOfLines={1}>{entry.location}</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.sticker, { backgroundColor: theme.stickerBg, borderColor: theme.stickerBorder }]}>
            <Ionicons name={sticker} size={15} color={theme.stickerTint} />
          </View>
        </View>

        <View style={styles.scrawlDivider}>
          <View style={[styles.scrawlDot, { backgroundColor: theme.stickerTint }]} />
          <View style={styles.scrawlLine} />
        </View>

        <Text style={styles.responseText}>{entry.response}</Text>

        {!!extraImages.length && (
          <View style={styles.collage}>
            {extraImages.map((img, i) => (
              <Image
                key={img.uri + i}
                source={{ uri: img.uri }}
                style={[
                  styles.collageThumb,
                  {
                    transform: [{ rotate: POLAROID_TILTS[(themeIndex + i + 1) % POLAROID_TILTS.length] }],
                    marginLeft: i === 0 ? 0 : -S.lg,
                    zIndex: extraImages.length - i,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {!!entry.files?.length && (
          <View style={styles.fileList}>
            {entry.files.map((file, i) => (
              <View key={file.uri + i} style={[styles.fileChip, { borderColor: theme.tape }]}>
                <Ionicons name="document-attach-outline" size={14} color={INK_SOFT} />
                <Text style={styles.fileChipText} numberOfLines={1}>{file.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

export default function JournalEntriesScreen() {
  const router = useRouter();
  const { getJournalEntries, toggleJournalEntryFavorite } = useIdentity();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [index, setIndex] = useState(0);

  const translateX = useRef(new Animated.Value(0)).current;
  const wheelLocked = useRef(false);

  useEffect(() => {
    let mounted = true;
    getJournalEntries().then((stored) => {
      if (!mounted) return;
      setEntries([...stored].reverse());
    });
    return () => { mounted = false; };
  }, [getJournalEntries]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true },
  );

  const settle = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 16,
      bounciness: 8,
    }).start();
  };

  // Slides the whole stack by one card-width so the neighbour glides into the
  // centre, then shifts `index` and resets the offset — at that instant the
  // new centre card sits at offset 0, exactly where it visually ended up, so
  // the swap is invisible and the stack feels continuous.
  const shiftTo = (delta: 1 | -1) => {
    Animated.timing(translateX, {
      toValue: -delta * CARD_SPACING,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      setIndex((current) => current + delta);
    });
  };

  // Trackpad/mouse-wheel horizontal swipes — on web, swiping with a trackpad
  // fires wheel events (deltaX) rather than pointer drags, and
  // PanGestureHandler only listens for the latter, so without this the
  // gesture silently does nothing for anyone browsing on a laptop.
  const handleWheel = (event: any) => {
    if (Platform.OS !== 'web' || !entries || wheelLocked.current) return;
    const deltaX = event?.deltaX ?? event?.nativeEvent?.deltaX ?? 0;
    const deltaY = event?.deltaY ?? event?.nativeEvent?.deltaY ?? 0;
    if (Math.abs(deltaX) < 18 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX > 0 && index < entries.length - 1) {
      wheelLocked.current = true;
      shiftTo(1);
    } else if (deltaX < 0 && index > 0) {
      wheelLocked.current = true;
      shiftTo(-1);
    } else {
      return;
    }
    setTimeout(() => { wheelLocked.current = false; }, 380);
  };

  const handleToggleFavorite = (id: string) => {
    toggleJournalEntryFavorite(id).then((updated) => setEntries([...updated].reverse()));
  };

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState !== State.ACTIVE || !entries) return;

    const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;

    // On the browser, a one-finger drag rarely stays perfectly horizontal —
    // and a vertical drag/flick reads just as naturally as "swipe to browse"
    // there (scrolling a card's own text uses the wheel/trackpad-scroll
    // channel instead, so the two don't fight). Native devices keep the
    // original horizontal-only gesture, where vertical drags are yielded to
    // the card's ScrollView via `failOffsetY`.
    const useVertical = Platform.OS === 'web' && Math.abs(translationY) > Math.abs(translationX);

    const forward = useVertical
      ? translationY < -SWIPE_THRESHOLD || velocityY < -800
      : translationX < -SWIPE_THRESHOLD || velocityX < -800;
    const backward = useVertical
      ? translationY > SWIPE_THRESHOLD || velocityY > 800
      : translationX > SWIPE_THRESHOLD || velocityX > 800;

    if (forward && index < entries.length - 1) {
      shiftTo(1);
    } else if (backward && index > 0) {
      shiftTo(-1);
    } else {
      settle();
    }
  };

  // Each visible card sits `relativeIndex * CARD_SPACING` away from centre at
  // rest; adding the live drag offset gives its continuous on-screen position,
  // which we then derive scale/opacity/tilt from for a smooth carousel feel.
  const cardStyleFor = (relativeIndex: -1 | 0 | 1): Animated.WithAnimatedValue<ViewStyle> => {
    const position = Animated.add(translateX, relativeIndex * CARD_SPACING);
    const scale = position.interpolate({
      inputRange: [-CARD_SPACING, 0, CARD_SPACING],
      outputRange: [0.82, 1, 0.82],
      extrapolate: 'clamp',
    });
    const rotate = position.interpolate({
      inputRange: [-CARD_SPACING, 0, CARD_SPACING],
      outputRange: ['-6deg', '0deg', '6deg'],
      extrapolate: 'clamp',
    });
    const opacity = position.interpolate({
      inputRange: [-CARD_SPACING, 0, CARD_SPACING],
      outputRange: [0.4, 1, 0.4],
      extrapolate: 'clamp',
    });
    return {
      transform: [{ translateX: position }, { scale }, { rotate }],
      opacity,
      zIndex: 10 - Math.abs(relativeIndex),
    } as Animated.WithAnimatedValue<ViewStyle>;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="go back">
        <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
      </Pressable>
      <Text style={styles.title}>previous entries</Text>
      <View style={styles.backButton} />
    </View>
  );

  let body: React.ReactNode;
  if (entries === null) {
    body = null;
  } else if (entries.length === 0) {
    body = (
      <View style={styles.empty}>
        <Ionicons name="journal-outline" size={40} color={COLORS.fgSecondary} />
        <Text style={styles.emptyText}>no entries yet — your reflections will gather here.</Text>
      </View>
    );
  } else {
    const slots: Array<{ relativeIndex: -1 | 0 | 1; entry: JournalEntry }> = (
      [-1, 0, 1] as const
    )
      .map((relativeIndex) => ({ relativeIndex, entry: entries[index + relativeIndex] }))
      .filter((slot): slot is { relativeIndex: -1 | 0 | 1; entry: JournalEntry } => !!slot.entry);

    body = (
      <View style={styles.stage}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          activeOffsetX={[-10, 10]}
          {...(Platform.OS === 'web'
            ? { activeOffsetY: [-10, 10] as [number, number] }
            : { failOffsetY: [-16, 16] as [number, number] })}
        >
          <Animated.View style={styles.deck} {...(Platform.OS === 'web' ? { onWheel: handleWheel } : null)}>
            {slots.map(({ relativeIndex, entry }) => (
              <PolaroidCard
                key={entry.id}
                entry={entry}
                themeIndex={index + relativeIndex}
                centered={relativeIndex === 0}
                cardStyle={cardStyleFor(relativeIndex)}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </Animated.View>
        </PanGestureHandler>
        <Text style={styles.hint}>swipe to browse the stack · {index + 1} / {entries.length}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GradientBackground>
        {renderHeader()}
        {body}
      </GradientBackground>
    </GestureHandlerRootView>
  );
}

const CARD_HEIGHT = 460;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: S.sm,
    paddingBottom: S.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  title: {
    ...TYPE.heading,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deck: {
    width: '100%',
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    backgroundColor: PAPER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  page: {
    flex: 1,
  },
  pageContent: {
    padding: S.lg,
    paddingTop: S.xl,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.md,
  },
  polaroid: {
    width: 104,
    backgroundColor: '#FFFDF8',
    borderRadius: RADIUS.sm,
    padding: 6,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  washiTape: {
    position: 'absolute',
    top: -9,
    left: 18,
    width: 56,
    height: 22,
    borderRadius: 3,
    transform: [{ rotate: '-7deg' }],
  },
  polaroidPhoto: {
    width: '100%',
    height: 92,
    borderRadius: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHover,
  },
  polaroidCaption: {
    ...TYPE.heading,
    fontSize: 10,
    fontStyle: 'italic',
    color: INK_SOFT,
    marginTop: 6,
    textAlign: 'center',
  },
  headNote: {
    flex: 1,
    paddingTop: S.xs,
    gap: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  category: {
    ...TYPE.heading,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: INK_SOFT,
  },
  promptText: {
    ...TYPE.heading,
    fontSize: 16,
    lineHeight: 22,
    fontStyle: 'italic',
    color: INK,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  timeText: {
    ...TYPE.secondary,
    fontSize: 11,
    color: INK_SOFT,
  },
  favoriteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 26,
    height: 26,
    zIndex: 5,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDF8',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(74,59,42,0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
    transform: [{ rotate: '14deg' }],
  },
  sticker: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '12deg' }],
  },
  scrawlDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginTop: S.lg,
    marginBottom: S.sm,
  },
  scrawlDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  scrawlLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(74,59,42,0.18)',
  },
  responseText: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 24,
    color: INK,
  },
  collage: {
    flexDirection: 'row',
    marginTop: S.lg,
    paddingLeft: S.sm,
  },
  collageThumb: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 3,
    borderColor: PAPER,
    backgroundColor: COLORS.surfaceHover,
  },
  fileList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.xs,
    marginTop: S.md,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    maxWidth: 160,
    paddingVertical: 6,
    paddingHorizontal: S.sm,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(74,59,42,0.06)',
  },
  fileChipText: {
    ...TYPE.secondary,
    fontSize: 12,
    color: INK_SOFT,
  },
  hint: {
    ...TYPE.secondary,
    position: 'absolute',
    bottom: S.xl,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.md,
    paddingHorizontal: S.xl,
  },
  emptyText: {
    ...TYPE.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});
