// AI-guided CBT worksheet session logic — each function drives one turn of the
// conversation, staying tightly within the official technique's structure and
// following safe-messaging principles throughout.
//
// Safety design: every prompt instructs the model to flag `needsSupport: true`
// if the person's text suggests they may be in crisis, at risk, or in danger.
// The calling UI is expected to branch on this flag and show crisis resources
// rather than continuing the exercise — see AiGuidedWorksheet.tsx.

import { generateStructured } from './gemini';
import { CbtWorksheet, WorksheetStep } from '../data/cbt-worksheets';

export interface StepHistory {
  stepTitle: string;
  prompt: string;
  answer: string;
}

export interface GuidedStepResponse {
  reflection: string;
  nextPrompt: string;
  needsSupport: boolean;
}

export interface GuidedClosingResponse {
  closing: string;
}

const GUIDED_STEP_SCHEMA = {
  type: 'object',
  properties: {
    reflection: {
      type: 'string',
      description:
        '1–2 short, warm sentences responding directly and specifically to what the person just wrote. Never generic, never filler. Validate what was real in it, notice something specific, or gently reflect something back in their own words. If needsSupport is true, write a gentle, non-alarmist acknowledgement of what they shared and a soft encouragement to speak with a real person who can support them — do not continue the exercise.',
    },
    nextPrompt: {
      type: 'string',
      description:
        'A personalized version of the next question, naturally woven from the person\'s own words and what they\'ve shared. Keep it within the official intent of the upcoming step. If needsSupport is true, leave this empty.',
    },
    needsSupport: {
      type: 'boolean',
      description:
        'Set to true ONLY if the person\'s latest answer contains clear signs of a crisis, active self-harm, suicidal thoughts, or immediate danger to themselves or others. False for all other content, including distress, sadness, or difficult emotions — those are expected in this work and should be met with warmth, not alarm.',
    },
  },
  required: ['reflection', 'nextPrompt', 'needsSupport'],
};

const GUIDED_CLOSING_SCHEMA = {
  type: 'object',
  properties: {
    closing: {
      type: 'string',
      description:
        '2–4 warm, plain sentences reflecting on what emerged through the session as a whole — specific to what this person shared, never generic. Affirm the work of having gone through it. Never prescriptive ("you should..."), never diagnostic ("this means you have..."), never minimizing ("it\'s not that bad"). End with one open-ended, forward-looking thought — not an action item, just something to carry.',
    },
  },
  required: ['closing'],
};

function buildSystemPreamble(worksheet: CbtWorksheet): string {
  return `You are a compassionate, thoughtful guide helping someone work through the "${worksheet.toolId.replace(/-/g, ' ')}" CBT technique in a personal wellbeing app.

IMPORTANT CONSTRAINTS — read these carefully:
• You are NOT a therapist, clinician, or medical professional, and must never present yourself as one.
• You must NEVER diagnose, prescribe, give clinical advice, or make definitive claims about the person's mental state.
• You must NEVER interpret their words more firmly than they did — if they're uncertain, you stay uncertain alongside them.
• You must NEVER use pathologizing or clinical language (e.g. "disorder", "symptom", "diagnosis", "treatment").
• Keep ALL responses SHORT (1–3 sentences total). This is a companion app, not a therapy transcript.
• If the person's text suggests they are in crisis, in danger, or having thoughts of self-harm, set needsSupport=true, respond with a brief, warm acknowledgement, and a gentle pointer toward real human support. Do not continue the exercise.
• Safe-messaging guidelines apply — never reinforce or elaborate on suicidal ideation; simply, warmly redirect.`;
}

function formatHistory(history: StepHistory[]): string {
  if (history.length === 0) return '(This is the very beginning of the session — the person is just starting.)';
  return history.map((h, i) => `Step ${i + 1} — ${h.stepTitle}\nPrompt: ${h.prompt}\nTheir answer: "${h.answer}"`).join('\n\n');
}

export async function generateGuidedStepResponse(
  worksheet: CbtWorksheet,
  history: StepHistory[],
  currentStep: WorksheetStep,
  userAnswer: string,
  nextStep: WorksheetStep | null,
): Promise<GuidedStepResponse> {
  const prompt = `${buildSystemPreamble(worksheet)}

TECHNIQUE CONTEXT:
${worksheet.overview}

SESSION SO FAR:
${formatHistory(history)}

CURRENT STEP — "${currentStep.title}":
Official prompt: ${currentStep.prompt}
Their answer: "${userAnswer}"

${nextStep ? `NEXT STEP — "${nextStep.title}":
Official prompt: ${nextStep.prompt}
${nextStep.helper ? `Guidance note: ${nextStep.helper}` : ''}

Your task: (1) Reflect warmly on what they just shared. (2) Introduce the next step with a personalized version of the prompt above, woven naturally from their words.` : `This was the final step. Reflect warmly on what they wrote. Leave nextPrompt empty.`}

Remember: if their answer shows any sign of crisis or self-harm, set needsSupport=true and respond with warmth + a gentle redirect toward real support.`;

  return generateStructured<GuidedStepResponse>(prompt, GUIDED_STEP_SCHEMA);
}

export async function generateGuidedClosing(
  worksheet: CbtWorksheet,
  history: StepHistory[],
): Promise<GuidedClosingResponse> {
  const prompt = `${buildSystemPreamble(worksheet)}

TECHNIQUE CONTEXT:
${worksheet.overview}

FULL SESSION:
${formatHistory(history)}

Now write a closing reflection (2–4 sentences) for this person, based entirely on what they actually shared — not a generic closing. Affirm the work of having gone through this. Never prescriptive, never diagnostic. End with one open-ended thought to carry forward, not an action item.`;

  return generateStructured<GuidedClosingResponse>(prompt, GUIDED_CLOSING_SCHEMA);
}
