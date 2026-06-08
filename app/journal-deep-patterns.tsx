import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import GradientBackground from '../src/components/GradientBackground';
import { COLORS, RADIUS, S, TYPE } from '../src/constants/theme';
import { useIdentity, JournalEntry } from '../src/hooks/useIdentity';
import { isGeminiConfigured, GeminiNotConfiguredError } from '../src/utils/gemini';
import {
  analyzeCognitiveSchemas,
  analyzeEmotionalTrajectory,
  analyzeTopics,
  computeStylometry,
  CognitiveSchemaAnalysis,
  EmotionTrajectoryAnalysis,
  TopicAnalysis,
  StylometryAnalysis,
  SchemaFinding,
} from '../src/utils/journalAnalysis';

const MIN_ENTRIES_FOR_DEEP_ANALYSIS = 4;

type LoadState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }
  | { status: 'unconfigured' };

const SCHEMA_SECTIONS: Array<{ key: keyof Pick<CognitiveSchemaAnalysis, 'coreBeliefs' | 'dysfunctionalAssumptions' | 'negativeAutomaticThoughts'>; label: string; hint: string }> = [
  { key: 'coreBeliefs', label: 'core beliefs', hint: 'deep, trait-like beliefs about self, others, or the world' },
  { key: 'dysfunctionalAssumptions', label: 'dysfunctional assumptions', hint: '"if/then" rules that quietly shape your choices' },
  { key: 'negativeAutomaticThoughts', label: 'negative automatic thoughts', hint: 'specific reflexive thoughts that recur in the moment' },
];

function valenceColor(valence: number): string {
  if (valence > 0.25) return COLORS.success;
  if (valence < -0.25) return COLORS.danger;
  return COLORS.accent;
}

function trendLabel(trend: 'rising' | 'falling' | 'steady'): string {
  if (trend === 'rising') return 'rising';
  if (trend === 'falling') return 'easing';
  return 'steady';
}

function trendIcon(trend: 'rising' | 'falling' | 'steady'): keyof typeof Ionicons.glyphMap {
  if (trend === 'rising') return 'trending-up-outline';
  if (trend === 'falling') return 'trending-down-outline';
  return 'remove-outline';
}

export default function JournalDeepPatternsScreen() {
  const router = useRouter();
  const { getJournalEntries } = useIdentity();

  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [schemas, setSchemas] = useState<LoadState<CognitiveSchemaAnalysis>>({ status: 'idle' });
  const [emotions, setEmotions] = useState<LoadState<EmotionTrajectoryAnalysis>>({ status: 'idle' });
  const [topics, setTopics] = useState<LoadState<TopicAnalysis>>({ status: 'idle' });

  useEffect(() => {
    getJournalEntries().then(setEntries);
  }, [getJournalEntries]);

  const stylometry: StylometryAnalysis | null = useMemo(
    () => (entries && entries.length ? computeStylometry(entries) : null),
    [entries]
  );

  const enoughEntries = (entries?.length ?? 0) >= MIN_ENTRIES_FOR_DEEP_ANALYSIS;

  const runAll = async () => {
    if (!entries?.length) return;
    if (!isGeminiConfigured()) {
      setSchemas({ status: 'unconfigured' });
      setEmotions({ status: 'unconfigured' });
      setTopics({ status: 'unconfigured' });
      return;
    }

    setSchemas({ status: 'loading' });
    setEmotions({ status: 'loading' });
    setTopics({ status: 'loading' });

    const [schemaResult, emotionResult, topicResult] = await Promise.allSettled([
      analyzeCognitiveSchemas(entries),
      analyzeEmotionalTrajectory(entries),
      analyzeTopics(entries),
    ]);

    const toState = <T,>(result: PromiseSettledResult<T>): LoadState<T> => {
      if (result.status === 'fulfilled') return { status: 'ready', data: result.value };
      const err = result.reason;
      if (err instanceof GeminiNotConfiguredError) return { status: 'unconfigured' };
      return { status: 'error', message: err instanceof Error ? err.message : 'something went wrong reaching the model.' };
    };

    setSchemas(toState(schemaResult));
    setEmotions(toState(emotionResult));
    setTopics(toState(topicResult));
  };

  useEffect(() => {
    if (entries && entries.length && enoughEntries) {
      runAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={12} accessibilityRole="button" accessibilityLabel="go back">
        <Ionicons name="chevron-back" size={22} color={COLORS.fg} />
      </Pressable>
      <Text style={styles.title}>deeper patterns</Text>
      <View style={styles.iconButton} />
    </View>
  );

  const renderUnconfigured = () => (
    <View style={styles.placeholderCard}>
      <Ionicons name="key-outline" size={26} color={COLORS.fgSecondary} />
      <Text style={styles.placeholderText}>
        add a Gemini API key (EXPO_PUBLIC_GEMINI_API_KEY) to your .env file to unlock this analysis — get a free one at aistudio.google.com/apikey, then restart the app.
      </Text>
    </View>
  );

  const renderError = (message: string, retry: () => void) => (
    <View style={styles.placeholderCard}>
      <Ionicons name="cloud-offline-outline" size={26} color={COLORS.fgSecondary} />
      <Text style={styles.placeholderText}>{message}</Text>
      <Pressable onPress={retry} style={styles.retryButton}>
        <Text style={styles.retryText}>try again</Text>
      </Pressable>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.placeholderCard}>
      <ActivityIndicator color={COLORS.purple} />
      <Text style={styles.placeholderText}>looking across your entries…</Text>
    </View>
  );

  const renderSchemaFindings = (findings: SchemaFinding[]) => (
    <View style={{ gap: S.sm }}>
      {findings.map((finding, i) => (
        <View key={i} style={styles.findingCard}>
          <Text style={styles.findingStatement}>“{finding.statement}”</Text>
          {finding.evidence.map((quote, j) => (
            <Text key={j} style={styles.findingEvidence}>— {quote}</Text>
          ))}
        </View>
      ))}
    </View>
  );

  const renderSchemasSection = () => {
    let content: React.ReactNode;
    if (schemas.status === 'unconfigured') content = renderUnconfigured();
    else if (schemas.status === 'loading' || schemas.status === 'idle') content = renderLoading();
    else if (schemas.status === 'error') content = renderError(schemas.message, runAll);
    else {
      const data = schemas.data;
      content = (
        <View style={{ gap: S.lg }}>
          <Text style={styles.sectionReflection}>{data.reflection}</Text>
          {SCHEMA_SECTIONS.map(({ key, label, hint }) => (
            <View key={key} style={{ gap: S.sm }}>
              <View>
                <Text style={styles.subLabel}>{label}</Text>
                <Text style={styles.subHint}>{hint}</Text>
              </View>
              {data[key].length ? renderSchemaFindings(data[key]) : (
                <Text style={styles.subEmpty}>no clear pattern surfaced here yet — that’s a good thing.</Text>
              )}
            </View>
          ))}
        </View>
      );
    }
    return renderSection('cognitive schemas', 'layers-outline', 'core beliefs → assumptions → automatic thoughts, surfaced from recurring language across your entries', content);
  };

  const renderEmotionsSection = () => {
    let content: React.ReactNode;
    if (emotions.status === 'unconfigured') content = renderUnconfigured();
    else if (emotions.status === 'loading' || emotions.status === 'idle') content = renderLoading();
    else if (emotions.status === 'error') content = renderError(emotions.message, runAll);
    else {
      const data = emotions.data;
      const maxAbs = Math.max(0.01, ...data.points.map((p) => Math.abs(p.valence)));
      content = (
        <View style={{ gap: S.lg }}>
          <Text style={styles.sectionReflection}>{data.reflection}</Text>
          <View style={styles.trajectory}>
            {data.points.map((point) => {
              const heightRatio = Math.abs(point.valence) / maxAbs;
              const isPositive = point.valence >= 0;
              return (
                <View key={point.entryId} style={styles.trajectoryColumn}>
                  <View style={styles.trajectoryTrack}>
                    <View
                      style={[
                        styles.trajectoryBar,
                        {
                          height: `${Math.max(8, heightRatio * 100)}%`,
                          backgroundColor: valenceColor(point.valence),
                          alignSelf: isPositive ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trajectoryEmotion} numberOfLines={1}>{point.dominantEmotion}</Text>
                  <Text style={styles.trajectoryDate}>{new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
              );
            })}
          </View>
          {data.cycles.length > 0 && (
            <View style={{ gap: S.xs }}>
              <Text style={styles.subLabel}>calendar cycles worth noticing</Text>
              {data.cycles.map((cycle, i) => (
                <Text key={i} style={styles.cycleItem}>· {cycle}</Text>
              ))}
            </View>
          )}
        </View>
      );
    }
    return renderSection('emotional trajectory', 'pulse-outline', 'sentiment & discrete emotions tracked across your entries over time', content);
  };

  const renderTopicsSection = () => {
    let content: React.ReactNode;
    if (topics.status === 'unconfigured') content = renderUnconfigured();
    else if (topics.status === 'loading' || topics.status === 'idle') content = renderLoading();
    else if (topics.status === 'error') content = renderError(topics.message, runAll);
    else {
      const data = topics.data;
      content = (
        <View style={{ gap: S.md }}>
          <Text style={styles.sectionReflection}>{data.reflection}</Text>
          {data.topics.map((topic, i) => (
            <View key={i} style={styles.topicCard}>
              <Text style={styles.topicTheme}>{topic.theme}</Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>
              <View style={styles.topicKeywords}>
                {topic.keywords.map((word, j) => (
                  <View key={j} style={styles.keywordChip}>
                    <Text style={styles.keywordText}>{word}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.topicCount}>appears in {topic.entryIds.length} {topic.entryIds.length === 1 ? 'entry' : 'entries'}</Text>
            </View>
          ))}
        </View>
      );
    }
    return renderSection('recurring themes', 'pricetags-outline', 'latent topics your vocabulary clusters into — the words that tend to show up together', content);
  };

  const renderStylometrySection = () => {
    if (!stylometry) return null;
    const latest = stylometry.snapshots[stylometry.snapshots.length - 1];
    const content = (
      <View style={{ gap: S.lg }}>
        <Text style={styles.sectionReflection}>{stylometry.note}</Text>

        <View style={styles.styloRow}>
          <View style={styles.styloStat}>
            <Text style={styles.styloLabel}>self-focus (I / me / my)</Text>
            <View style={styles.styloBarTrack}>
              <View style={[styles.styloBarFill, { width: `${Math.round(latest.selfPronounRatio * 100)}%`, backgroundColor: COLORS.accent }]} />
            </View>
            <View style={styles.styloTrendRow}>
              <Ionicons name={trendIcon(stylometry.selfFocusTrend)} size={13} color={COLORS.fgSecondary} />
              <Text style={styles.styloTrendText}>{trendLabel(stylometry.selfFocusTrend)} over time</Text>
            </View>
          </View>

          <View style={styles.styloStat}>
            <Text style={styles.styloLabel}>absolute language (always / never)</Text>
            <View style={styles.styloBarTrack}>
              <View style={[styles.styloBarFill, { width: `${Math.min(100, Math.round(latest.absoluteWordRate * 12))}%`, backgroundColor: COLORS.purple }]} />
            </View>
            <View style={styles.styloTrendRow}>
              <Ionicons name={trendIcon(stylometry.absoluteLanguageTrend)} size={13} color={COLORS.fgSecondary} />
              <Text style={styles.styloTrendText}>{trendLabel(stylometry.absoluteLanguageTrend)} over time</Text>
            </View>
          </View>
        </View>

        <Text style={styles.styloFootnote}>computed locally from your last {stylometry.snapshots.length} {stylometry.snapshots.length === 1 ? 'entry' : 'entries'} — pronoun & word-frequency counts never leave your device.</Text>
      </View>
    );
    return renderSection('stylometry & linguistic fingerprint', 'finger-print-outline', 'how you write, not just what you write — pronoun balance and absolute-language frequency', content);
  };

  const renderSection = (title: string, icon: keyof typeof Ionicons.glyphMap, subtitle: string, content: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={COLORS.purple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {content}
    </View>
  );

  let body: React.ReactNode;
  if (entries === null) {
    body = (
      <View style={styles.empty}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  } else if (!enoughEntries) {
    body = (
      <View style={styles.empty}>
        <Ionicons name="git-network-outline" size={40} color={COLORS.fgSecondary} />
        <Text style={styles.emptyText}>
          write at least {MIN_ENTRIES_FOR_DEEP_ANALYSIS} entries and these deeper patterns will start to take shape — you have {entries.length} so far.
        </Text>
      </View>
    );
  } else {
    body = (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          drawn from {entries.length} journal entries — a gentle mirror, not a diagnosis. patterns shift as you keep writing.
        </Text>
        {renderSchemasSection()}
        {renderEmotionsSection()}
        {renderTopicsSection()}
        {renderStylometrySection()}
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
  intro: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.lg,
    gap: S.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: S.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleSoft,
  },
  sectionTitle: {
    ...TYPE.heading,
    fontSize: 16,
  },
  sectionSubtitle: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  sectionReflection: {
    ...TYPE.body,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    color: COLORS.fgSecondary,
  },
  placeholderCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.sm,
    paddingVertical: S.lg,
    paddingHorizontal: S.md,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceHover,
  },
  placeholderText: {
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
  subLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.purple,
  },
  subHint: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  subEmpty: {
    ...TYPE.secondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  findingCard: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
    gap: 4,
  },
  findingStatement: {
    ...TYPE.heading,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  findingEvidence: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
  trajectory: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: S.xs,
    height: 140,
  },
  trajectoryColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  trajectoryTrack: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceHover,
  },
  trajectoryBar: {
    width: '100%',
    borderRadius: RADIUS.sm,
  },
  trajectoryEmotion: {
    ...TYPE.secondary,
    fontSize: 10,
    textAlign: 'center',
  },
  trajectoryDate: {
    ...TYPE.secondary,
    fontSize: 9,
    opacity: 0.7,
  },
  cycleItem: {
    ...TYPE.body,
    fontSize: 13,
    lineHeight: 19,
  },
  topicCard: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
    gap: S.xs,
  },
  topicTheme: {
    ...TYPE.heading,
    fontSize: 15,
  },
  topicDescription: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  topicKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  keywordChip: {
    paddingVertical: 4,
    paddingHorizontal: S.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.accentSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
  },
  keywordText: {
    ...TYPE.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  topicCount: {
    ...TYPE.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  styloRow: {
    gap: S.md,
  },
  styloStat: {
    gap: 6,
  },
  styloLabel: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  styloBarTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceHover,
    overflow: 'hidden',
  },
  styloBarFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  styloTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  styloTrendText: {
    ...TYPE.secondary,
    fontSize: 11,
  },
  styloFootnote: {
    ...TYPE.secondary,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
