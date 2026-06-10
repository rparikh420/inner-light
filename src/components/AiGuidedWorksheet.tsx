import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BUTTON, COLORS, RADIUS, S, SURFACE, TYPE } from '../constants/theme';
import { CbtWorksheet, COGNITIVE_DISTORTIONS } from '../data/cbt-worksheets';
import {
  GuidedStepResponse,
  StepHistory,
  generateGuidedClosing,
  generateGuidedStepResponse,
} from '../utils/cbtSession';
import { GeminiNotConfiguredError, isGeminiConfigured } from '../utils/gemini';

interface AiGuidedWorksheetProps {
  worksheet: CbtWorksheet;
}

type Status =
  | 'awaiting-answer'
  | 'loading-response'
  | 'showing-reflection'
  | 'loading-closing'
  | 'closing'
  | 'needs-support'
  | 'unconfigured'
  | 'error';

interface SessionStep {
  history: StepHistory[];
  stepIndex: number;
  answer: string;
  aiResponse: GuidedStepResponse | null;
}

const CRISIS_RESOURCES = [
  { label: '988 Lifeline (US)', detail: 'call or text 988' },
  { label: 'Samaritans (UK & IE)', detail: '116 123' },
  { label: 'Crisis Text Line (US/CA)', detail: 'text HOME to 741741' },
  { label: 'Emergency services', detail: 'your local emergency number' },
];

function CrisisResourcesBanner({ prominent }: { prominent?: boolean }) {
  return (
    <View style={[styles.crisisBanner, prominent && styles.crisisBannerProminent]}>
      <View style={styles.crisisHeader}>
        <Ionicons name="medical-outline" size={15} color={COLORS.danger} />
        <Text style={styles.crisisHeading}>
          {prominent ? 'please reach out to a person who can help' : 'if you need support right now'}
        </Text>
      </View>
      {CRISIS_RESOURCES.map((r) => (
        <Text key={r.label} style={styles.crisisLine}>
          {r.label} — <Text style={styles.crisisDetail}>{r.detail}</Text>
        </Text>
      ))}
      {prominent && (
        <Text style={styles.crisisNote}>
          This tool is not a crisis service. A real person is always the right call in a crisis.
        </Text>
      )}
    </View>
  );
}

export default function AiGuidedWorksheet({ worksheet }: AiGuidedWorksheetProps) {
  const [status, setStatus] = useState<Status>(() =>
    isGeminiConfigured() ? 'awaiting-answer' : 'unconfigured',
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<StepHistory[]>([]);
  const [currentAiPrompt, setCurrentAiPrompt] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState<string | null>(null);
  const [closingText, setClosingText] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDistortions, setSelectedDistortions] = useState<Set<string>>(new Set());

  const scrollRef = useRef<ScrollView>(null);

  const step = worksheet.steps[stepIndex];
  const isDistortionStep = step?.id === 'distortions';
  const isLastStep = stepIndex === worksheet.steps.length - 1;

  const canSubmit = isDistortionStep
    ? true
    : (answer ?? '').trim().length > 0;

  const scrollBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  useEffect(() => {
    scrollBottom();
  }, [status, reflectionText]);

  const toggleDistortion = (id: string) => {
    setSelectedDistortions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const effectiveAnswer = isDistortionStep
    ? selectedDistortions.size > 0
      ? COGNITIVE_DISTORTIONS.filter((d) => selectedDistortions.has(d.id))
          .map((d) => d.name)
          .join(', ')
      : 'No thinking traps selected — the thought held up under examination.'
    : answer.trim();

  const submitAnswer = useCallback(async () => {
    if (!canSubmit) return;
    const ans = effectiveAnswer;
    const nextStep = worksheet.steps[stepIndex + 1] ?? null;

    setStatus('loading-response');
    setReflectionText(null);

    try {
      const response = await generateGuidedStepResponse(
        worksheet,
        history,
        step,
        ans,
        nextStep,
      );

      const updatedHistory: StepHistory[] = [
        ...history,
        { stepTitle: step.title, prompt: currentAiPrompt ?? step.prompt, answer: ans },
      ];
      setHistory(updatedHistory);

      if (response.needsSupport) {
        setReflectionText(response.reflection);
        setStatus('needs-support');
        scrollBottom();
        return;
      }

      setReflectionText(response.reflection);

      if (isLastStep) {
        setStatus('loading-closing');
        try {
          const closing = await generateGuidedClosing(worksheet, updatedHistory);
          setClosingText(closing.closing);
          setStatus('closing');
        } catch (err) {
          setClosingText(worksheet.closing);
          setStatus('closing');
        }
      } else {
        setCurrentAiPrompt(response.nextPrompt || worksheet.steps[stepIndex + 1].prompt);
        setStepIndex(stepIndex + 1);
        setAnswer('');
        setSelectedDistortions(new Set());
        setStatus('showing-reflection');
      }
    } catch (err) {
      if (err instanceof GeminiNotConfiguredError) {
        setStatus('unconfigured');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong reaching the model.');
        setStatus('error');
      }
    }
  }, [canSubmit, effectiveAnswer, worksheet, stepIndex, history, step, currentAiPrompt, isLastStep]);

  const proceedAfterReflection = () => {
    setReflectionText(null);
    setStatus('awaiting-answer');
    scrollBottom();
  };

  const restart = () => {
    setStatus(isGeminiConfigured() ? 'awaiting-answer' : 'unconfigured');
    setStepIndex(0);
    setAnswer('');
    setHistory([]);
    setCurrentAiPrompt(null);
    setReflectionText(null);
    setClosingText(null);
    setErrorMessage(null);
    setSelectedDistortions(new Set());
  };

  if (status === 'unconfigured') {
    return (
      <View style={[SURFACE.card, styles.stateCard]}>
        <Ionicons name="key-outline" size={22} color={COLORS.fgSecondary} />
        <Text style={styles.stateTitle}>Gemini API key needed</Text>
        <Text style={styles.stateBody}>
          Add a <Text style={styles.code}>EXPO_PUBLIC_GEMINI_API_KEY</Text> to your{' '}
          <Text style={styles.code}>.env</Text> file to enable AI-guided mode.
          {'\n'}Get a free key at{' '}
          <Text style={styles.code}>aistudio.google.com/apikey</Text>.
          {'\n\n'}Until then, the self-guided version of this worksheet is fully featured
          and grounded in exactly the same technique.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[SURFACE.card, styles.overviewCard]}>
        <Text style={styles.overview}>{worksheet.overview}</Text>
        <Text style={styles.source}>{worksheet.source}</Text>
      </View>

      {worksheet.cautions.length > 0 && (
        <View style={[SURFACE.card, styles.cautionCard]}>
          <View style={styles.cautionHeader}>
            <Ionicons name="leaf-outline" size={14} color={COLORS.fgSecondary} />
            <Text style={styles.cautionHeading}>worth keeping in mind</Text>
          </View>
          {worksheet.cautions.map((caution, index) => (
            <View key={index} style={styles.cautionRow}>
              <View style={styles.cautionDot} />
              <Text style={styles.cautionText}>{caution}</Text>
            </View>
          ))}
        </View>
      )}

      <CrisisResourcesBanner />

      <View style={styles.progressRow}>
        {worksheet.steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === stepIndex && styles.progressDotActive,
              index < stepIndex && styles.progressDotDone,
            ]}
          />
        ))}
      </View>

      {/* AI reflection from the previous step */}
      {reflectionText && (
        <View style={styles.aiMessage}>
          <View style={styles.aiMessageIcon}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.accent} />
          </View>
          <Text style={styles.aiMessageText}>{reflectionText}</Text>
        </View>
      )}

      {/* Crisis support — shown prominently if model flagged concern */}
      {status === 'needs-support' && (
        <>
          <CrisisResourcesBanner prominent />
          <Pressable onPress={restart} style={[BUTTON.ghost, styles.marginTop]}>
            <Text style={BUTTON.ghostText}>end session</Text>
          </Pressable>
        </>
      )}

      {/* Closing synthesis */}
      {(status === 'closing' || status === 'loading-closing') && (
        <View style={[SURFACE.cardAccent, styles.closingCard]}>
          <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.accent} style={styles.closingIcon} />
          {status === 'loading-closing' ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : (
            <>
              <Text style={styles.overview}>{closingText}</Text>
              <Pressable onPress={restart} style={[BUTTON.ghost, styles.marginTop]}>
                <Text style={BUTTON.ghostText}>start over</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {/* Active step input */}
      {(status === 'awaiting-answer' || status === 'showing-reflection') && (
        <>
          {status === 'showing-reflection' && reflectionText && (
            <Pressable
              onPress={proceedAfterReflection}
              style={[BUTTON.ghost, styles.continueButton]}
              accessibilityRole="button"
              accessibilityLabel="continue to next step"
            >
              <Text style={BUTTON.ghostText}>continue</Text>
            </Pressable>
          )}

          {status === 'awaiting-answer' && (
            <>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepPrompt}>{currentAiPrompt ?? step.prompt}</Text>
              {step.helper && !currentAiPrompt && (
                <Text style={styles.stepHelper}>{step.helper}</Text>
              )}

              {isDistortionStep ? (
                <View style={styles.distortionList}>
                  {COGNITIVE_DISTORTIONS.map((distortion) => {
                    const active = selectedDistortions.has(distortion.id);
                    return (
                      <Pressable
                        key={distortion.id}
                        onPress={() => toggleDistortion(distortion.id)}
                        style={[styles.distortionCard, active && styles.distortionCardActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={distortion.name}
                      >
                        <View style={styles.distortionRow}>
                          <View style={[styles.distortionCheck, active && styles.distortionCheckActive]}>
                            {active && <Ionicons name="checkmark" size={13} color={COLORS.bg} />}
                          </View>
                          <Text style={[styles.distortionName, active && styles.distortionNameActive]}>
                            {distortion.name}
                          </Text>
                        </View>
                        <Text style={styles.distortionDefinition}>{distortion.definition}</Text>
                        <Text style={styles.distortionExample}>{distortion.example}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={styles.textInput}
                  placeholder={step.placeholder}
                  placeholderTextColor={COLORS.fgSecondary}
                  multiline
                  textAlignVertical="top"
                  value={answer}
                  onChangeText={setAnswer}
                />
              )}

              <Pressable
                onPress={submitAnswer}
                disabled={!canSubmit}
                style={[BUTTON.primary, styles.marginTop, !canSubmit && styles.disabled]}
                accessibilityRole="button"
                accessibilityLabel="submit answer"
              >
                <Text style={BUTTON.primaryText}>{isLastStep ? 'finish' : 'continue'}</Text>
              </Pressable>
            </>
          )}
        </>
      )}

      {/* Loading spinner */}
      {(status === 'loading-response') && (
        <View style={styles.loadingRow}>
          <View style={styles.aiMessageIcon}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.accent} />
          </View>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      )}

      {/* Error state */}
      {status === 'error' && (
        <View style={[SURFACE.card, styles.stateCard]}>
          <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
          <Text style={styles.stateTitle}>something went wrong</Text>
          <Text style={styles.stateBody}>{errorMessage}</Text>
          <Pressable onPress={restart} style={[BUTTON.ghost, styles.marginTop]}>
            <Text style={BUTTON.ghostText}>try again</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: S.lg,
    paddingBottom: S.huge,
    gap: S.md,
  },
  overviewCard: {
    gap: S.sm,
  },
  overview: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
  },
  source: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  cautionCard: {
    gap: S.sm,
  },
  cautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
  },
  cautionHeading: {
    ...TYPE.secondary,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cautionRow: {
    flexDirection: 'row',
    gap: S.sm,
  },
  cautionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 7,
  },
  cautionText: {
    ...TYPE.secondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  crisisBanner: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224,96,96,0.22)',
    backgroundColor: 'rgba(224,96,96,0.06)',
    padding: S.md,
    gap: S.xs,
  },
  crisisBannerProminent: {
    borderColor: 'rgba(224,96,96,0.40)',
    backgroundColor: 'rgba(224,96,96,0.12)',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.xs,
    marginBottom: 2,
  },
  crisisHeading: {
    ...TYPE.secondary,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.danger,
    letterSpacing: 0.5,
  },
  crisisLine: {
    ...TYPE.secondary,
    fontSize: 13,
  },
  crisisDetail: {
    color: COLORS.fg,
    fontWeight: '600',
  },
  crisisNote: {
    ...TYPE.secondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: S.xs,
  },
  progressRow: {
    flexDirection: 'row',
    gap: S.xs,
  },
  progressDot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.accent,
  },
  progressDotDone: {
    backgroundColor: COLORS.accentBorder,
  },
  aiMessage: {
    flexDirection: 'row',
    gap: S.sm,
    paddingHorizontal: S.xs,
  },
  aiMessageIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.accentBorder,
    backgroundColor: COLORS.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiMessageText: {
    ...TYPE.body,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  stepTitle: {
    ...TYPE.heading,
    fontSize: 19,
  },
  stepPrompt: {
    ...TYPE.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: S.xs,
  },
  stepHelper: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: S.xs,
  },
  textInput: {
    ...TYPE.body,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    minHeight: 120,
    padding: S.md,
    marginTop: S.md,
  },
  distortionList: {
    gap: S.sm,
    marginTop: S.md,
  },
  distortionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.md,
    gap: S.xs,
  },
  distortionCardActive: {
    backgroundColor: COLORS.accentSoft,
    borderColor: COLORS.accentBorder,
  },
  distortionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
  },
  distortionCheck: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distortionCheckActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  distortionName: {
    ...TYPE.body,
    fontSize: 14,
    fontWeight: '600',
  },
  distortionNameActive: {
    color: COLORS.accent,
  },
  distortionDefinition: {
    ...TYPE.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  distortionExample: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  continueButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: S.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    paddingHorizontal: S.xs,
  },
  closingCard: {
    gap: S.sm,
  },
  closingIcon: {
    marginBottom: S.xs,
  },
  marginTop: {
    marginTop: S.sm,
  },
  disabled: {
    opacity: 0.4,
  },
  stateCard: {
    gap: S.md,
    alignItems: 'flex-start',
  },
  stateTitle: {
    ...TYPE.heading,
    fontSize: 17,
  },
  stateBody: {
    ...TYPE.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontFamily: 'monospace',
    color: COLORS.fg,
  },
});
