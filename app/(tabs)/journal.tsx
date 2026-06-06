import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS, SCREEN_PADDING } from '../../src/constants/theme';
import { JOURNAL_PROMPTS, JournalPrompt } from '../../src/data/journal-prompts';
import GradientBackground from '../../src/components/GradientBackground';
import NeumorphicCard from '../../src/components/NeumorphicCard';
import { useIdentity, JournalEntry } from '../../src/hooks/useIdentity';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

// ---------------------------------------------------------------------------
// Category tag color mapping
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<JournalPrompt['category'], string> = {
  identity: COLORS.primary,
  beliefs: '#A855F7',
  systems: '#0EA5E9',
  actions: COLORS.accent,
  reflection: '#F59E0B',
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
        <NeumorphicCard style={styles.promptCard}>
          {/* Category Tag */}
          <View
            style={[
              styles.categoryTag,
              { backgroundColor: CATEGORY_COLORS[currentPrompt.category] },
            ]}
          >
            <Text style={styles.categoryTagText}>
              {currentPrompt.category.charAt(0).toUpperCase() +
                currentPrompt.category.slice(1)}
            </Text>
          </View>

          {/* Icon */}
          <View style={styles.promptIconRow}>
            <Ionicons
              name={currentPrompt.icon as any}
              size={28}
              color={COLORS.primary}
            />
          </View>

          {/* Prompt Text */}
          <Text style={styles.promptText}>{currentPrompt.prompt}</Text>

          {/* Follow Up */}
          {currentPrompt.followUp ? (
            <Text style={styles.followUpText}>{currentPrompt.followUp}</Text>
          ) : null}
        </NeumorphicCard>

        {/* ── Text Input ───────────────────────────────── */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Write your thoughts here..."
            placeholderTextColor={COLORS.border}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={entryText}
            onChangeText={setEntryText}
          />
        </View>

        {/* ── Save Button ──────────────────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
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
        </Pressable>

        {/* ── Get New Prompt ───────────────────────────── */}
        <Pressable
          style={({ pressed }) => [
            styles.newPromptButton,
            pressed && styles.newPromptButtonPressed,
          ]}
          onPress={handleNewPrompt}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={COLORS.primary}
            style={styles.newPromptIcon}
          />
          <Text style={styles.newPromptButtonText}>Get New Prompt</Text>
        </Pressable>

        {/* ── Past Entries ─────────────────────────────── */}
        {recentEntries.length > 0 ? (
          <View style={styles.pastSection}>
            <Text style={styles.pastTitle}>Past Entries</Text>
            {recentEntries.map((entry) => (
              <NeumorphicCard key={entry.id} style={styles.pastCard}>
                <Text style={styles.pastDate}>{formatDate(entry.date)}</Text>
                <Text style={styles.pastPrompt} numberOfLines={1}>
                  {getPromptText(entry.promptId)}
                </Text>
                <Text style={styles.pastPreview} numberOfLines={2}>
                  {entry.response}
                </Text>
              </NeumorphicCard>
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

  // Title
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes['2xl'],
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.lg,
  },

  // Prompt card
  promptCard: {
    marginBottom: SPACING.lg,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  categoryTagText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  promptIconRow: {
    marginBottom: SPACING.sm,
  },
  promptText: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.foreground,
    lineHeight: TYPOGRAPHY.sizes.lg * TYPOGRAPHY.lineHeights.normal,
    marginBottom: SPACING.sm,
  },
  followUpText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.secondary,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.relaxed,
    fontStyle: 'italic',
  },

  // Text input -- neumorphic inset
  inputWrapper: {
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    // Inset shadow effect
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
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

  // Save button
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    marginBottom: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonPressed: {
    opacity: 0.85,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
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

  // New prompt button
  newPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.muted,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
    marginBottom: SPACING.xl,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  newPromptButtonPressed: {
    opacity: 0.85,
  },
  newPromptIcon: {
    marginRight: SPACING.sm,
  },
  newPromptButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },

  // Past entries section
  pastSection: {
    marginBottom: SPACING.lg,
  },
  pastTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.heading,
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.foreground,
    marginBottom: SPACING.md,
  },
  pastCard: {
    marginBottom: SPACING.sm + 4,
  },
  pastDate: {
    fontFamily: TYPOGRAPHY.fontFamily.body,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
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
    color: COLORS.foreground,
    opacity: 0.7,
    lineHeight: TYPOGRAPHY.sizes.base * TYPOGRAPHY.lineHeights.normal,
  },
});
