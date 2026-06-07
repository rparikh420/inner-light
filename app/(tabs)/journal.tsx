import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, TYPE, S, SCREEN_PADDING, SURFACE, BUTTON, RADIUS } from '../../src/constants/theme';
import { JOURNAL_PROMPTS, JournalPrompt } from '../../src/data/journal-prompts';
import GradientBackground from '../../src/components/GradientBackground';
import { useIdentity, JournalEntry } from '../../src/hooks/useIdentity';
import { useSpeechToText } from '../../src/hooks/useSpeechToText';
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

  // -- voice journaling: dictate the entry instead of typing it --
  const speech = useSpeechToText();
  const dictationBaseRef = useRef('');
  const lastCommittedSeqRef = useRef(0);

  const handleToggleDictation = useCallback(async () => {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    dictationBaseRef.current = entryText;
    lastCommittedSeqRef.current = speech.resultSeq;
    await speech.start({ continuous: true, interimResults: true });
  }, [speech, entryText]);

  // Live-merge the dictated speech into the entry as it's heard.
  // Final results are committed into the running base exactly once — keyed off
  // resultSeq rather than the transcript text, since repeating the same phrase
  // produces an identical string that React would otherwise dedupe away.
  // Interim results are shown as a live preview on top of that base.
  useEffect(() => {
    if (speech.transcript && speech.resultSeq !== lastCommittedSeqRef.current) {
      lastCommittedSeqRef.current = speech.resultSeq;
      const base = dictationBaseRef.current;
      const merged = base ? `${base} ${speech.transcript}` : speech.transcript;
      dictationBaseRef.current = merged;
      setEntryText(merged);
      return;
    }

    if (speech.interimTranscript) {
      const base = dictationBaseRef.current;
      setEntryText(base ? `${base} ${speech.interimTranscript}` : speech.interimTranscript);
    }
  }, [speech.transcript, speech.interimTranscript, speech.resultSeq]);

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
        <View style={SURFACE.card}>
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
          placeholderTextColor={COLORS.fgSecondary}
          multiline
          textAlignVertical="top"
          value={entryText}
          onChangeText={setEntryText}
        />

        {/* 12px gap */}
        <View style={{ height: S.sm }} />

        {/* voice journaling */}
        <Pressable
          onPress={handleToggleDictation}
          style={[styles.dictateButton, speech.isListening && styles.dictateButtonActive]}
          accessibilityRole="button"
          accessibilityLabel={speech.isListening ? 'Stop voice journaling' : 'Speak your journal entry'}
        >
          {speech.isListening && <View style={styles.recordingDot} />}
          <Ionicons
            name={speech.isListening ? 'mic' : 'mic-outline'}
            size={16}
            color={speech.isListening ? COLORS.accent : COLORS.fgSecondary}
          />
          <Text style={[styles.dictateButtonText, speech.isListening && styles.dictateButtonTextActive]}>
            {speech.isListening ? 'listening… tap to stop' : 'speak your entry'}
          </Text>
        </Pressable>

        {speech.error ? (
          <>
            <View style={{ height: S.xs }} />
            <Text style={styles.dictateError}>{speech.error}</Text>
          </>
        ) : null}

        {/* 24px gap */}
        <View style={{ height: S.lg }} />

        {/* action buttons */}
        {entryText.length > 0 ? (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={[BUTTON.primary, saving && { opacity: 0.4 }]}
          >
            <Text style={BUTTON.primaryText}>
              {saving ? 'saving...' : 'save'}
            </Text>
          </Pressable>
        ) : null}

        <View style={{ height: S.sm }} />

        <Pressable onPress={handleNewPrompt} style={BUTTON.ghost}>
          <Text style={BUTTON.ghostText}>new prompt</Text>
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
    ...TYPE.secondary,
    fontSize: 11,
    fontStyle: 'italic',
  },

  promptText: {
    ...TYPE.heading,
    fontSize: 20,
    lineHeight: 32,
  },

  followUpText: {
    ...TYPE.secondary,
    fontSize: 14,
    fontStyle: 'italic',
  },

  textInput: {
    ...TYPE.body,
    fontSize: 16,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: 12,
    minHeight: 160,
    padding: S.md,
  },

  dictateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: S.md,
    minHeight: 40,
  },
  dictateButtonActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  recordingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  dictateButtonText: {
    ...TYPE.secondary,
    fontSize: 13,
  },
  dictateButtonTextActive: {
    color: COLORS.accent,
  },
  dictateError: {
    ...TYPE.secondary,
    fontSize: 12,
    color: COLORS.danger,
  },

  rule: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    marginBottom: S.lg,
  },

  entryDate: {
    ...TYPE.secondary,
    fontSize: 11,
    marginBottom: S.xs,
  },

  entryPreview: {
    ...TYPE.body,
    fontSize: 14,
  },
});
