import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../src/components/GradientBackground';
import JellyButton from '../src/components/JellyButton';
import { COLORS, RADIUS, S, TYPE } from '../src/constants/theme';
import { useIdentity, JournalEntry } from '../src/hooks/useIdentity';
import { JOURNAL_PROMPTS } from '../src/data/journal-prompts';
import { isGeminiConfigured } from '../src/utils/gemini';
import { analyzeEntryModalities, HotCrossBunAnalysis } from '../src/utils/journalAnalysis';

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

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

interface AnalysisState {
  status: 'idle' | 'loading' | 'ready' | 'error' | 'unconfigured';
  data?: HotCrossBunAnalysis;
  message?: string;
}

export default function JournalPatternsScreen() {
  const router = useRouter();
  const { getJournalEntries } = useIdentity();

  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [analysisByEntry, setAnalysisByEntry] = useState<Record<string, AnalysisState>>({});

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

  const runAnalysis = useCallback(async (entry: JournalEntry) => {
    if (!isGeminiConfigured()) {
      setAnalysisByEntry((prev) => ({
        ...prev,
        [entry.id]: {
          status: 'unconfigured',
          message: 'add a Gemini API key (EXPO_PUBLIC_GEMINI_API_KEY) to your .env to unlock this — get a free one at aistudio.google.com/apikey.',
        },
      }));
      return;
    }
    setAnalysisByEntry((prev) => ({ ...prev, [entry.id]: { status: 'loading' } }));
    try {
      const data = await analyzeEntryModalities(entry.response);
      setAnalysisByEntry((prev) => ({ ...prev, [entry.id]: { status: 'ready', data } }));
    } catch (error) {
      setAnalysisByEntry((prev) => ({
        ...prev,
        [entry.id]: { status: 'error', message: error instanceof Error ? error.message : 'something went wrong reaching the model.' },
      }));
    }
  }, []);

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
        <Pressable onPress={() => runAnalysis(entry)} style={styles.unlockCard} accessibilityRole="button" accessibilityLabel="reveal hot cross bun analysis">
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
            <Pressable onPress={() => runAnalysis(entry)} style={styles.retryButton}>
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
              <Text style={styles.detailSectionLabel}>hot cross bun — this entry, mapped</Text>
              {renderModalityPane(entry)}
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
