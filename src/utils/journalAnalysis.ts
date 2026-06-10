import { generateStructured } from './gemini';
import { JournalEntry } from '../hooks/useIdentity';

// ---------------------------------------------------------------------------
// Per-entry "hot cross bun" modality extraction
// ---------------------------------------------------------------------------

export interface HotCrossBunAnalysis {
  thoughts: string[];
  feelings: string[];
  behaviors: string[];
  physicalSymptoms: string[];
  reflection: string;
}

const HOT_CROSS_BUN_SCHEMA = {
  type: 'object',
  properties: {
    thoughts: { type: 'array', items: { type: 'string' }, description: 'Short phrases capturing the writer’s thoughts or interpretations — each one a genuinely distinct idea, never a reworded restatement of another item in this list.' },
    feelings: { type: 'array', items: { type: 'string' }, description: 'Short phrases naming emotions present in the entry — each one a distinct emotion, never a near-synonym of another item already listed (e.g. list "anxious" or "on edge", not both).' },
    behaviors: { type: 'array', items: { type: 'string' }, description: 'Short phrases describing actions, avoidances, or behavioral responses.' },
    physicalSymptoms: { type: 'array', items: { type: 'string' }, description: 'Short phrases naming bodily sensations or physical symptoms.' },
    reflection: { type: 'string', description: 'One warm, non-clinical sentence summarizing the emotional arc of the entry.' },
  },
  required: ['thoughts', 'feelings', 'behaviors', 'physicalSymptoms', 'reflection'],
};

export async function analyzeEntryModalities(entryText: string): Promise<HotCrossBunAnalysis> {
  const prompt = `You are a compassionate, CBT-informed journaling companion. Read the diary entry below and map it onto the "hot cross bun" model, which separates an experience into four linked modalities: Thoughts, Feelings (emotions), Behaviors (actions/responses), and Physical symptoms (bodily sensations).

For each modality, extract 0-4 short phrases (3-7 words) that are genuinely present or strongly implied in the text — quote or closely paraphrase the writer's own words. Leave a modality's array empty if it truly isn't present; do not invent content.

Keep "thoughts" and "feelings" tight and non-redundant: each phrase in a list must name a genuinely distinct thought or emotion, not a rewording, near-synonym, or restatement of another phrase already in that same list (e.g. don't list both "worried about the deadline" and "stressed about the deadline" — pick the one closer to the writer's own words and drop the rest). When in doubt, prefer fewer, sharper, more differentiated items over a longer list that says the same thing twice.

Then write one warm, plain-language sentence reflecting on the entry's emotional arc.

Entry:
"""
${entryText}
"""`;

  return generateStructured<HotCrossBunAnalysis>(prompt, HOT_CROSS_BUN_SCHEMA);
}

// ---------------------------------------------------------------------------
// Per-entry "downward arrow" — traces a surface worry down through layered
// "if that were true, what would that mean?" questions to the core belief
// underneath, then reality-checks and reframes it.
// ---------------------------------------------------------------------------

export interface DownwardArrowEmotion {
  name: string;
  intensity: number;
}

export interface DownwardArrowStep {
  question: string;
  answer: string;
}

export interface DownwardArrowAnalysis {
  trigger: string;
  emotions: DownwardArrowEmotion[];
  automaticThought: string;
  chain: DownwardArrowStep[];
  coreBeliefs: string[];
  evidenceFor: string[];
  evidenceAgainst: string[];
  reframes: string[];
}

const DOWNWARD_ARROW_SCHEMA = {
  type: 'object',
  properties: {
    trigger: { type: 'string', description: 'One plain sentence naming the specific situation that set this off — "what happened?"' },
    emotions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'A single emotion word, e.g. "Anxiety".' },
          intensity: { type: 'integer', description: 'Estimated intensity from 0-100, based on the language and emphasis used.' },
        },
        required: ['name', 'intensity'],
      },
      description: '1-3 distinct emotions named or strongly implied in the entry, each with an estimated intensity. Never list near-synonyms of the same feeling.',
    },
    automaticThought: { type: 'string', description: 'The writer\'s immediate, reflexive interpretation of the trigger — quote or closely paraphrase their own words.' },
    chain: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string', description: 'A downward-arrow probe, e.g. "If that were true, what would be so bad about that?" or "...what would that mean about you?"' },
          answer: { type: 'string', description: 'A one-sentence answer in the writer\'s plausible voice — each layer should go meaningfully deeper than the last.' },
        },
        required: ['question', 'answer'],
      },
      description: '3-5 question/answer pairs that walk the automatic thought downward, layer by layer, ending at a global, identity-level statement (e.g. "I\'m not good enough").',
    },
    coreBeliefs: { type: 'array', items: { type: 'string' }, description: '1-3 distinct candidate phrasings of the core belief this chain circles (e.g. "I am not good enough", "My worth depends on achievement"). Each phrasing should capture a meaningfully different angle, not a reword of another.' },
    evidenceFor: { type: 'array', items: { type: 'string' }, description: 'A few short, fair phrases noting any real evidence in the entry that could seem to support the core belief.' },
    evidenceAgainst: { type: 'array', items: { type: 'string' }, description: 'A few short, fair phrases — grounded in the entry or reasonable inference — that complicate or contradict the core belief. Be genuinely kind here, not dismissive.' },
    reframes: { type: 'array', items: { type: 'string' }, description: '1-2 gentler, more accurate alternative statements that could stand in for the core belief.' },
  },
  required: ['trigger', 'emotions', 'automaticThought', 'chain', 'coreBeliefs', 'evidenceFor', 'evidenceAgainst', 'reframes'],
};

export async function analyzeDownwardArrow(entryText: string): Promise<DownwardArrowAnalysis> {
  const prompt = `You are a compassionate, CBT-informed journaling companion guiding someone through the "Downward Arrow" technique — tracing a surface-level worry down to the core belief underneath it, then reality-checking that belief.

Read the diary entry below and walk through the technique on the writer's behalf:

1. Name the specific trigger — what happened.
2. Name 1-3 distinct emotions present, each with a rough intensity (0-100). Don't list near-synonyms of the same feeling.
3. Identify the automatic thought — their immediate, reflexive interpretation of the trigger.
4. Build a downward-arrow chain of 3-5 steps. Each step asks some version of "If that were true, what would be so bad about that?" / "...what would that mean?" / "...what would that mean about you?" — and each answer should go one layer deeper than the last, ending at a global, identity-level statement.
5. Name 1-3 candidate core beliefs the chain seems to circle — each a genuinely distinct angle, not a reworded repeat of another.
6. List a few short, fair points of evidence for and against that core belief. Keep "evidence against" genuinely plausible and kind — this is where the relief usually starts.
7. Offer 1-2 gentler, more accurate reframes of the core belief.

Stay grounded in what's actually written or strongly implied — paraphrase the writer's own words and voice rather than inventing detail. If the entry is too brief or light to support a full chain, keep each layer short and honest rather than padding it out.

Entry:
"""
${entryText}
"""`;

  return generateStructured<DownwardArrowAnalysis>(prompt, DOWNWARD_ARROW_SCHEMA);
}

// ---------------------------------------------------------------------------
// Per-entry cognitive distortion check — once an automatic thought has
// surfaced (via the downward arrow), test it against common thinking traps.
// ---------------------------------------------------------------------------

export interface CognitiveDistortionFinding {
  distortion: string;
  evidence: string;
  note: string;
}

export interface CognitiveDistortionAnalysis {
  findings: CognitiveDistortionFinding[];
}

const COGNITIVE_DISTORTION_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          distortion: { type: 'string', description: 'The name of a specific thinking trap, e.g. "Catastrophizing", "Mind-reading", "Fortune-telling", "All-or-nothing thinking", "Emotional reasoning".' },
          evidence: { type: 'string', description: 'A short quote or close paraphrase from the entry showing this pattern in action.' },
          note: { type: 'string', description: 'One plain, kind sentence on how this interpretation goes beyond what the situation actually shows.' },
        },
        required: ['distortion', 'evidence', 'note'],
      },
      description: 'Only the thinking traps genuinely present — it is common and healthy for this to contain just one, two, or even none. Do not stretch to fill the list.',
    },
  },
  required: ['findings'],
};

export async function analyzeCognitiveDistortions(automaticThought: string, entryText: string): Promise<CognitiveDistortionAnalysis> {
  const prompt = `You are a compassionate, CBT-informed journaling companion. A recent journal entry surfaced this automatic thought:

"${automaticThought}"

Here is the entry it came from, for context:
"""
${entryText}
"""

Gently check this thought against common cognitive distortions — patterns where a thought goes beyond what the situation actually shows:
- Catastrophizing (assuming the worst-case outcome)
- Mind-reading (assuming you know what someone else is thinking)
- Fortune-telling (predicting the future as settled fact)
- All-or-nothing thinking (collapsing a situation into absolute, binary terms)
- Emotional reasoning (treating a feeling as proof of a fact)

Only name the ones that genuinely fit this specific thought — it is completely normal, and often a good sign, for a thought to show just one, two, or none of these. For each one that truly fits, point to the specific phrase that reveals it and explain, kindly and plainly, how the interpretation outruns the facts at hand.`;

  return generateStructured<CognitiveDistortionAnalysis>(prompt, COGNITIVE_DISTORTION_SCHEMA);
}

// ---------------------------------------------------------------------------
// Cross-entry cognitive schema extraction (core beliefs / dysfunctional
// assumptions / negative automatic thoughts) — informed by the layered CBT
// schema model described in arXiv:2403.16008.
// ---------------------------------------------------------------------------

export interface SchemaFinding {
  statement: string;
  evidence: string[];
}

export interface CognitiveSchemaAnalysis {
  coreBeliefs: SchemaFinding[];
  dysfunctionalAssumptions: SchemaFinding[];
  negativeAutomaticThoughts: SchemaFinding[];
  reflection: string;
}

const SCHEMA_FINDING_SCHEMA = {
  type: 'object',
  properties: {
    statement: { type: 'string', description: 'The belief/assumption/thought stated plainly, in the writer’s implied voice (e.g. "I am not enough unless I am productive").' },
    evidence: { type: 'array', items: { type: 'string' }, description: '1-3 short quotes or close paraphrases from entries that support this finding.' },
  },
  required: ['statement', 'evidence'],
};

const COGNITIVE_SCHEMA_SCHEMA = {
  type: 'object',
  properties: {
    coreBeliefs: {
      type: 'array',
      items: SCHEMA_FINDING_SCHEMA,
      description: 'Deep, trait-like beliefs about the self, others, or the world (e.g. "I am unlovable", "People always leave").',
    },
    dysfunctionalAssumptions: {
      type: 'array',
      items: SCHEMA_FINDING_SCHEMA,
      description: 'Conditional "if/then" rules the writer seems to live by (e.g. "If I am not perfect, I will be rejected").',
    },
    negativeAutomaticThoughts: {
      type: 'array',
      items: SCHEMA_FINDING_SCHEMA,
      description: 'Specific, situational, reflexive negative thoughts that recur across entries (e.g. "I am going to mess this up").',
    },
    reflection: { type: 'string', description: '2-3 warm, validating sentences that gently summarize these patterns without pathologizing the writer.' },
  },
  required: ['coreBeliefs', 'dysfunctionalAssumptions', 'negativeAutomaticThoughts', 'reflection'],
};

export async function analyzeCognitiveSchemas(entries: JournalEntry[]): Promise<CognitiveSchemaAnalysis> {
  const corpus = formatCorpus(entries);
  const prompt = `You are a CBT-informed journaling companion helping someone gently notice recurring thinking patterns across their own journal entries — the way a thoughtful therapist might, never diagnostic or alarmist.

Using the layered cognitive model (core beliefs → dysfunctional assumptions → negative automatic thoughts), read the dated entries below and identify patterns that show up more than once. For each finding, phrase it plainly in the writer's implied voice and back it with short quotes/paraphrases as evidence. Only surface patterns with real textual support — fewer, well-evidenced findings are better than many speculative ones. It is fine for a category to have zero entries.

Entries:
${corpus}`;

  return generateStructured<CognitiveSchemaAnalysis>(prompt, COGNITIVE_SCHEMA_SCHEMA);
}

// ---------------------------------------------------------------------------
// Emotional trajectory — sentiment & discrete emotion mining over time
// ---------------------------------------------------------------------------

export interface EmotionPoint {
  entryId: string;
  date: string;
  valence: number; // -1 (very negative) .. 1 (very positive)
  dominantEmotion: string;
  emotions: string[];
}

export interface EmotionTrajectoryAnalysis {
  points: EmotionPoint[];
  cycles: string[];
  reflection: string;
}

const EMOTION_TRAJECTORY_SCHEMA = {
  type: 'object',
  properties: {
    points: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          entryId: { type: 'string' },
          date: { type: 'string' },
          valence: { type: 'number', description: 'Overall emotional valence from -1 (very negative) to 1 (very positive).' },
          dominantEmotion: { type: 'string', description: 'The single strongest discrete emotion, e.g. "anxiety", "joy", "frustration", "calm".' },
          emotions: { type: 'array', items: { type: 'string' }, description: 'Up to 3 discrete emotions present, beyond simple positive/negative.' },
        },
        required: ['entryId', 'date', 'valence', 'dominantEmotion', 'emotions'],
      },
    },
    cycles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Short observations linking emotional baselines to days-of-week or calendar cycles, e.g. "Sunday entries skew anxious, often about the week ahead."',
    },
    reflection: { type: 'string', description: '2-3 warm sentences summarizing the overall emotional trajectory across the entries.' },
  },
  required: ['points', 'cycles', 'reflection'],
};

export async function analyzeEmotionalTrajectory(entries: JournalEntry[]): Promise<EmotionTrajectoryAnalysis> {
  const corpus = formatCorpus(entries);
  const prompt = `You are an emotion-mining assistant. For each dated journal entry below, assign an overall emotional valence from -1 (very negative) to 1 (very positive), name its single dominant discrete emotion (beyond just "positive"/"negative" — e.g. anxiety, joy, frustration, loneliness, relief, pride, calm), and list up to 3 discrete emotions present.

Then, looking across all entries together, note any patterns linking emotional baselines to days of the week or calendar cycles (e.g. "Mondays trend more stressed", "entries near month-end mention money more and skew anxious"). Only state cycle observations you can actually support from the dates given.

Each point must use the entry's exact "id" and "date" from below.

Entries:
${corpus}`;

  return generateStructured<EmotionTrajectoryAnalysis>(prompt, EMOTION_TRAJECTORY_SCHEMA);
}

// ---------------------------------------------------------------------------
// Topic modeling — LDA-style latent theme clustering (LLM-assisted stand-in)
// ---------------------------------------------------------------------------

export interface TopicCluster {
  theme: string;
  keywords: string[];
  entryIds: string[];
  description: string;
}

export interface TopicAnalysis {
  topics: TopicCluster[];
  reflection: string;
}

const TOPIC_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          theme: { type: 'string', description: 'A short, human name for this latent theme, e.g. "Work stress", "Creative momentum".' },
          keywords: { type: 'array', items: { type: 'string' }, description: '4-8 words/short phrases from the entries whose co-occurrence defines this theme.' },
          entryIds: { type: 'array', items: { type: 'string' }, description: 'Ids of entries (from the "id" field) where this theme clearly appears.' },
          description: { type: 'string', description: 'One sentence describing what this theme tends to look like when it shows up.' },
        },
        required: ['theme', 'keywords', 'entryIds', 'description'],
      },
    },
    reflection: { type: 'string', description: 'One or two sentences on how these themes relate to each other.' },
  },
  required: ['topics', 'reflection'],
};

export async function analyzeTopics(entries: JournalEntry[]): Promise<TopicAnalysis> {
  const corpus = formatCorpus(entries);
  const prompt = `You are performing topic modeling (in the spirit of LDA — Latent Dirichlet Allocation) on a personal journal: clustering the vocabulary into a small number of distinct latent themes based on which words and phrases tend to co-occur, e.g. noticing that "deadline", "chest-tightness", and "coffee" cluster into a "Work stress" theme.

Identify 2-5 clear latent themes from the entries below. For each, name it, list the co-occurring words/phrases that define it, cite which entry ids it appears in, and describe what it looks like in one sentence.

Entries:
${corpus}`;

  return generateStructured<TopicAnalysis>(prompt, TOPIC_ANALYSIS_SCHEMA);
}

// ---------------------------------------------------------------------------
// Stylometry & linguistic fingerprinting — computed locally (no LLM): pure
// word-frequency statistics are something simple counting does more reliably
// than a language model, and it costs nothing to run on every entry.
// ---------------------------------------------------------------------------

export interface StylometrySnapshot {
  entryId: string;
  date: string;
  selfPronounRatio: number;   // I/me/my/mine/myself  ÷ all first/second/third-person pronouns
  groupPronounRatio: number;  // we/us/our/ours        ÷ all first/second/third-person pronouns
  otherPronounRatio: number;  // they/them/their/etc.  ÷ all first/second/third-person pronouns
  absoluteWordRate: number;   // absolute words ("always","never",...) per 100 words
  wordCount: number;
}

export interface StylometryAnalysis {
  snapshots: StylometrySnapshot[];
  selfFocusTrend: 'rising' | 'falling' | 'steady';
  absoluteLanguageTrend: 'rising' | 'falling' | 'steady';
  note: string;
}

const SELF_PRONOUNS = ['i', 'me', 'my', 'mine', 'myself'];
const GROUP_PRONOUNS = ['we', 'us', 'our', 'ours', 'ourselves'];
const OTHER_PRONOUNS = ['they', 'them', 'their', 'theirs', 'themselves', 'he', 'him', 'his', 'she', 'her', 'hers'];
const ABSOLUTE_WORDS = ['always', 'never', 'completely', 'totally', 'everyone', 'everybody', 'nobody', 'no one', 'everything', 'nothing', 'every time', 'all the time', 'forever', 'impossible', 'constantly'];

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []);
}

function countOccurrences(words: string[], text: string, vocabulary: string[]): number {
  let total = 0;
  for (const term of vocabulary) {
    if (term.includes(' ')) {
      total += text.split(term).length - 1;
    } else {
      total += words.filter((w) => w === term).length;
    }
  }
  return total;
}

function trendOf(values: number[]): 'rising' | 'falling' | 'steady' {
  if (values.length < 2) return 'steady';
  const mid = Math.floor(values.length / 2);
  const earlier = values.slice(0, mid);
  const later = values.slice(mid);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const delta = avg(later) - avg(earlier);
  if (delta > 0.04) return 'rising';
  if (delta < -0.04) return 'falling';
  return 'steady';
}

export function computeStylometry(entries: JournalEntry[]): StylometryAnalysis {
  const chronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  const snapshots: StylometrySnapshot[] = chronological.map((entry) => {
    const lower = entry.response.toLowerCase();
    const words = tokenize(lower);
    const wordCount = words.length || 1;

    const selfCount = countOccurrences(words, lower, SELF_PRONOUNS);
    const groupCount = countOccurrences(words, lower, GROUP_PRONOUNS);
    const otherCount = countOccurrences(words, lower, OTHER_PRONOUNS);
    const pronounTotal = selfCount + groupCount + otherCount || 1;
    const absoluteCount = countOccurrences(words, lower, ABSOLUTE_WORDS);

    return {
      entryId: entry.id,
      date: entry.date,
      selfPronounRatio: selfCount / pronounTotal,
      groupPronounRatio: groupCount / pronounTotal,
      otherPronounRatio: otherCount / pronounTotal,
      absoluteWordRate: (absoluteCount / wordCount) * 100,
      wordCount,
    };
  });

  const selfFocusTrend = trendOf(snapshots.map((s) => s.selfPronounRatio));
  const absoluteLanguageTrend = trendOf(snapshots.map((s) => s.absoluteWordRate / 10));

  const notes: string[] = [];
  if (selfFocusTrend === 'rising') notes.push('your language has been turning further inward — more "I/me" relative to "we" or "they"');
  else if (selfFocusTrend === 'falling') notes.push('your language has been opening outward — more "we" and "they" relative to "I/me"');
  if (absoluteLanguageTrend === 'rising') notes.push('absolute words like "always" and "never" have been showing up more often, which can be worth noticing gently');
  else if (absoluteLanguageTrend === 'falling') notes.push('absolute language ("always", "never") has been easing — your entries read a little more measured lately');

  const note = notes.length
    ? `Lately, ${notes.join('; and ')}.`
    : 'Your pronoun use and absolute-language rate have stayed fairly steady across these entries.';

  return { snapshots, selfFocusTrend, absoluteLanguageTrend, note };
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const MAX_CORPUS_ENTRIES = 60;

function formatCorpus(entries: JournalEntry[]): string {
  const chronological = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_CORPUS_ENTRIES);

  return chronological
    .map((entry) => `- id: ${entry.id} | date: ${entry.date.slice(0, 10)}\n  "${entry.response.replace(/\s+/g, ' ').trim()}"`)
    .join('\n');
}
