import { TarotCard } from '../data/tarot';

export interface ZodiacSignInfo {
  name: string;
  glyph: string;
  element: string;
  polarity: 'Yang' | 'Yin';
  archetype: string;
  ruler: string;
}

const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { name: 'Aries', glyph: '♈', element: 'Fire', polarity: 'Yang', archetype: 'The Ram', ruler: 'Mars' },
  { name: 'Taurus', glyph: '♉', element: 'Earth', polarity: 'Yin', archetype: 'The Bull', ruler: 'Venus' },
  { name: 'Gemini', glyph: '♊', element: 'Air', polarity: 'Yang', archetype: 'The Twins', ruler: 'Mercury' },
  { name: 'Cancer', glyph: '♋', element: 'Water', polarity: 'Yin', archetype: 'The Crab', ruler: 'Moon' },
  { name: 'Leo', glyph: '♌', element: 'Fire', polarity: 'Yang', archetype: 'The Lion', ruler: 'Sun' },
  { name: 'Virgo', glyph: '♍', element: 'Earth', polarity: 'Yin', archetype: 'The Maiden', ruler: 'Mercury' },
  { name: 'Libra', glyph: '♎', element: 'Air', polarity: 'Yang', archetype: 'The Scales', ruler: 'Venus' },
  { name: 'Scorpio', glyph: '♏', element: 'Water', polarity: 'Yin', archetype: 'The Scorpion', ruler: 'Pluto' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire', polarity: 'Yang', archetype: 'The Archer', ruler: 'Jupiter' },
  { name: 'Capricorn', glyph: '♑', element: 'Earth', polarity: 'Yin', archetype: 'The Sea-Goat', ruler: 'Saturn' },
  { name: 'Aquarius', glyph: '♒', element: 'Air', polarity: 'Yang', archetype: 'The Water-Bearer', ruler: 'Uranus' },
  { name: 'Pisces', glyph: '♓', element: 'Water', polarity: 'Yin', archetype: 'The Fish', ruler: 'Neptune' },
];

const SIGN_INDEX = new Map(ZODIAC_SIGNS.map((sign, i) => [sign.name, i]));

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

// Modern rulerships — mirrors how this deck already pairs outer planets with
// signs (e.g. The Star ↔ Aquarius and The Fool ↔ Uranus both point at the
// same placement from either side), so a planet-only card resolves to the
// sign it governs and a sign-only card resolves to the planet that governs it.
const PLANET_RULES_SIGN: Record<string, string> = {
  Mars: 'Aries',
  Venus: 'Taurus',
  Mercury: 'Gemini',
  Moon: 'Cancer',
  Sun: 'Leo',
  Pluto: 'Scorpio',
  Jupiter: 'Sagittarius',
  Saturn: 'Capricorn',
  Uranus: 'Aquarius',
  Neptune: 'Pisces',
};

// The aces and court cards carry an "elemental dignity" string ("Earth of
// Fire") rather than a planet or sign — fall back to the cardinal sign of the
// suit's element so they still resolve to a full placement.
const SUIT_REPRESENTATIVE_SIGN: Record<NonNullable<TarotCard['suit']>, string> = {
  wands: 'Aries',
  cups: 'Cancer',
  swords: 'Libra',
  pentacles: 'Capricorn',
};

const ROMAN_NUMERALS = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX',
  'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX',
  'XX', 'XXI',
];

function resolveSignIndex(card: TarotCard): number {
  const placement = card.astrology;

  const direct = SIGN_INDEX.get(placement);
  if (direct !== undefined) return direct;

  const decanSign = ZODIAC_SIGNS.find((sign) => placement.endsWith(` in ${sign.name}`));
  if (decanSign) return SIGN_INDEX.get(decanSign.name)!;

  const ruledSign = PLANET_RULES_SIGN[placement];
  if (ruledSign) return SIGN_INDEX.get(ruledSign)!;

  if (card.suit) return SIGN_INDEX.get(SUIT_REPRESENTATIVE_SIGN[card.suit])!;

  return 0;
}

function resolvePlanetName(card: TarotCard, sign: ZodiacSignInfo): string {
  const placement = card.astrology;

  if (PLANET_GLYPHS[placement]) return placement;

  const decanPlanet = Object.keys(PLANET_GLYPHS).find((planet) => placement.startsWith(`${planet} in `));
  if (decanPlanet) return decanPlanet;

  return sign.ruler;
}

export interface AspectGroup {
  label: string;
  signs: ZodiacSignInfo[];
}

function aspectGroup(label: string, offsets: number[], signIndex: number): AspectGroup {
  return {
    label,
    signs: offsets.map((offset) => ZODIAC_SIGNS[(signIndex + offset + 12) % 12]),
  };
}

export interface CardAstrology {
  sign: ZodiacSignInfo;
  planetName: string;
  planetGlyph: string | null;
  numeral: string;
  aspects: AspectGroup[];
}

export function getCardAstrology(card: TarotCard): CardAstrology {
  const signIndex = resolveSignIndex(card);
  const sign = ZODIAC_SIGNS[signIndex];
  const planetName = resolvePlanetName(card, sign);

  return {
    sign,
    planetName,
    planetGlyph: PLANET_GLYPHS[planetName] ?? null,
    numeral: card.arcana === 'major' ? (ROMAN_NUMERALS[card.number] ?? String(card.number)) : String(card.number),
    aspects: [
      aspectGroup('Trine', [-4, 4], signIndex),
      aspectGroup('Sextile', [-2, 2], signIndex),
      aspectGroup('Opposition', [6], signIndex),
      aspectGroup('Square', [-3, 3], signIndex),
    ],
  };
}
