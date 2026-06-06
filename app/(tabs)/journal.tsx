import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SCREEN_PADDING,
  PRESS,
  GLOW,
} from '../../src/constants/theme';
import { JOURNAL_PROMPTS, JournalPrompt } from '../../src/data/journal-prompts';
import Card from '../../src/components/Card';
import GradientBackground from '../../src/components/GradientBackground';
import { useIdentity, JournalEntry } from '../../src/hooks/useIdentity';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Category styling -- color + icon per category
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  JournalPrompt['category'],
  { color: string; icon: string }
> = {
  identity: { color: COLORS.primary, icon: 'person-outline' },
  beliefs: { color: COLORS.accent, icon: 'bulb-outline' },
  systems: { color: COLORS.success, icon: 'sync-outline' },
  actions: { color: COLORS.secondary, icon: 'footsteps-outline' },
  reflection: { color: COLORS.accent, icon: 'eye-outline' },
};

// ---------------------------------------------------------------------------
// Journal Screen
// ---------------------------------------------------------------------------

export default function JournalScreen() {
  const { saveJournalEntry, getJournalEntries } = useIdentity();

  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt>(
    () => getDailyItem(JOURNAL_PROMPTS),
  );
  const [entryText, setEntryText] = useState('');
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [entryCounter, setEntryCounter] = useState(0);

  // Animated values for press feedback
  const saveScale = React.useRef(new Animated.Value(1)).current;
  const newPromptScale = React.useRef(new Animated.Value(1)).current;

  // Load past entries on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const entries = await getJournalEntries();
      if (mounted) {
        setPastEntries(entries);
        setEntryCounter(entries.length);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getJournalEntries]);

  // Press animation helpers
  const animatePressIn = useCallback((anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: PRESS.scale,
      ...PRESS.springConfig,
    }).start();
  }, []);

  const animatePressOut = useCallback((anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      ...PRESS.springConfig,
    }).start();
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    const trimmed = entryText.trim();
    if (!trimmed) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    setSaving(true);
    try {
      const newEntry: JournalEntry = {
        id: String(entryCounter + 1),
        date: new Date().toISOString(),
        promptId: currentPrompt.id,
        response: trimmed,
      };

      await saveJournalEntry(newEntry);

      // Update local state
      setPastEntries((prev) => [...prev, newEntry]);
      setEntryCounter((prev) => prev + 1);
      setEntryText('');
      Alert.alert('Saved', 'Your journal entry has been saved.');
    } catch {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [entryText, entryCounter, currentPrompt.id, saveJournalEntry]);

  // New prompt handler
  const handleNewPrompt = useCallback(() => {
    let next = getRandomItem(JOURNAL_PROMPTS);
    // Avoid showing the same prompt twice in a row
    while (next.id === currentPrompt.id && JOURNAL_PROMPTS.length > 1) {
      next = getRandomItem(JOURNAL_PROMPTS);
    }
    setCurrentPrompt(next);
  }, [currentPrompt.id]);

  // Recent 3 entries, newest first
  const recentEntries = pastEntries.slice(-3).reverse();

  // Find prompt text for a past entry
  const getPromptText = useCallback((promptId: number): string => {
    const found = JOURNAL_PROMPTS.find((p) => p.id === promptId);
    return found ? found.prompt : '';
  }, []);

  // Format date for display
  const formatDate = useCallback((iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const categoryMeta = CATEGORY_META[currentPrompt.category];

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Title ─────────────────────────────────────── */}
        <Text style={styles.title}>Journal</Text>

        {/* ── Today's Prompt Card ──────────────────────── */}
        <Card variant="default" style={styles.promptCard}>
          {/* Category Pill */}
          <View
            style={[
              styles.categoryPill,
              { backgroundColor: categoryMeta.color + '22' },
              { borderColor: categoryMeta.color + '44' },
            ]}
          >
            <Ionicons
              name={categoryMeta.icon as any}
              size={14}
              color={categoryMeta.color}
              style={styles.categoryPillIcon}
            />
            <Text style={[styles.categoryPillText, { color: categoryMeta.color }]}>
              {currentPrompt.category.charAt(0).toUpperCase() +
                currentPrompt.category.slice(1)}
            </Text>
          </View>

          {/* Prompt Icon */}
          <View style={styles.promptIconRow}>
            <View style={styles.promptIconCircle}>
              <Ionicons
                name={currentPrompt.icon as any}
                size={28}
                color={COLORS.accent}
              />
            </View>
          </View>

          {/* Prompt Text */}
          <Text style={styles.promptText}>{currentPrompt.prompt}</Text>

          {/* Follow Up */}
          {currentPrompt.followUp ? (
            <Text style={styles.followUpText}>{currentPrompt.followUp}</Text>
          ) : null}
        </Card>

        {/* ── Text Input ───────────────────────────────── */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Write your thoughts here..."
            placeholderTextColor={COLORS.foregroundMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={entryText}
            onChangeText={setEntryText}
          />
        </View>

        {/* ── Action Row ───────────────────────────────── */}
        <View style={styles.actionRow}>
          {/* Save Entry Button */}
          <Pressable
            onPressIn={() => animatePressIn(saveScale)}
            onPressOut={() => animatePressOut(saveScale)}
            onPress={handleSave}
            disabled={saving}
          >
            <Animated.View
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
                { transform: [{ scale: saveScale }] },
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={20}
                color="#FFFFFF"
                style={styles.saveButtonIcon}
              />
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Entry'}
              </Text>
            </Animated.View>
          </Pressable>

          {/* New Prompt Button */}
          <Pressable
            onPressIn={() => animatePressIn(newPromptScale)}
            onPressOut={() => animatePressOut(newPromptScale)}
            onPress={handleNewPrompt}
          >
            <Animated.View
              style={[
                styles.newPromptButton,
                { transform: [{ scale: newPromptScale }] },
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={COLORS.foregroundMuted}
                style={styles.newPromptIcon}
              />
              <Text style={styles.newPromptButtonText}>New Prompt</Text>
            </Animated.View>
          </Pressable>
        </View>

        {/* ── Past Entries ─────────────────────────────── */}
        {recentEntries.length > 0 ? (
          <View style={styles.pastSection}>
            <Text style={styles.pastSectionLabel}>Recent Entries</Text>
            {recentEntries.map((entry) => (
              <Card key={entry.id} variant="default" style={styles.pastCard}>
                <View style={styles.pastCardHeader}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={COLORS.foregroundMuted}
                    style={styles.pastDateIcon}
                  />
                  <Text style={styles.pastDate}>{formatDate(entry.date)}</Text>
                </View>
                <Text style={styles.pastPrompt} numberOfLines={1}>
                  {getPromptText(entry.promptId)}
                </Text>
                <Text style={styles.pastPreview} numberOfLines={2}>
                  {entry.response}
                </Text>
              </Card>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },

  // ── Title ──────────────────────────────────────────────────
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.lg,
    letterSpacing: 0.5,
  },

  // ── Prompt Card ────────────────────────────────────────────
  promptCard: {
    marginBottom: SPACING.lg,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.md,
  },
  categoryPillIcon: {
    marginRight: SPACING.xs,
  },
  categoryPillText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  promptIconRow: {
    marginBottom: SPACING.sm + 4,
  },
  promptIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212,165,116,0.25)',
  },
  promptText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: 20,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
    lineHeight: 20 * TYPOGRAPHY.lineHeights.normal,
    marginBottom: SPACING.sm,
  },
  followUpText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    fontStyle: 'italic',
  },

  // ── Text Input ─────────────────────────────────────────────
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  textInput: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.md * TYPOGRAPHY.lineHeights.relaxed,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    minHeight: 160,
  },

  // ── Action Row ─────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 4,
    marginBottom: SPACING.xl,
  },

  // Save button -- primary CTA with purple glow
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    ...GLOW.primaryGlow,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonIcon: {
    marginRight: SPACING.sm,
  },
  saveButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FFFFFF',
  },

  // New prompt button -- subtle card style
  newPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  newPromptIcon: {
    marginRight: SPACING.sm,
  },
  newPromptButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },

  // ── Past Entries ───────────────────────────────────────────
  pastSection: {
    marginBottom: SPACING.lg,
  },
  pastSectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foregroundMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  pastCard: {
    marginBottom: SPACING.sm + 4,
    padding: SPACING.md,
  },
  pastCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  pastDateIcon: {
    marginRight: SPACING.xs,
  },
  pastDate: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.foregroundMuted,
  },
  pastPrompt: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
    marginBottom: SPACING.xs,
  },
  pastPreview: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.foregroundMuted,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.normal,
  },
});
