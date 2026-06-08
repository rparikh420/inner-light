export interface Affirmation {
  id: number;
  category: string;
  text: string;
  icon: string;
}

export interface AffirmationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  affirmations: Affirmation[];
}

export const AFFIRMATION_CATEGORIES: AffirmationCategory[] = [
  {
    id: 'career',
    name: 'Career & Purpose',
    description: 'Align with your mission and professional power',
    icon: 'rocket-outline',
    affirmations: [
      { id: 1, category: 'career', text: 'I am someone who shows up and delivers, especially when it is hard.', icon: 'flash-outline' },
      { id: 2, category: 'career', text: 'I am the kind of person who builds things that matter.', icon: 'construct-outline' },
      { id: 3, category: 'career', text: 'I am relentlessly resourceful and I figure things out.', icon: 'bulb-outline' },
      { id: 4, category: 'career', text: 'I am a person who takes full ownership of every outcome.', icon: 'flag-outline' },
      { id: 5, category: 'career', text: 'I am someone whose work speaks louder than words.', icon: 'megaphone-outline' },
      { id: 6, category: 'career', text: 'I am a builder who ships, iterates, and improves on my own initiative.', icon: 'code-slash-outline' },
      { id: 7, category: 'career', text: 'I am the person who raises the standard in every room I enter.', icon: 'trending-up-outline' },
      { id: 8, category: 'career', text: 'I am deeply aligned with work that challenges and fulfills me.', icon: 'compass-outline' },
      { id: 9, category: 'career', text: 'I am someone who turns uncertainty into clarity through action.', icon: 'navigate-outline' },
      { id: 10, category: 'career', text: 'I am a person who creates opportunity rather than waiting for it.', icon: 'hammer-outline' },
    ],
  },
  {
    id: 'abundance',
    name: 'Abundance & Wealth',
    description: 'Cultivate a powerful relationship with money and value',
    icon: 'diamond-outline',
    affirmations: [
      { id: 11, category: 'abundance', text: 'I am someone who builds wealth through discipline and conviction.', icon: 'trending-up-outline' },
      { id: 12, category: 'abundance', text: 'I am a person who makes money work relentlessly on my behalf.', icon: 'cash-outline' },
      { id: 13, category: 'abundance', text: 'I am the kind of person who sees abundance where others see scarcity.', icon: 'eye-outline' },
      { id: 14, category: 'abundance', text: 'I am someone who invests in asymmetric opportunities with patience.', icon: 'analytics-outline' },
      { id: 15, category: 'abundance', text: 'I am a person who earns generously because I solve real problems.', icon: 'wallet-outline' },
      { id: 16, category: 'abundance', text: 'I am someone who holds positions with conviction and manages risk with precision.', icon: 'shield-checkmark-outline' },
      { id: 17, category: 'abundance', text: 'I am naturally expanding my capacity to earn, save, and deploy capital.', icon: 'resize-outline' },
      { id: 18, category: 'abundance', text: 'I am a person who is generous because wealth flows to me consistently.', icon: 'gift-outline' },
      { id: 19, category: 'abundance', text: 'I am building financial systems that compound while I sleep.', icon: 'timer-outline' },
    ],
  },
  {
    id: 'love',
    name: 'Love & Relationships',
    description: 'Deepen connection and show up fully for those you care about',
    icon: 'heart-outline',
    affirmations: [
      { id: 20, category: 'love', text: 'I am someone who gives love freely and generously.', icon: 'heart-outline' },
      { id: 21, category: 'love', text: 'I am a person who attracts deep, honest, and meaningful connections.', icon: 'people-outline' },
      { id: 22, category: 'love', text: 'I am fully present with the people who matter to me.', icon: 'hand-left-outline' },
      { id: 23, category: 'love', text: 'I am someone who communicates with clarity, openness, and ease.', icon: 'chatbubbles-outline' },
      { id: 24, category: 'love', text: 'I am the kind of person who makes others feel seen and valued.', icon: 'sunny-outline' },
      { id: 25, category: 'love', text: 'I am secure enough to be vulnerable with the right people.', icon: 'lock-open-outline' },
      { id: 26, category: 'love', text: 'I am a person who builds trust through steady, everyday consistency.', icon: 'ribbon-outline' },
      { id: 27, category: 'love', text: 'I am someone who chooses relationships that elevate both sides.', icon: 'arrow-up-outline' },
      { id: 28, category: 'love', text: 'I am worthy of deep love, and I choose connections that honor that worth.', icon: 'star-outline' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Vitality',
    description: 'Honor your body as the foundation of everything you build',
    icon: 'fitness-outline',
    affirmations: [
      { id: 29, category: 'health', text: 'I am a person who treats training as a daily commitment.', icon: 'barbell-outline' },
      { id: 30, category: 'health', text: 'I am someone who fuels my body with intention and care.', icon: 'nutrition-outline' },
      { id: 31, category: 'health', text: 'I am the kind of person who prioritizes sleep as a competitive advantage.', icon: 'moon-outline' },
      { id: 32, category: 'health', text: 'I am physically strong, mentally sharp, and emotionally regulated.', icon: 'fitness-outline' },
      { id: 33, category: 'health', text: 'I am someone who respects recovery as much as effort.', icon: 'leaf-outline' },
      { id: 34, category: 'health', text: 'I am a person who shows up to move my body even when motivation is low.', icon: 'walk-outline' },
      { id: 35, category: 'health', text: 'I am building a body that performs at a high level for decades.', icon: 'pulse-outline' },
      { id: 36, category: 'health', text: 'I am someone who listens to my body and adjusts with self-compassion.', icon: 'ear-outline' },
      { id: 37, category: 'health', text: 'I am disciplined about what I consume, mentally and physically.', icon: 'shield-outline' },
    ],
  },
  {
    id: 'growth',
    name: 'Growth & Learning',
    description: 'Stay relentlessly curious and committed to mastery',
    icon: 'library-outline',
    affirmations: [
      { id: 38, category: 'growth', text: 'I am a person who learns fastest through action and practice.', icon: 'rocket-outline' },
      { id: 39, category: 'growth', text: 'I am someone who treats every setback as a stepping stone toward mastery.', icon: 'analytics-outline' },
      { id: 40, category: 'growth', text: 'I am the kind of person who reads, reflects, and applies consistently.', icon: 'book-outline' },
      { id: 41, category: 'growth', text: 'I am someone who seeks out discomfort because that is where growth lives.', icon: 'flame-outline' },
      { id: 42, category: 'growth', text: 'I am a lifelong student who stays humble enough to be taught.', icon: 'school-outline' },
      { id: 43, category: 'growth', text: 'I am someone who compounds small daily improvements into massive results.', icon: 'layers-outline' },
      { id: 44, category: 'growth', text: 'I am a person who replaces opinions with evidence and adapts quickly.', icon: 'swap-horizontal-outline' },
      { id: 45, category: 'growth', text: 'I am building deep, lasting expertise.', icon: 'telescope-outline' },
      { id: 46, category: 'growth', text: 'I am someone who asks better questions instead of seeking easy answers.', icon: 'help-circle-outline' },
    ],
  },
  {
    id: 'confidence',
    name: 'Confidence & Self-Worth',
    description: 'Own your value and move through the world with quiet power',
    icon: 'trophy-outline',
    affirmations: [
      { id: 47, category: 'confidence', text: 'I am enough exactly as I am, and I am still becoming more.', icon: 'expand-outline' },
      { id: 48, category: 'confidence', text: 'I am someone who backs myself even when no one else does yet.', icon: 'shield-outline' },
      { id: 49, category: 'confidence', text: 'I am a person who trusts my own direction and inner compass.', icon: 'compass-outline' },
      { id: 50, category: 'confidence', text: 'I am someone who speaks up because my perspective has value.', icon: 'mic-outline' },
      { id: 51, category: 'confidence', text: 'I am the kind of person who walks into any room knowing I belong.', icon: 'enter-outline' },
      { id: 52, category: 'confidence', text: 'I am comfortable with being misunderstood while I build.', icon: 'construct-outline' },
      { id: 53, category: 'confidence', text: 'I am a person whose confidence comes from reps, not from hype.', icon: 'repeat-outline' },
      { id: 54, category: 'confidence', text: 'I am someone who sets boundaries with calm, quiet confidence.', icon: 'stop-circle-outline' },
      { id: 55, category: 'confidence', text: 'I am worthy of the goals I set and capable of reaching them.', icon: 'trophy-outline' },
      { id: 56, category: 'confidence', text: 'I am a person who stands fully and proudly in my own presence.', icon: 'resize-outline' },
    ],
  },
];
