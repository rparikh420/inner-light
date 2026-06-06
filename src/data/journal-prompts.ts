export interface JournalPrompt {
  id: number;
  category: 'identity' | 'beliefs' | 'systems' | 'actions' | 'reflection';
  prompt: string;
  followUp?: string;
  icon: string;
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // ── Identity ──────────────────────────────────────────────
  {
    id: 1,
    category: 'identity',
    prompt: 'Who am I becoming through the choices I make each day?',
    followUp: 'What version of yourself feels most alive and authentic?',
    icon: 'person-outline',
  },
  {
    id: 2,
    category: 'identity',
    prompt: 'What parts of myself have I outgrown but still carry?',
    followUp: 'What would it feel like to gently release them?',
    icon: 'leaf-outline',
  },
  {
    id: 3,
    category: 'identity',
    prompt: 'When do I feel most aligned with my true self?',
    followUp: 'How can I create more of those moments?',
    icon: 'compass-outline',
  },
  {
    id: 4,
    category: 'identity',
    prompt: 'What story do I tell myself about who I am, and is it still true?',
    followUp: 'If you could rewrite that story starting today, what would it say?',
    icon: 'book-outline',
  },
  {
    id: 5,
    category: 'identity',
    prompt: 'What qualities in others do I admire that already exist within me?',
    followUp: 'How might you nurture those qualities this week?',
    icon: 'diamond-outline',
  },
  {
    id: 6,
    category: 'identity',
    prompt: 'If fear had no hold on me, how would I show up differently?',
    followUp: 'What is one way you can embody that fearless version today?',
    icon: 'flame-outline',
  },

  // ── Beliefs ───────────────────────────────────────────────
  {
    id: 7,
    category: 'beliefs',
    prompt: 'What do I believe is possible for my life that I have not yet pursued?',
    followUp: 'What is the first barrier between you and that possibility?',
    icon: 'bulb-outline',
  },
  {
    id: 8,
    category: 'beliefs',
    prompt: 'What limiting belief has quietly shaped my decisions without my permission?',
    followUp: 'Where did that belief originate, and does it still serve you?',
    icon: 'lock-closed-outline',
  },
  {
    id: 9,
    category: 'beliefs',
    prompt: 'What would change if I truly believed I was enough, right now?',
    followUp: 'How would your daily life look different with that belief?',
    icon: 'heart-outline',
  },
  {
    id: 10,
    category: 'beliefs',
    prompt: 'What assumption about the world am I holding that might not be accurate?',
    followUp: 'What evidence exists that challenges this assumption?',
    icon: 'globe-outline',
  },
  {
    id: 11,
    category: 'beliefs',
    prompt: 'What do I believe about failure, and how does that belief affect my willingness to try?',
    followUp: 'Can you recall a failure that ultimately led to growth?',
    icon: 'trending-up-outline',
  },
  {
    id: 12,
    category: 'beliefs',
    prompt: 'If I could install one new belief deep in my core, what would it be?',
    followUp: 'What daily practice would reinforce this belief?',
    icon: 'sparkles-outline',
  },

  // ── Systems ───────────────────────────────────────────────
  {
    id: 13,
    category: 'systems',
    prompt: 'What daily practice serves my growth the most, and am I protecting it?',
    followUp: 'What gets in the way of consistency, and how can you design around it?',
    icon: 'sync-outline',
  },
  {
    id: 14,
    category: 'systems',
    prompt: 'What environment or routine brings out my best thinking?',
    followUp: 'How can you make that environment more accessible?',
    icon: 'settings-outline',
  },
  {
    id: 15,
    category: 'systems',
    prompt: 'Where am I relying on willpower when I should be building a system?',
    followUp: 'What is one system you could put in place this week?',
    icon: 'construct-outline',
  },
  {
    id: 16,
    category: 'systems',
    prompt: 'What habit no longer serves me but persists out of comfort?',
    followUp: 'What could you replace it with that aligns with who you are becoming?',
    icon: 'swap-horizontal-outline',
  },
  {
    id: 17,
    category: 'systems',
    prompt: 'How do I design my mornings to set the tone for the day I want?',
    followUp: 'What is the first thing you do each morning, and is it intentional?',
    icon: 'sunny-outline',
  },
  {
    id: 18,
    category: 'systems',
    prompt: 'What inputs am I consuming that shape my mindset without my awareness?',
    followUp: 'If you audited your information diet, what would you change?',
    icon: 'filter-outline',
  },

  // ── Actions ───────────────────────────────────────────────
  {
    id: 19,
    category: 'actions',
    prompt: 'What one small step today would move me closer to where I want to be?',
    followUp: 'What has been stopping you from taking that step until now?',
    icon: 'footsteps-outline',
  },
  {
    id: 20,
    category: 'actions',
    prompt: 'What conversation have I been avoiding that could unlock progress?',
    followUp: 'What is the worst that could happen, and can you handle it?',
    icon: 'chatbubble-outline',
  },
  {
    id: 21,
    category: 'actions',
    prompt: 'What am I tolerating in my life that I have the power to change?',
    followUp: 'What would it look like to address this within the next 48 hours?',
    icon: 'hand-left-outline',
  },
  {
    id: 22,
    category: 'actions',
    prompt: 'What commitment can I make to myself today and actually keep?',
    followUp: 'How will you hold yourself accountable?',
    icon: 'checkmark-circle-outline',
  },
  {
    id: 23,
    category: 'actions',
    prompt: 'Where am I overthinking instead of acting, and what would action look like?',
    followUp: 'What is the smallest possible version of that action you could take right now?',
    icon: 'rocket-outline',
  },
  {
    id: 24,
    category: 'actions',
    prompt: 'Who in my life could use my encouragement or presence today?',
    followUp: 'What would it mean to them, and what would it cost you?',
    icon: 'people-outline',
  },

  // ── Reflection ────────────────────────────────────────────
  {
    id: 25,
    category: 'reflection',
    prompt: 'What am I most grateful for that I usually take for granted?',
    followUp: 'How can you honor that gratitude through your actions today?',
    icon: 'heart-half-outline',
  },
  {
    id: 26,
    category: 'reflection',
    prompt: 'What did I learn about myself this week that surprised me?',
    followUp: 'How does this new understanding change what comes next?',
    icon: 'eye-outline',
  },
  {
    id: 27,
    category: 'reflection',
    prompt: 'What challenge am I currently facing that is quietly making me stronger?',
    followUp: 'How will you look back on this moment a year from now?',
    icon: 'barbell-outline',
  },
  {
    id: 28,
    category: 'reflection',
    prompt: 'When was the last time I felt truly at peace, and what created that feeling?',
    followUp: 'What conditions would you need to feel that way more often?',
    icon: 'water-outline',
  },
  {
    id: 29,
    category: 'reflection',
    prompt: 'What pattern in my life keeps repeating, and what is it trying to teach me?',
    followUp: 'What would breaking that pattern require of you?',
    icon: 'infinite-outline',
  },
  {
    id: 30,
    category: 'reflection',
    prompt: 'If today were my last entry in this journal, what would I want it to say?',
    followUp: 'Are you living in a way that aligns with that answer?',
    icon: 'journal-outline',
  },
];
