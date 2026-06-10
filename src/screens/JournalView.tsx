import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, TYPE, S, SCREEN_PADDING, SURFACE, BUTTON, RADIUS } from '../constants/theme';
import { JOURNAL_PROMPTS, JournalPrompt } from '../data/journal-prompts';
import GradientBackground from '../components/GradientBackground';
import {
  useIdentity,
  JournalEntry,
  JournalAttachmentImage,
  JournalAttachmentFile,
} from '../hooks/useIdentity';
import { useSpeechToText } from '../hooks/useSpeechToText';
import VoiceWave from '../components/VoiceWave';
import JellyButton from '../components/JellyButton';
import StreakBadge from '../components/StreakBadge';
import { WORLD_NAMES } from '../data/world-names';
import { correctNamesInTranscript } from '../utils/nameCorrection';
import { getCurrentLocationLabel } from '../utils/location';
import { getDailyItem, getRandomItem } from '../utils/shuffle';

const MAX_IMAGES = 6;
const MAX_FILES = 4;

export default function JournalView() {
  const { identity, saveJournalEntry, getJournalEntries, getStreak, incrementStreak } = useIdentity();
  const router = useRouter();

  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt>(
    () => getDailyItem(JOURNAL_PROMPTS),
  );
  const [entryText, setEntryText] = useState('');
  const [images, setImages] = useState<JournalAttachmentImage[]>([]);
  const [files, setFiles] = useState<JournalAttachmentFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [entryCounter, setEntryCounter] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let mounted = true;
    getStreak().then((value) => { if (mounted) setStreak(value); });
    return () => { mounted = false; };
  }, [getStreak]);

  // -- voice journaling: dictate the entry instead of typing it --
  const speech = useSpeechToText();
  const dictationBaseRef = useRef('');
  const lastCommittedSeqRef = useRef(0);

  // Bias the recognizer's vocabulary toward names so a spoken entry that
  // mentions someone — especially the person's own name, which the
  // recognizer would otherwise have no reason to expect — is more likely to
  // be transcribed as the name rather than the nearest English-sounding word.
  // The user's own name (and each of its parts) is given priority by being
  // listed first.
  const nameContextualStrings = useMemo(() => {
    const ownNameParts = (identity?.name ?? '').split(/\s+/).filter(Boolean);
    return Array.from(new Set([...ownNameParts, identity?.name, ...WORLD_NAMES].filter((n): n is string => !!n)));
  }, [identity?.name]);

  const handleToggleDictation = useCallback(async () => {
    if (speech.isListening) {
      speech.stop();
      return;
    }
    dictationBaseRef.current = entryText;
    lastCommittedSeqRef.current = speech.resultSeq;
    await speech.start({
      continuous: true,
      interimResults: true,
      contextualStrings: nameContextualStrings,
    });
  }, [speech, entryText, nameContextualStrings]);

  const handlePickImages = useCallback(async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      Alert.alert('limit reached', `you can attach up to ${MAX_IMAGES} images per entry.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('permission needed', 'allow access to your photos to attach images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.6,
    });

    if (result.canceled) return;
    setImages((prev) => [...prev, ...result.assets.map((asset) => ({ uri: asset.uri }))].slice(0, MAX_IMAGES));
  }, [images.length]);

  const handlePickFiles = useCallback(async () => {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      Alert.alert('limit reached', `you can attach up to ${MAX_FILES} files per entry.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: remaining > 1,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const picked = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
    }));
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  }, [files.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Live-merge the dictated speech into the entry as it's heard.
  // Final results are committed into the running base exactly once — keyed off
  // resultSeq rather than the transcript text, since repeating the same phrase
  // produces an identical string that React would otherwise dedupe away.
  // Interim results are shown as a live preview on top of that base.
  useEffect(() => {
    if (speech.transcript && speech.resultSeq !== lastCommittedSeqRef.current) {
      lastCommittedSeqRef.current = speech.resultSeq;
      const corrected = correctNamesInTranscript(speech.transcript, nameContextualStrings);
      const base = dictationBaseRef.current;
      const merged = base ? `${base} ${corrected}` : corrected;
      dictationBaseRef.current = merged;
      setEntryText(merged);
      return;
    }

    if (speech.interimTranscript) {
      const base = dictationBaseRef.current;
      setEntryText(base ? `${base} ${speech.interimTranscript}` : speech.interimTranscript);
    }
  }, [speech.transcript, speech.interimTranscript, speech.resultSeq, nameContextualStrings]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const entries = await getJournalEntries();
      if (mounted) {
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
      const location = await getCurrentLocationLabel();

      const newEntry: JournalEntry = {
        id: String(entryCounter + 1),
        date: new Date().toISOString(),
        promptId: currentPrompt.id,
        response: trimmed,
        ...(location ? { location } : {}),
        ...(images.length ? { images } : {}),
        ...(files.length ? { files } : {}),
      };

      await saveJournalEntry(newEntry);
      const nextStreak = await incrementStreak();

      setEntryCounter((prev) => prev + 1);
      setEntryText('');
      setImages([]);
      setFiles([]);
      setStreak(nextStreak);
      Alert.alert('saved', 'your journal entry has been saved.');
    } catch {
      Alert.alert('error', 'failed to save entry. please try again.');
    } finally {
      setSaving(false);
    }
  }, [entryText, entryCounter, currentPrompt.id, saveJournalEntry, incrementStreak, images, files]);

  const handleNewPrompt = useCallback(() => {
    let next = getRandomItem(JOURNAL_PROMPTS);
    while (next.id === currentPrompt.id && JOURNAL_PROMPTS.length > 1) {
      next = getRandomItem(JOURNAL_PROMPTS);
    }
    setCurrentPrompt(next);
  }, [currentPrompt.id]);

  return (
    <GradientBackground>
      <StreakBadge count={streak} />
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
          <VoiceWave active={speech.isListening} />
        </Pressable>

        {speech.error ? (
          <>
            <View style={{ height: S.xs }} />
            <Text style={styles.dictateError}>{speech.error}</Text>
          </>
        ) : null}

        {/* 12px gap */}
        <View style={{ height: S.sm }} />

        {/* attachments — gallery for images, paperclip for files */}
        <View style={styles.attachRow}>
          <Pressable
            onPress={handlePickImages}
            style={styles.attachButton}
            accessibilityRole="button"
            accessibilityLabel="Add photos to this entry"
          >
            <Ionicons name="images-outline" size={18} color={COLORS.fgSecondary} />
          </Pressable>
          <Pressable
            onPress={handlePickFiles}
            style={styles.attachButton}
            accessibilityRole="button"
            accessibilityLabel="Attach files to this entry"
          >
            <Ionicons name="attach-outline" size={20} color={COLORS.fgSecondary} />
          </Pressable>
          {images.length + files.length > 0 ? (
            <Text style={styles.attachCount}>
              {images.length + files.length} attached
            </Text>
          ) : null}
        </View>

        {images.length > 0 ? (
          <>
            <View style={{ height: S.sm }} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {images.map((image, index) => (
                <View key={image.uri} style={styles.thumbWrap}>
                  <Image source={{ uri: image.uri }} style={styles.thumb} />
                  <Pressable
                    onPress={() => removeImage(index)}
                    style={styles.thumbRemove}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove this photo"
                  >
                    <Ionicons name="close" size={12} color={COLORS.fg} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </>
        ) : null}

        {files.length > 0 ? (
          <>
            <View style={{ height: S.sm }} />
            <View style={styles.fileList}>
              {files.map((file, index) => (
                <View key={file.uri} style={styles.fileChip}>
                  <Ionicons name="document-outline" size={14} color={COLORS.fgSecondary} />
                  <Text style={styles.fileChipText} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Pressable
                    onPress={() => removeFile(index)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${file.name}`}
                  >
                    <Ionicons name="close" size={14} color={COLORS.fgSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* 16px gap */}
        <View style={{ height: S.md }} />

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

        {/* 24px gap — trimmed to leave clearance for the floating reflection switcher */}
        <View style={{ height: S.lg }} />

        {/* entry archive & reflection */}
        <View style={styles.jellyRow}>
          <JellyButton
            label="previous entries"
            icon="albums-outline"
            tone="accent"
            onPress={() => router.push('/journal-entries')}
            style={styles.jellyButton}
          />
          <JellyButton
            label="analyse my patterns"
            icon="sparkles-outline"
            tone="purple"
            onPress={() => router.push('/journal-patterns')}
            style={styles.jellyButton}
          />
        </View>
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

  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  attachCount: {
    ...TYPE.secondary,
    fontSize: 12,
  },

  thumbRow: {
    gap: S.sm,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,13,15,0.85)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  fileList: {
    gap: S.xs,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: S.sm,
  },
  fileChipText: {
    ...TYPE.secondary,
    fontSize: 12,
    maxWidth: 180,
  },

  jellyRow: {
    gap: S.md,
  },
  jellyButton: {
    justifyContent: 'center',
  },
});
