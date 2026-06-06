import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { COLORS, TYPE, S, SCREEN_PADDING } from '../../src/constants/theme';
import { JOURNAL_PROMPTS, JournalPrompt } from '../../src/data/journal-prompts';
import GradientBackground from '../../src/components/GradientBackground';
import { useIdentity, JournalEntry } from '../../src/hooks/useIdentity';
import { getDailyItem, getRandomItem } from '../../src/utils/shuffle';

export default function JournalScreen() {
  const { saveJournalEntry, getJournalEntries } = useIdentity();

  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt>(
    () => getDailyItem(JOURNAL_PROMPTS),
  );
  const [entryText, setEntryText] = useState('');
  const [pastEntries, setPastEntries] = useState<JournalEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [entryCounter, setEntryCounter] = useState(0);

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

  const handleSave = useCallback(async () => {
    const trimmed = entryText.trim();
    if (!trimmed) {
      Alert.alert('empty entry', 'please write something before saving.');
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

      setPastEntries((prev) => [...prev, newEntry]);
      setEntryCounter((prev) => prev + 1);
      setEntryText('');
      Alert.alert('saved', 'your journal entry has been saved.');
    } catch {
      Alert.alert('error', 'failed to save entry. please try again.');
    } finally {
      setSaving(false);
    }
  }, [entryText, entryCounter, currentPrompt.id, saveJournalEntry]);

  const handleNewPrompt = useCallback(() => {
    let next = getRandomItem(JOURNAL_PROMPTS);
    while (next.id === currentPrompt.id && JOURNAL_PROMPTS.length > 1) {
      next = getRandomItem(JOURNAL_PROMPTS);
    }
    setCurrentPrompt(next);
  }, [currentPrompt.id]);

  const recentEntries = pastEntries.slice(-3).reverse();

  const formatDate = useCallback((iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toLowerCase();
  }, []);

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* prompt section */}
        <View>
          <Text style={styles.categoryLabel}>
            {currentPrompt.category}
          </Text>
          <View style={{ height: S.sm }} />
          <Text style={styles.promptText}>
            {currentPrompt.prompt}
          </Text>
          {currentPrompt.followUp ? (
            <>
              <View style={{ height: S.sm }} />
              <Text style={styles.followUpText}>
                {currentPrompt.followUp}
              </Text>
            </>
          ) : null}
        </View>

        {/* 40px gap */}
        <View style={{ height: S.xl }} />

        {/* text input */}
        <TextInput
          style={styles.textInput}
          placeholder="write..."
          placeholderTextColor={COLORS.muted}
          multiline
          textAlignVertical="top"
          value={entryText}
          onChangeText={setEntryText}
        />

        {/* 24px gap */}
        <View style={{ height: S.lg }} />

        {/* action links */}
        {entryText.length > 0 ? (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            hitSlop={12}
          >
            <Text style={[styles.saveLink, saving && { opacity: 0.4 }]}>
              {saving ? 'saving...' : 'save'}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ height: S.sm }} />

        <Pressable onPress={handleNewPrompt} hitSlop={12}>
          <Text style={styles.newPromptLink}>new prompt</Text>
        </Pressable>

        {/* 64px gap */}
        <View style={{ height: S.xxl }} />

        {/* recent entries */}
        {recentEntries.length > 0 ? (
          <View>
            <View style={styles.rule} />
            {recentEntries.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 && <View style={{ height: S.lg }} />}
                <Text style={styles.entryDate}>
                  {formatDate(entry.date)}
                </Text>
                <Text style={styles.entryPreview} numberOfLines={2}>
                  {entry.response}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: S.lg,
    paddingBottom: S.huge,
  },

  categoryLabel: {
    ...TYPE.muted,
    fontSize: 11,
    fontStyle: 'italic',
  },

  promptText: {
    ...TYPE.heading,
    fontSize: 20,
    lineHeight: 32,
  },

  followUpText: {
    ...TYPE.muted,
    fontSize: 14,
    fontStyle: 'italic',
  },

  textInput: {
    ...TYPE.body,
    fontSize: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    minHeight: 160,
    paddingBottom: S.md,
  },

  saveLink: {
    ...TYPE.accent,
    fontSize: 14,
    minHeight: 44,
  },

  newPromptLink: {
    ...TYPE.muted,
    fontSize: 14,
    textDecorationLine: 'underline',
    minHeight: 44,
  },

  rule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    marginBottom: S.lg,
  },

  entryDate: {
    ...TYPE.muted,
    fontSize: 11,
    marginBottom: S.xs,
  },

  entryPreview: {
    ...TYPE.body,
    fontSize: 14,
  },
});
