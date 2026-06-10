import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../src/components/GradientBackground';
import JellyButton from '../src/components/JellyButton';
import { COLORS, RADIUS, S, TYPE } from '../src/constants/theme';
import { useIdentity, JournalEntry, CbtNotes } from '../src/hooks/useIdentity';
import { JOURNAL_PROMPTS } from '../src/data/journal-prompts';
import { isGeminiConfigured } from '../src/utils/gemini';
import {
  analyzeEntryModalities,
  analyzeDownwardArrow,
  analyzeCognitiveDistortions,
  HotCrossBunAnalysis,
  DownwardArrowAnalysis,
  CognitiveDistortionAnalysis,
} from '../src/utils/journalAnalysis';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MODALITY_PANES: Array<{
  key: keyof Pick<HotCrossBunAnalysis, 'thoughts' | 'feelings' | 'behaviors' | 'physicalSymptoms'>;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'thoughts', label: 'thoughts', icon: 'bulb-outline' },
  { key: 'feelings', label: 'feelings', icon: 'heart-outline' },
  { key: 'behaviors', label: 'behaviors', icon: 'walk-outline' },
  { key: 'physicalSymptoms', label: 'physical', icon: 'pulse-outline' },
];

type AnalysisToggle = 'hotCrossBun' | 'downwardArrow' | 'cognitiveDistortion' | 'myEvidence';

const ANALYSIS_TOGGLES: Array<{
  key: AnalysisToggle;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  needsCoreBelief?: boolean;
}> = [
  { key: 'hotCrossBun', label: 'hot cross', icon: 'sync-outline' },
  { key: 'downwardArrow', label: 'downward arrow', icon: 'arrow-down-circle-outline' },
  { key: 'cognitiveDistortion', label: 'distortion check', icon: 'glasses-outline', needsCoreBelief: true },
  { key: 'myEvidence', label: 'my evidence', icon: 'scale-outline', needsCoreBelief: true },
];

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

interface AnalysisState<T> {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'unconfigured';
  data?: T;
  message?: string;
}

async function loadAnalysis<T>(
  entryId: string,
  setState: React.Dispatch<React.SetStateAction<Record<string, AnalysisState<T>>>>,
  fetcher: () => Promise<T>,
) {
  if (!isGeminiConfigured()) {
    setState((prev) => ({
      ...prev,
      [entryId]: {
        status: 'unconfigured',
        message: 'add a Gemini API key (EXPO_PUBLIC_GEMINI_API_KEY) to your .env to unlock this — get a free one at aistudio.google.com/apikey.',
      },
    }));
    return;
  }
  setState((prev) => ({ ...prev, [entryId]: { status: 'loading' } }));
  try {
    const data = await fetcher();
    setState((prev) => ({ ...prev, [entryId]: { status: 'ready', data } }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      [entryId]: { status: 'error', message: error instanceof Error ? error.message : 'something went wrong reaching the model.' },
    }));
  }
}

function EditableField({
  value,
  placeholder,
  onSave,
  textStyle,
}: {
  value: string;
  placeholder: string;
  onSave: (next: string) => void;
  textStyle?: any;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  if (editing) {
    return (
      <View style={styles.editableEditing}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={COLORS.fgSecondary}
          multiline
          autoFocus
          style={[styles.editableInput, textStyle]}
        />
        <View style={styles.editableActions}>
          <Pressable
            onPress={() => { setDraft(value); setEditing(false); }}
            style={styles.editableActionBtn}
            accessibilityRole="button"
            accessibilityLabel="cancel edit"
          >
            <Ionicons name="close" size={15} color={COLORS.fgSecondary} />
          </Pressable>
          <Pressable
            onPress={() => { onSave(draft.trim()); setEditing(false); }}
            style={styles.editableActionBtn}
            accessibilityRole="button"
            accessibilityLabel="save"
          >
            <Ionicons name="checkmark" size={15} color={COLORS.purple} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setEditing(true)} style={styles.editableDisplay} accessibilityRole="button" accessibilityLabel={value ? 'edit' : placeholder}>
      <Text style={[textStyle, !value && styles.editablePlaceholder]}>{value || placeholder}</Text>
      <Ionicons name="pencil-outline" size={12} color={COLORS.fgSecondary} style={styles.editablePencil} />
    </Pressable>
  );
}

function AddItemRow({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState('');
  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  };
  return (
    <View style={styles.addItemRow}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        placeholderTextColor={COLORS.fgSecondary}
        style={styles.addItemInput}
        onSubmitEditing={submit}
        returnKeyType="done"
        blurOnSubmit={false}
      />
      <Pressable onPress={submit} style={styles.addItemButton} accessibilityRole="button" accessibilityLabel="add your own">
        <Ionicons name="add" size={16} color={COLORS.purple} />
      </Pressable>
    </View>
  );
}

export default function JournalPatternsScreen() {
  const router = useRouter();
  const { getJournalEntries, updateJournalEntryCbtNotes } = useIdentity();

  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [analysisByEntry, setAnalysisByEntry] = useState<Record<string, AnalysisState<HotCrossBunAnalysis>>>({});
  const [arrowByEntry, setArrowByEntry] = useState<Record<string, AnalysisState<DownwardArrowAnalysis>>>({});
  const [distortionByEntry, setDistortionByEntry] = useState<Record<string, AnalysisState<CognitiveDistortionAnalysis>>>({});
  const [activeToggleByEntry, setActiveToggleByEntry] = useState<Record<string, AnalysisToggle>>({});

  useEffect(() => {
    getJournalEntries().then(setEntries);
  }, [getJournalEntries]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    (entries ?? []).forEach((entry) => {
      const key = dayKey(new Date(entry.date));
      const existing = map.get(key);
      if (existing) existing.push(entry);
      else map.set(key, [entry]);
    });
    return map;
  }, [entries]);

  const grid = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date; key: string } | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ date, key: dayKey(date) });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthCursor]);

  const selectedEntries = selectedKey ? entriesByDay.get(selectedKey) ?? [] : [];
  const todayKey = dayKey(new Date());

  const shiftMonth = (delta: number) => {
    setSelectedKey(null);
    setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const onSelectDay = (key: string, hasEntries: boolean) => {
    if (!hasEntries) return;
    setSelectedKey((current) => (current === key ? null : key));
  };

  const runModalities = useCallback(
    (entry: JournalEntry) => loadAnalysis(entry.id, setAnalysisByEntry, () => analyzeEntryModalities(entry.response)),
    [],
  );
  const runDownwardArrow = useCallback(
    (entry: JournalEntry) => loadAnalysis(entry.id, setArrowByEntry, () => analyzeDownwardArrow(entry.response)),
    [],
  );
  const runDistortions = useCallback(
    (entry: JournalEntry, automaticThought: string) =>
      loadAnalysis(entry.id, setDistortionByEntry, () => analyzeCognitiveDistortions(automaticThought, entry.response)),
    [],
  );

  const setActiveToggle = (entryId: string, toggle: AnalysisToggle) => {
    setActiveToggleByEntry((prev) => ({ ...prev, [entryId]: toggle }));
  };

  const persistCbtNotes = useCallback(async (entryId: string, patch: CbtNotes) => {
    const updated = await updateJournalEntryCbtNotes(entryId, patch);
    setEntries(updated);
  }, [updateJournalEntryCbtNotes]);

  const addEvidenceItem = (entry: JournalEntry, side: 'evidenceForExtra' | 'evidenceAgainstExtra', text: string) => {
    const existing = entry.cbtNotes?.[side] ?? [];
    persistCbtNotes(entry.id, { [side]: [...existing, text] });
  };

  const setDistortionVerdict = (entry: JournalEntry, distortion: string, verdict: 'confirmed' | 'dismissed') => {
    const next = { ...(entry.cbtNotes?.distortionVerdicts ?? {}) };
    if (next[distortion] === verdict) delete next[distortion];
    else next[distortion] = verdict;
    persistCbtNotes(entry.id, { distortionVerdicts: next });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="go back">
        <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
      </Pressable>
      <Text style={styles.title}>analyse my patterns</Text>
      <View style={styles.iconButton} />
    </View>
  );

  const renderMonthNav = () => (
    <View style={styles.monthNav}>
      <Pressable onPress={() => shiftMonth(-1)} style={styles.iconButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="previous month">
        <Ionicons name="chevron-back" size={18} color={COLORS.accent} />
      </Pressable>
      <Text style={styles.monthLabel}>{monthLabel(monthCursor)}</Text>
      <Pressable onPress={() => shiftMonth(1)} style={styles.iconButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="next month">
        <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
      </Pressable>
    </View>
  );

  const renderCalendar = () => (
    <View style={styles.calendar}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={`${label}-${i}`} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {grid.map((cell, i) => {
          if (!cell) return <View key={`blank-${i}`} style={styles.cell} />;
          const dayEntries = entriesByDay.get(cell.key);
          const hasEntries = !!dayEntries?.length;
          const isSelected = selectedKey === cell.key;
          const isToday = cell.key === todayKey;
          return (
            <Pressable
              key={cell.key}
              style={[
                styles.cell,
                styles.dayCell,
                hasEntries && styles.dayCellActive,
                isSelected && styles.dayCellSelected,
              ]}
              onPress={() => onSelectDay(cell.key, hasEntries)}
              accessibilityRole={hasEntries ? 'button' : undefined}
              accessibilityLabel={hasEntries ? `view entry from ${cell.date.toDateString()}` : undefined}
            >
              <Text style={[
                styles.dayNumber,
                hasEntries && styles.dayNumberActive,
                isSelected && styles.dayNumberSelected,
                isToday && styles.dayNumberToday,
              ]}>
                {cell.date.getDate()}
              </Text>
              {hasEntries && <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderModalityPane = (entry: JournalEntry) => {
    const state = analysisByEntry[entry.id];

    if (!state || state.status === 'idle') {
      return (
        <Pressable onPress={() => runModalities(entry)} style={styles.unlockCard} accessibilityRole="button" accessibilityLabel="reveal hot cross bun analysis">
          <Ionicons name="sparkles-outline" size={22} color={COLORS.purple} />
          <Text style={styles.unlockText}>tap to extract thoughts, feelings, behaviors & physical symptoms from this entry</Text>
        </Pressable>
      );
    }

    if (state.status === 'loading') {
      return (
        <View style={styles.unlockCard}>
          <ActivityIndicator color={COLORS.purple} />
          <Text style={styles.unlockText}>reading between the lines…</Text>
        </View>
      );
    }

    if (state.status === 'unconfigured' || state.status === 'error') {
      return (
        <View style={styles.unlockCard}>
          <Ionicons name="key-outline" size={22} color={COLORS.fgSecondary} />
          <Text style={styles.unlockText}>{state.message}</Text>
          {state.status === 'error' && (
            <Pressable onPress={() => runModalities(entry)} style={styles.retryButton}>
              <Text style={styles.retryText}>try again</Text>
            </Pressable>
          )}
        </View>
      );
    }

    const data = state.data!;
    return (
      <View style={styles.bunWrap}>
        <Text style={styles.bunReflection}>{data.reflection}</Text>
        <View style={styles.bunGrid}>
          {MODALITY_PANES.map(({ key, label, icon }) => {
            const items = data[key];
            return (
              <View key={key} style={styles.bunPane}>
                <View style={styles.bunPaneHeader}>
                  <Ionicons name={icon} size={15} color={COLORS.purple} />
                  <Text style={styles.bunPaneLabel}>{label}</Text>
                </View>
                {items.length ? (
                  items.map((item, i) => (
                    <Text key={i} style={styles.bunItem}>· {item}</Text>
                  ))
                ) : (
                  <Text style={styles.bunEmpty}>nothing notable here</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDownwardArrowPane = (entry: JournalEntry) => {
    const state = arrowByEntry[entry.id];

    if (!state || state.status === 'idle') {
      return (
        <Pressable onPress={() => runDownwardArrow(entry)} style={styles.unlockCard} accessibilityRole="button" accessibilityLabel="reveal downward arrow analysis">
          <Ionicons name="arrow-down-circle-outline" size={22} color={COLORS.purple} />
          <Text style={styles.unlockText}>tap to trace this entry's automatic thought down to the core belief beneath it</Text>
        </Pressable>
      );
    }

    if (state.status === 'loading') {
      return (
        <View style={styles.unlockCard}>
          <ActivityIndicator color={COLORS.purple} />
          <Text style={styles.unlockText}>following the thread downward…</Text>
        </View>
      );
    }

    if (state.status === 'unconfigured' || state.status === 'error') {
      return (
        <View style={styles.unlockCard}>
          <Ionicons name="key-outline" size={22} color={COLORS.fgSecondary} />
          <Text style={styles.unlockText}>{state.message}</Text>
          {state.status === 'error' && (
            <Pressable onPress={() => runDownwardArrow(entry)} style={styles.retryButton}>
              <Text style={styles.retryText}>try again</Text>
            </Pressable>
          )}
        </View>
      );
    }

    const data = state.data!;
    return (
      <View style={styles.arrowWrap}>
        <View style={styles.arrowBlock}>
          <Text style={styles.arrowStepLabel}>1 · trigger</Text>
          <Text style={styles.arrowStepText}>{data.trigger}</Text>
        </View>

        <View style={styles.arrowBlock}>
          <Text style={styles.arrowStepLabel}>2 · what it stirred up</Text>
          <View style={styles.arrowEmotionRow}>
            {data.emotions.map((emotion, i) => (
              <View key={i} style={styles.arrowEmotionChip}>
                <Text style={styles.arrowEmotionName}>{emotion.name}</Text>
                <View style={styles.arrowEmotionTrack}>
                  <View style={[styles.arrowEmotionFill, { width: `${Math.max(6, Math.min(100, emotion.intensity))}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.arrowBlock}>
          <Text style={styles.arrowStepLabel}>3 · automatic thought</Text>
          <Text style={styles.arrowHintSmall}>here's what the model picked up — tap to put it in your own words</Text>
          <EditableField
            value={entry.cbtNotes?.automaticThought ?? ''}
            placeholder={`"${data.automaticThought}"`}
            onSave={(next) => persistCbtNotes(entry.id, { automaticThought: next })}
            textStyle={styles.arrowQuote}
          />
        </View>

        <View style={styles.arrowBlock}>
          <Text style={styles.arrowStepLabel}>4 · the downward arrow</Text>
          <View style={styles.arrowChain}>
            {data.chain.map((step, i) => (
              <View key={i} style={styles.arrowChainStep}>
                <View style={styles.arrowChainBullet}>
                  <Text style={styles.arrowChainBulletText}>{i + 1}</Text>
                </View>
                <View style={styles.arrowChainBody}>
                  <Text style={styles.arrowChainQuestion}>{step.question}</Text>
                  <Text style={styles.arrowChainAnswer}>{step.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.arrowBlock, styles.arrowCoreBlock]}>
          <Text style={styles.arrowStepLabel}>5 · the core belief beneath it</Text>
          <Text style={styles.arrowHintSmall}>candidates the model noticed:</Text>
          {data.coreBeliefs.map((belief, i) => (
            <Text key={i} style={styles.arrowCoreBelief}>"{belief}"</Text>
          ))}
          <Text style={styles.arrowOwnLabel}>name it in your own words</Text>
          <EditableField
            value={entry.cbtNotes?.coreBelief ?? ''}
            placeholder="write the belief the way it actually sounds in your head…"
            onSave={(next) => persistCbtNotes(entry.id, { coreBelief: next })}
            textStyle={styles.arrowCoreBelief}
          />
          <Text style={styles.arrowCoreHint}>once the model surfaces a core belief, the "distortion check" and "my evidence" toggles open up above.</Text>
        </View>
      </View>
    );
  };

  const renderDistortionPane = (entry: JournalEntry) => {
    const arrowState = arrowByEntry[entry.id];
    const aiThought = arrowState?.status === 'ready' ? arrowState.data?.automaticThought : undefined;
    const automaticThought = entry.cbtNotes?.automaticThought || aiThought;
    const state = distortionByEntry[entry.id];

    if (!automaticThought) {
      return (
        <View style={styles.unlockCard}>
          <Ionicons name="glasses-outline" size={22} color={COLORS.fgSecondary} />
          <Text style={styles.unlockText}>find a core belief in "downward arrow" first — this check tests the automatic thought behind it.</Text>
        </View>
      );
    }

    if (!state || state.status === 'idle') {
      return (
        <Pressable onPress={() => runDistortions(entry, automaticThought)} style={styles.unlockCard} accessibilityRole="button" accessibilityLabel="check this thought for cognitive distortions">
          <Ionicons name="glasses-outline" size={22} color={COLORS.purple} />
          <Text style={styles.unlockText}>tap to check the automatic thought against common thinking traps</Text>
        </Pressable>
      );
    }

    if (state.status === 'loading') {
      return (
        <View style={styles.unlockCard}>
          <ActivityIndicator color={COLORS.purple} />
          <Text style={styles.unlockText}>checking the thought against the evidence…</Text>
        </View>
      );
    }

    if (state.status === 'unconfigured' || state.status === 'error') {
      return (
        <View style={styles.unlockCard}>
          <Ionicons name="key-outline" size={22} color={COLORS.fgSecondary} />
          <Text style={styles.unlockText}>{state.message}</Text>
          {state.status === 'error' && (
            <Pressable onPress={() => runDistortions(entry, automaticThought)} style={styles.retryButton}>
              <Text style={styles.retryText}>try again</Text>
            </Pressable>
          )}
        </View>
      );
    }

    const data = state.data!;
    return (
      <View style={styles.distortionWrap}>
        <Text style={styles.arrowQuote}>"{automaticThought}"</Text>
        {data.findings.length ? (
          data.findings.map((finding, i) => {
            const verdict = entry.cbtNotes?.distortionVerdicts?.[finding.distortion];
            return (
              <View key={i} style={[styles.distortionCard, verdict === 'dismissed' && styles.distortionCardDismissed]}>
                <View style={styles.distortionHeader}>
                  <Ionicons name="alert-circle-outline" size={15} color={COLORS.purple} />
                  <Text style={styles.distortionName}>{finding.distortion}</Text>
                </View>
                <Text style={styles.distortionEvidence}>"{finding.evidence}"</Text>
                <Text style={styles.distortionNote}>{finding.note}</Text>
                <View style={styles.verdictRow}>
                  <Pressable
                    onPress={() => setDistortionVerdict(entry, finding.distortion, 'confirmed')}
                    style={[styles.verdictBtn, verdict === 'confirmed' && styles.verdictBtnConfirmed]}
                    accessibilityRole="button"
                    accessibilityLabel="this resonates"
                  >
                    <Ionicons name="checkmark" size={12} color={verdict === 'confirmed' ? COLORS.fg : COLORS.fgSecondary} />
                    <Text style={[styles.verdictBtnLabel, verdict === 'confirmed' && styles.verdictBtnLabelActive]}>resonates</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDistortionVerdict(entry, finding.distortion, 'dismissed')}
                    style={[styles.verdictBtn, verdict === 'dismissed' && styles.verdictBtnDismissed]}
                    accessibilityRole="button"
                    accessibilityLabel="not quite"
                  >
                    <Ionicons name="close" size={12} color={verdict === 'dismissed' ? COLORS.fg : COLORS.fgSecondary} />
                    <Text style={[styles.verdictBtnLabel, verdict === 'dismissed' && styles.verdictBtnLabelActive]}>not quite</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.distortionCard}>
            <View style={styles.distortionHeader}>
              <Ionicons name="checkmark-circle-outline" size={15} color={COLORS.success} />
              <Text style={styles.distortionName}>no major distortions found</Text>
            </View>
            <Text style={styles.distortionNote}>this thought seems to track fairly closely with what's actually there — that's worth noticing too.</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEvidencePane = (entry: JournalEntry) => {
    const state = arrowByEntry[entry.id];
    if (!state || state.status !== 'ready' || !state.data) {
      return (
        <View style={styles.unlockCard}>
          <Ionicons name="scale-outline" size={22} color={COLORS.fgSecondary} />
          <Text style={styles.unlockText}>find a core belief in "downward arrow" first — then weigh the evidence for and against it here.</Text>
        </View>
      );
    }

    const data = state.data;
    const userEvidenceFor = entry.cbtNotes?.evidenceForExtra ?? [];
    const userEvidenceAgainst = entry.cbtNotes?.evidenceAgainstExtra ?? [];
    return (
      <View style={styles.evidenceWrap}>
        {entry.cbtNotes?.coreBelief ? (
          <Text style={styles.arrowCoreBelief}>"{entry.cbtNotes.coreBelief}"</Text>
        ) : (
          data.coreBeliefs.map((belief, i) => (
            <Text key={i} style={styles.arrowCoreBelief}>"{belief}"</Text>
          ))
        )}
        <View style={styles.evidenceColumns}>
          <View style={styles.evidenceColumn}>
            <View style={styles.evidenceColumnHeader}>
              <Ionicons name="add-circle-outline" size={15} color={COLORS.fgSecondary} />
              <Text style={styles.evidenceColumnLabel}>evidence for</Text>
            </View>
            {data.evidenceFor.length ? (
              data.evidenceFor.map((item, i) => <Text key={i} style={styles.bunItem}>· {item}</Text>)
            ) : (
              <Text style={styles.bunEmpty}>nothing solid found</Text>
            )}
            {userEvidenceFor.map((item, i) => (
              <View key={`u-${i}`} style={styles.evidenceUserRow}>
                <Text style={styles.evidenceUserTag}>you</Text>
                <Text style={[styles.bunItem, styles.evidenceUserItemText]}>{item}</Text>
              </View>
            ))}
            <AddItemRow placeholder="add your own…" onAdd={(text) => addEvidenceItem(entry, 'evidenceForExtra', text)} />
          </View>
          <View style={styles.evidenceColumn}>
            <View style={styles.evidenceColumnHeader}>
              <Ionicons name="remove-circle-outline" size={15} color={COLORS.purple} />
              <Text style={styles.evidenceColumnLabel}>evidence against</Text>
            </View>
            {data.evidenceAgainst.length ? (
              data.evidenceAgainst.map((item, i) => <Text key={i} style={styles.bunItem}>· {item}</Text>)
            ) : (
              <Text style={styles.bunEmpty}>nothing notable here</Text>
            )}
            {userEvidenceAgainst.map((item, i) => (
              <View key={`u-${i}`} style={styles.evidenceUserRow}>
                <Text style={styles.evidenceUserTag}>you</Text>
                <Text style={[styles.bunItem, styles.evidenceUserItemText]}>{item}</Text>
              </View>
            ))}
            <AddItemRow placeholder="add your own…" onAdd={(text) => addEvidenceItem(entry, 'evidenceAgainstExtra', text)} />
          </View>
        </View>
        <View style={styles.evidenceReframeBlock}>
          <View style={styles.evidenceColumnHeader}>
            <Ionicons name="sparkles-outline" size={15} color={COLORS.purple} />
            <Text style={styles.evidenceColumnLabel}>a gentler reframe</Text>
          </View>
          {data.reframes.map((reframe, i) => (
            <Text key={i} style={styles.evidenceReframe}>"{reframe}"</Text>
          ))}
          <Text style={styles.arrowOwnLabel}>or write your own</Text>
          <EditableField
            value={entry.cbtNotes?.reframe ?? ''}
            placeholder="say it the way you'd want to believe it…"
            onSave={(next) => persistCbtNotes(entry.id, { reframe: next })}
            textStyle={styles.evidenceReframe}
          />
        </View>
      </View>
    );
  };

  const renderToggleRow = (entry: JournalEntry) => {
    const active = activeToggleByEntry[entry.id] ?? 'hotCrossBun';
    const arrowState = arrowByEntry[entry.id];
    const hasCoreBelief = arrowState?.status === 'ready' && !!arrowState.data?.coreBeliefs.length;

    return (
      <View style={styles.toggleRow}>
        {ANALYSIS_TOGGLES.map(({ key, label, icon, needsCoreBelief }) => {
          const locked = !!needsCoreBelief && !hasCoreBelief;
          const isActive = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => { if (!locked) setActiveToggle(entry.id, key); }}
              disabled={locked}
              style={[styles.toggleChip, isActive && styles.toggleChipActive, locked && styles.toggleChipLocked]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive, disabled: locked }}
              accessibilityLabel={locked ? `${label} — unlocks once a core belief is found` : label}
            >
              <Ionicons
                name={locked ? 'lock-closed-outline' : icon}
                size={13}
                color={isActive ? COLORS.fg : locked ? COLORS.fgSecondary : COLORS.purple}
              />
              <Text style={[styles.toggleChipLabel, isActive && styles.toggleChipLabelActive, locked && styles.toggleChipLabelLocked]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderActivePane = (entry: JournalEntry) => {
    const active = activeToggleByEntry[entry.id] ?? 'hotCrossBun';
    switch (active) {
      case 'downwardArrow':
        return renderDownwardArrowPane(entry);
      case 'cognitiveDistortion':
        return renderDistortionPane(entry);
      case 'myEvidence':
        return renderEvidencePane(entry);
      case 'hotCrossBun':
      default:
        return renderModalityPane(entry);
    }
  };

  const renderDayDetail = () => {
    if (!selectedKey || !selectedEntries.length) return null;

    return (
      <View style={styles.detail}>
        {selectedEntries.map((entry) => {
          const prompt = JOURNAL_PROMPTS.find((p) => p.id === entry.promptId);
          const stamp = new Date(entry.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          return (
            <View key={entry.id} style={styles.detailEntry}>
              <View style={styles.detailEntryHeader}>
                <Text style={styles.detailDate}>{stamp}</Text>
                {prompt && <Text style={styles.detailPrompt}>{prompt.prompt}</Text>}
              </View>
              <Text style={styles.detailResponse}>{entry.response}</Text>

              <View style={styles.detailDivider} />
              <Text style={styles.detailSectionLabel}>this entry, mapped</Text>
              {renderToggleRow(entry)}
              {renderActivePane(entry)}
            </View>
          );
        })}
      </View>
    );
  };

  let body: React.ReactNode;
  if (entries === null) {
    body = (
      <View style={styles.empty}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  } else if (entries.length === 0) {
    body = (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={40} color={COLORS.fgSecondary} />
        <Text style={styles.emptyText}>no entries yet — write a few, then come back to see your patterns take shape.</Text>
      </View>
    );
  } else {
    body = (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderMonthNav()}
        {renderCalendar()}
        {selectedKey && !selectedEntries.length && (
          <Text style={styles.hint}>no entry on this day.</Text>
        )}
        {renderDayDetail()}

        <Pressable onPress={() => router.push('/journal-deep-patterns')} style={styles.deepLink} accessibilityRole="button" accessibilityLabel="explore deeper patterns across all entries">
          <View style={styles.deepLinkIcon}>
            <Ionicons name="git-network-outline" size={20} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deepLinkTitle}>explore deeper patterns</Text>
            <Text style={styles.deepLinkSubtitle}>core beliefs, emotional trajectory, recurring themes & how your writing style shifts over time</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.fgSecondary} />
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <GradientBackground>
      {renderHeader()}
      {body}
    </GradientBackground>
  );
}

const CELL_SIZE = 42;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: S.sm,
    paddingBottom: S.md,
  },
  iconButton: {
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
  scrollContent: {
    paddingBottom: S.huge,
    gap: S.lg,
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
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.lg,
  },
  monthLabel: {
    ...TYPE.heading,
    fontSize: 17,
    minWidth: 160,
    textAlign: 'center',
  },
  calendar: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: S.xs,
    marginBottom: S.sm,
  },
  weekdayLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '600',
    width: CELL_SIZE,
    textAlign: 'center',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    borderRadius: RADIUS.pill,
  },
  dayCellActive: {
    backgroundColor: COLORS.purpleSoft,
  },
  dayCellSelected: {
    backgroundColor: COLORS.purple,
  },
  dayNumber: {
    ...TYPE.body,
    fontSize: 14,
    color: COLORS.fgSecondary,
  },
  dayNumberActive: {
    color: COLORS.fg,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: COLORS.fg,
  },
  dayNumberToday: {
    color: COLORS.accent,
  },
  dayDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.purple,
  },
  dayDotSelected: {
    backgroundColor: COLORS.fg,
  },
  hint: {
    ...TYPE.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
  detail: {
    gap: S.lg,
  },
  detailEntry: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.lg,
    gap: S.sm,
  },
  detailEntryHeader: {
    gap: 2,
  },
  detailDate: {
    ...TYPE.accent,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  detailPrompt: {
    ...TYPE.heading,
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  detailResponse: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 23,
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: S.xs,
  },
  detailSectionLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  unlockCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    paddingVertical: S.lg,
    paddingHorizontal: S.md,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    backgroundColor: COLORS.purpleSoft,
  },
  unlockText: {
    ...TYPE.secondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  retryButton: {
    marginTop: S.xs,
    paddingVertical: S.xs,
    paddingHorizontal: S.md,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  retryText: {
    ...TYPE.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  bunWrap: {
    position: 'relative',
    gap: S.md,
  },
  bunReflection: {
    ...TYPE.body,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    color: COLORS.fgSecondary,
  },
  bunGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  bunPane: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.sm,
    gap: 4,
    minHeight: 96,
  },
  bunPaneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginBottom: 2,
  },
  bunPaneLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.purple,
  },
  bunItem: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 18,
  },
  bunEmpty: {
    ...TYPE.secondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.xs,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: S.sm,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceHover,
  },
  toggleChipActive: {
    backgroundColor: COLORS.purple,
    borderColor: COLORS.purple,
  },
  toggleChipLocked: {
    opacity: 0.5,
  },
  toggleChipLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.purple,
  },
  toggleChipLabelActive: {
    color: COLORS.fg,
  },
  toggleChipLabelLocked: {
    color: COLORS.fgSecondary,
  },
  arrowWrap: {
    gap: S.md,
  },
  arrowBlock: {
    gap: 6,
  },
  arrowStepLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.purple,
  },
  arrowStepText: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
  },
  arrowQuote: {
    ...TYPE.body,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    color: COLORS.fgSecondary,
  },
  arrowEmotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  arrowEmotionChip: {
    minWidth: 110,
    gap: 4,
  },
  arrowEmotionName: {
    ...TYPE.body,
    fontSize: 13,
    fontWeight: '600',
  },
  arrowEmotionTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceHover,
    overflow: 'hidden',
  },
  arrowEmotionFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.purple,
  },
  arrowChain: {
    gap: S.sm,
  },
  arrowChainStep: {
    flexDirection: 'row',
    gap: S.sm,
  },
  arrowChainBullet: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleSoft,
  },
  arrowChainBulletText: {
    ...TYPE.accent,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.purple,
  },
  arrowChainBody: {
    flex: 1,
    gap: 2,
  },
  arrowChainQuestion: {
    ...TYPE.body,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    color: COLORS.fgSecondary,
  },
  arrowChainAnswer: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 19,
  },
  arrowCoreBlock: {
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    padding: S.md,
  },
  arrowCoreBelief: {
    ...TYPE.heading,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  arrowCoreHint: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  distortionWrap: {
    gap: S.sm,
  },
  distortionCard: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.sm,
    gap: 4,
  },
  distortionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  distortionName: {
    ...TYPE.body,
    fontSize: 13,
    fontWeight: '700',
  },
  distortionEvidence: {
    ...TYPE.body,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    color: COLORS.fgSecondary,
  },
  distortionNote: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 18,
  },
  evidenceWrap: {
    gap: S.md,
  },
  evidenceColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
  },
  evidenceColumn: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.sm,
    gap: 4,
  },
  evidenceColumnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginBottom: 2,
  },
  evidenceColumnLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.purple,
  },
  evidenceReframeBlock: {
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    padding: S.sm,
    gap: 4,
  },
  evidenceReframe: {
    ...TYPE.body,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  arrowHintSmall: {
    ...TYPE.secondary,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  arrowOwnLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.fgSecondary,
    marginTop: 4,
  },
  editableDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  editablePencil: {
    marginTop: 4,
  },
  editablePlaceholder: {
    fontStyle: 'italic',
    color: COLORS.fgSecondary,
  },
  editableEditing: {
    gap: 6,
  },
  editableInput: {
    ...TYPE.body,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.fg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceHover,
    padding: S.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editableActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: S.xs,
  },
  editableActionBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceHover,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addItemInput: {
    ...TYPE.body,
    flex: 1,
    fontSize: 13,
    color: COLORS.fg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: S.sm,
  },
  addItemButton: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
  },
  evidenceUserRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  evidenceUserTag: {
    ...TYPE.accent,
    flexShrink: 0,
    alignSelf: 'flex-start',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.purple,
    backgroundColor: COLORS.purpleSoft,
    borderRadius: RADIUS.pill,
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginTop: 3,
    overflow: 'hidden',
  },
  evidenceUserItemText: {
    flex: 1,
  },
  verdictRow: {
    flexDirection: 'row',
    gap: S.xs,
    marginTop: 4,
  },
  verdictBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: S.sm,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  verdictBtnConfirmed: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  verdictBtnDismissed: {
    backgroundColor: COLORS.fgSecondary,
    borderColor: COLORS.fgSecondary,
  },
  verdictBtnLabel: {
    ...TYPE.secondary,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.fgSecondary,
  },
  verdictBtnLabelActive: {
    color: COLORS.fg,
  },
  distortionCardDismissed: {
    opacity: 0.55,
  },
  deepLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.purpleBorder,
    padding: S.lg,
  },
  deepLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleSoft,
  },
  deepLinkTitle: {
    ...TYPE.heading,
    fontSize: 15,
  },
  deepLinkSubtitle: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
