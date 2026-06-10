import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { BUTTON, COLORS, RADIUS, S, SURFACE, TYPE } from '../constants/theme';

export const AI_CONSENT_KEY = '@inner_light/ai_guided_consent_accepted';

interface AiGuidedConsentProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Shown once, before a person's first AI-guided session — gates the feature
 * on an explicit, informed "I understand and agree" rather than implied
 * consent buried in a terms-of-service page.
 */
export default function AiGuidedConsent({ visible, onAccept, onDecline }: AiGuidedConsentProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.accent} />
          </View>
          <Text style={styles.title}>Before your first AI-guided session</Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.paragraph}>
              This mode uses an AI model to offer prompts, questions, and reflections as you work
              through a CBT-based exercise. Please read this through before continuing.
            </Text>

            <View style={styles.point}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.fgSecondary} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointEmphasis}>This is a self-help tool, not therapy. </Text>
                It is not a licensed therapist, clinician, or medical device, and it does not
                diagnose, treat, or provide a substitute for professional mental healthcare. If
                you're working with a therapist, consider bringing what comes up here into that
                relationship.
              </Text>
            </View>

            <View style={styles.point}>
              <Ionicons name="person-outline" size={18} color={COLORS.fgSecondary} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointEmphasis}>You are responsible for your own wellbeing. </Text>
                You alone are responsible for how you use this tool, for the choices you make
                during and after a session, and for your own emotional and physical state while
                using it. If at any point this feels like too much, you're free to stop —
                pausing is always a valid choice.
              </Text>
            </View>

            <View style={styles.point}>
              <Ionicons name="warning-outline" size={18} color={COLORS.fgSecondary} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={styles.pointEmphasis}>AI responses can be wrong. </Text>
                The model may misunderstand you, generalize, or say something that doesn't fit —
                treat what it offers as a starting point for your own reflection, not as
                professional advice or fact about you.
              </Text>
            </View>

            <View style={[styles.point, styles.crisisPoint]}>
              <Ionicons name="medical-outline" size={18} color={COLORS.danger} style={styles.pointIcon} />
              <Text style={styles.pointText}>
                <Text style={[styles.pointEmphasis, { color: COLORS.danger }]}>
                  This is not a crisis service.{' '}
                </Text>
                If you are in crisis, in danger, or having thoughts of harming yourself, please
                reach out to people who can help right now — for example the{' '}
                <Text style={styles.pointEmphasis}>988 Suicide & Crisis Lifeline</Text> (call or
                text <Text style={styles.pointEmphasis}>988</Text> in the US),{' '}
                <Text style={styles.pointEmphasis}>Samaritans</Text> (
                <Text style={styles.pointEmphasis}>116 123</Text> in the UK & Ireland), your local
                emergency number, or a trusted person nearby. This tool is not equipped to
                provide that kind of support.
              </Text>
            </View>

            <Text style={styles.agreement}>
              By tapping "I understand and agree," you confirm that you've read the above, that
              you are choosing to use this AI-guided mode of your own accord, and that you — not
              this app or its AI — remain responsible for your own state and choices while using
              it.
            </Text>
          </ScrollView>

          <Pressable onPress={onAccept} style={[BUTTON.primary, styles.acceptButton]} accessibilityRole="button" accessibilityLabel="I understand and agree">
            <Text style={BUTTON.primaryText}>I understand and agree</Text>
          </Pressable>
          <Pressable onPress={onDecline} style={styles.declineButton} accessibilityRole="button" accessibilityLabel="Not right now, use self-guided instead">
            <Text style={styles.declineText}>not right now — use self-guided instead</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13,13,15,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: S.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentSoft,
    marginBottom: S.sm,
  },
  title: {
    ...TYPE.heading,
    fontSize: 19,
    marginBottom: S.sm,
  },
  body: {
    marginBottom: S.md,
  },
  paragraph: {
    ...TYPE.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: S.md,
  },
  point: {
    flexDirection: 'row',
    gap: S.sm,
    marginBottom: S.md,
  },
  pointIcon: {
    marginTop: 2,
  },
  pointText: {
    ...TYPE.secondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  pointEmphasis: {
    color: COLORS.fg,
    fontWeight: '600',
  },
  crisisPoint: {
    backgroundColor: 'rgba(224,96,96,0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(224,96,96,0.22)',
    padding: S.md,
    marginHorizontal: -S.xs,
  },
  agreement: {
    ...TYPE.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  acceptButton: {
    marginTop: S.xs,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: S.sm,
    marginTop: S.xs,
  },
  declineText: {
    ...TYPE.secondary,
    fontSize: 13,
  },
});
