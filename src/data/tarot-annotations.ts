// Hand-placed callouts for the "annotate" view — each points at a notable
// symbol in the card's illustration. Symbols, meanings, and condensed
// "meaning" captions come from the user's own compiled reference;
// coordinates are percentages (0-100) relative to the card image's
// width/height, calibrated by eye against the actual artwork in
// assets/tarot-cards. Labels are short (1-3 words) so they read like
// museum-placard captions; meanings are a 2-4 word distillation of the
// symbol's fuller significance.

export interface CardAnnotation {
  x: number;
  y: number;
  label: string;
  meaning: string;
}

export const CARD_ANNOTATIONS: Record<number, CardAnnotation[]> = {
  // ---- Major Arcana ----
  0: [ // The Fool
    { x: 53, y: 41, label: 'white rose', meaning: 'purity & freedom' },
    { x: 27, y: 78, label: 'cliff edge', meaning: 'leap into the unknown' },
    { x: 80, y: 78, label: 'small dog', meaning: 'instinctual warning' },
    { x: 84, y: 13, label: 'rising sun', meaning: 'spiritual light' },
    { x: 60, y: 12, label: 'feathered cap', meaning: 'buoyant spirit' },
    { x: 35, y: 32, label: 'wand pack', meaning: 'past incarnations' },
  ],
  1: [ // The Magician
    { x: 50, y: 17, label: 'lemniscate', meaning: 'eternal life' },
    { x: 50, y: 52, label: 'ouroboros belt', meaning: 'cosmic unity' },
    { x: 35, y: 65, label: 'suit tools', meaning: 'elemental mastery' },
    { x: 56, y: 23, label: 'raised hand', meaning: 'channeling divine power' },
    { x: 25, y: 80, label: 'roses and lilies', meaning: 'desire & intent' },
  ],
  2: [ // The High Priestess
    { x: 50, y: 28, label: 'pomegranate veil', meaning: 'hidden mysteries' },
    { x: 18, y: 50, label: 'twin pillars', meaning: 'severity & mercy' },
    { x: 47, y: 62, label: 'tora scroll', meaning: 'secret doctrine' },
    { x: 50, y: 87, label: 'crescent moon', meaning: 'intuition & change' },
    { x: 49, y: 38, label: 'solar cross', meaning: 'elemental balance' },
  ],
  3: [ // The Empress
    { x: 50, y: 86, label: 'wheat field', meaning: 'abundance & growth' },
    { x: 25, y: 71, label: 'shield of venus', meaning: 'love & creativity' },
    { x: 47, y: 17, label: 'starred crown', meaning: 'dominion over nature' },
    { x: 78, y: 38, label: 'forest and river', meaning: 'nourishing life force' },
    { x: 56, y: 65, label: 'pomegranate dress', meaning: 'passion & fertility' },
  ],
  4: [ // The Emperor
    { x: 25, y: 47, label: 'ram heads', meaning: 'authority & power' },
    { x: 39, y: 53, label: 'ankh scepter', meaning: 'key of life' },
    { x: 78, y: 28, label: 'barren mountains', meaning: 'rigid structure' },
    { x: 47, y: 24, label: 'golden orb', meaning: 'temporal power' },
    { x: 51, y: 65, label: 'hidden armor', meaning: 'readiness to defend' },
  ],
  5: [ // The Hierophant
    { x: 50, y: 17, label: 'triple tiara', meaning: 'threefold sovereignty' },
    { x: 50, y: 36, label: 'crossed keys', meaning: 'sacred knowledge' },
    { x: 65, y: 47, label: 'triple cross', meaning: 'spiritual authority' },
    { x: 35, y: 86, label: 'two ministers', meaning: 'ritual & belief' },
    { x: 50, y: 92, label: 'checkerboard floor', meaning: 'structured initiation' },
  ],
  6: [ // The Lovers
    { x: 50, y: 22, label: 'archangel raphael', meaning: 'divine blessing' },
    { x: 22, y: 38, label: 'tree of knowledge', meaning: 'choice & temptation' },
    { x: 80, y: 35, label: 'tree of life', meaning: 'infinite life force' },
    { x: 60, y: 70, label: 'mountain peak', meaning: 'spiritual achievement' },
    { x: 56, y: 16, label: 'sacred flames', meaning: 'passion & will' },
  ],
  7: [ // The Chariot
    { x: 50, y: 80, label: 'twin sphinxes', meaning: 'opposing forces' },
    { x: 50, y: 22, label: 'starry canopy', meaning: 'celestial guidance' },
    { x: 50, y: 60, label: 'lingam yoni', meaning: 'union of opposites' },
    { x: 50, y: 50, label: 'breastplate jewel', meaning: 'divine judgment' },
    { x: 50, y: 33, label: 'laurel crown', meaning: 'triumph of will' },
  ],
  8: [ // Strength
    { x: 50, y: 17, label: 'lemniscate', meaning: 'infinite patience' },
    { x: 65, y: 70, label: 'lion', meaning: 'raw passions' },
    { x: 47, y: 33, label: 'rose garland', meaning: 'gentle taming' },
    { x: 38, y: 53, label: 'white robe', meaning: 'pure intent' },
    { x: 50, y: 50, label: 'yellow field', meaning: 'vital awareness' },
  ],
  9: [ // The Hermit
    { x: 38, y: 27, label: 'star lantern', meaning: 'beacon of truth' },
    { x: 53, y: 56, label: 'golden staff', meaning: 'support on the path' },
    { x: 50, y: 85, label: 'snowy peak', meaning: 'solitary mastery' },
    { x: 53, y: 50, label: 'grey cloak', meaning: 'withdrawal & discretion' },
  ],
  10: [ // Wheel of Fortune
    { x: 50, y: 28, label: 'tetramorph beasts', meaning: 'eternal cosmic law' },
    { x: 22, y: 18, label: 'sphinx', meaning: 'unchanging equilibrium' },
    { x: 78, y: 70, label: 'anubis', meaning: 'rising evolution' },
    { x: 27, y: 60, label: 'serpent typhon', meaning: 'descent into matter' },
    { x: 50, y: 50, label: 'taro letters', meaning: 'cosmic cycles' },
  ],
  11: [ // Justice
    { x: 33, y: 47, label: 'double sword', meaning: 'truth from illusion' },
    { x: 67, y: 56, label: 'balanced scales', meaning: 'cosmic karma' },
    { x: 50, y: 56, label: 'square clasp', meaning: 'lawful stability' },
    { x: 50, y: 35, label: 'purple veil', meaning: 'hidden spiritual law' },
    { x: 50, y: 17, label: 'crown of law', meaning: 'cosmic order' },
  ],
  12: [ // The Hanged Man
    { x: 50, y: 75, label: 'halo', meaning: 'illumination through surrender' },
    { x: 47, y: 45, label: 'living cross', meaning: 'life persists' },
    { x: 47, y: 35, label: 'crossed legs', meaning: 'spirit over matter' },
    { x: 60, y: 62, label: 'bound hands', meaning: 'letting go of control' },
  ],
  13: [ // Death
    { x: 50, y: 22, label: 'white rose banner', meaning: 'purification through ending' },
    { x: 75, y: 32, label: 'rising sun', meaning: 'promise of rebirth' },
    { x: 84, y: 30, label: 'sinking crown', meaning: 'the great equalizer' },
    { x: 50, y: 55, label: 'white horse', meaning: 'force of evolution' },
    { x: 14, y: 78, label: 'river fleet', meaning: 'ferry of souls' },
  ],
  14: [ // Temperance
    { x: 47, y: 48, label: 'two cups', meaning: 'psychic balance' },
    { x: 40, y: 78, label: 'foot in water', meaning: 'grounding spirit in matter' },
    { x: 25, y: 70, label: 'golden crown path', meaning: 'journey to enlightenment' },
    { x: 50, y: 38, label: 'solar triangle', meaning: 'divine triad' },
    { x: 80, y: 70, label: 'iris flowers', meaning: 'hope & communication' },
  ],
  15: [ // The Devil
    { x: 50, y: 13, label: 'inverted pentagram', meaning: 'spirit subverted' },
    { x: 50, y: 73, label: 'loose chains', meaning: 'voluntary bondage' },
    { x: 50, y: 35, label: 'baphomet', meaning: 'illusion worshipped' },
    { x: 67, y: 65, label: 'grapes tail', meaning: 'overindulgence' },
    { x: 84, y: 75, label: 'flames tail', meaning: 'misused life force' },
  ],
  16: [ // The Tower
    { x: 80, y: 12, label: 'lightning bolt', meaning: 'divine truth strikes' },
    { x: 38, y: 16, label: 'falling crown', meaning: 'pride overthrown' },
    { x: 60, y: 28, label: 'falling yods', meaning: 'mercy amid ruin' },
    { x: 50, y: 78, label: 'craggy peak', meaning: 'shaky foundations' },
  ],
  17: [ // The Star
    { x: 50, y: 18, label: 'large star', meaning: 'cosmic hope' },
    { x: 28, y: 22, label: 'seven stars', meaning: 'aligned harmony' },
    { x: 38, y: 60, label: 'pouring pitchers', meaning: 'infinite replenishment' },
    { x: 87, y: 47, label: 'ibis in tree', meaning: 'recording wisdom' },
    { x: 47, y: 65, label: 'naked figure', meaning: 'raw vulnerability' },
  ],
  18: [ // The Moon
    { x: 38, y: 60, label: 'wolf and dog', meaning: 'tamed & untamed' },
    { x: 38, y: 78, label: 'rising crayfish', meaning: 'primal terrors' },
    { x: 22, y: 47, label: 'distant towers', meaning: 'gateway to unknown' },
    { x: 65, y: 35, label: 'falling yods', meaning: 'nourishing transition' },
    { x: 50, y: 18, label: 'crescent face', meaning: 'illusion & deception' },
  ],
  19: [ // The Sun
    { x: 40, y: 62, label: 'naked child', meaning: 'innocence & joy' },
    { x: 28, y: 65, label: 'sunflowers', meaning: 'seeking the light' },
    { x: 78, y: 50, label: 'red banner', meaning: 'victorious life force' },
    { x: 60, y: 75, label: 'stone wall', meaning: 'outgrown boundaries' },
  ],
  20: [ // Judgement
    { x: 50, y: 22, label: 'angel gabriel', meaning: 'call to awakening' },
    { x: 53, y: 45, label: 'cross banner', meaning: 'spirit meets matter' },
    { x: 50, y: 80, label: 'ocean tombs', meaning: 'releasing the past' },
    { x: 30, y: 68, label: 'reaching hands', meaning: 'ecstatic response' },
  ],
  21: [ // The World
    { x: 50, y: 18, label: 'victory wreath', meaning: 'achievement enclosed' },
    { x: 50, y: 48, label: 'infinity scarf', meaning: 'harmonious completion' },
    { x: 50, y: 60, label: 'two wands', meaning: 'mastery of cycles' },
    { x: 50, y: 50, label: 'tetramorph figures', meaning: 'elements stabilized' },
  ],

  // ---- Wands ----
  22: [ // Ace of Wands
    { x: 47, y: 28, label: 'sprouting wand', meaning: 'creative spark' },
    { x: 28, y: 60, label: 'distal castle', meaning: 'the goal ahead' },
    { x: 75, y: 50, label: 'floating leaves', meaning: 'energy made manifest' },
  ],
  23: [ // Two of Wands
    { x: 38, y: 50, label: 'globe in hand', meaning: 'grand ambitions' },
    { x: 18, y: 70, label: 'castle wall', meaning: 'safe containment' },
    { x: 18, y: 78, label: 'crossed roses', meaning: 'desire & thought' },
  ],
  24: [ // Three of Wands
    { x: 80, y: 60, label: 'ships in harbor', meaning: 'ventures returning' },
    { x: 70, y: 65, label: 'golden sea', meaning: 'optimistic horizon' },
    { x: 60, y: 50, label: 'gripping wand', meaning: 'stability before the leap' },
  ],
  25: [ // Four of Wands
    { x: 50, y: 35, label: 'garland canopy', meaning: 'domestic bliss' },
    { x: 45, y: 70, label: 'women with bouquets', meaning: 'celebration & harmony' },
    { x: 50, y: 50, label: 'moated castle', meaning: 'secure foundation' },
  ],
  26: [ // Five of Wands
    { x: 50, y: 38, label: 'clashing wands', meaning: 'creative conflict' },
    { x: 35, y: 60, label: 'varied clothing', meaning: 'disorganized egos' },
    { x: 50, y: 82, label: 'uneven ground', meaning: 'unstable conditions' },
  ],
  27: [ // Six of Wands
    { x: 49, y: 22, label: 'laurel wreath', meaning: 'public recognition' },
    { x: 86, y: 70, label: 'white horse', meaning: 'purity of purpose' },
    { x: 16, y: 65, label: 'surrounding crowd', meaning: 'community validation' },
  ],
  28: [ // Seven of Wands
    { x: 47, y: 75, label: 'high ground', meaning: 'holding your ground' },
    { x: 40, y: 80, label: 'mismatched shoes', meaning: 'unready haste' },
    { x: 25, y: 60, label: 'upthrust wands', meaning: 'encroaching challenges' },
  ],
  29: [ // Eight of Wands
    { x: 50, y: 45, label: 'descending wands', meaning: 'swift movement' },
    { x: 30, y: 84, label: 'open river', meaning: 'unobstructed progress' },
    { x: 75, y: 80, label: 'green landscape', meaning: 'fertile inspiration' },
  ],
  30: [ // Nine of Wands
    { x: 53, y: 38, label: 'head bandage', meaning: 'resilience through hardship' },
    { x: 75, y: 35, label: 'rear wand wall', meaning: 'defenses from caution' },
    { x: 50, y: 60, label: 'alert stance', meaning: 'guarded watchfulness' },
  ],
  31: [ // Ten of Wands
    { x: 47, y: 50, label: 'bended back', meaning: 'heavy burden' },
    { x: 75, y: 80, label: 'distant town', meaning: 'losing sight of the goal' },
    { x: 45, y: 38, label: 'bundled wands', meaning: 'over-extended responsibility' },
  ],
  32: [ // Page of Wands
    { x: 50, y: 38, label: 'sprouting wand', meaning: 'news of ideas' },
    { x: 38, y: 65, label: 'salamander tunic', meaning: 'passionate potential' },
    { x: 78, y: 78, label: 'pyramid landscape', meaning: 'distant aspirations' },
  ],
  33: [ // Knight of Wands
    { x: 35, y: 70, label: 'leaping horse', meaning: 'impatient momentum' },
    { x: 70, y: 45, label: 'flaming plume', meaning: 'consuming passion' },
    { x: 22, y: 82, label: 'desert mountains', meaning: 'testing environments' },
  ],
  34: [ // Queen of Wands
    { x: 22, y: 85, label: 'black cat', meaning: 'hidden psychic shadow' },
    { x: 78, y: 65, label: 'sunflower', meaning: 'magnetic vitality' },
    { x: 25, y: 68, label: 'lions on throne', meaning: 'sovereign courage' },
  ],
  35: [ // King of Wands
    { x: 35, y: 60, label: 'ouroboros', meaning: 'mastery of passion' },
    { x: 55, y: 58, label: 'leaning forward', meaning: 'readiness to act' },
    { x: 78, y: 78, label: 'lion emblem', meaning: 'leadership & charisma' },
  ],

  // ---- Cups ----
  36: [ // Ace of Cups
    { x: 50, y: 12, label: 'overflowing cup', meaning: 'emotional fulfillment' },
    { x: 50, y: 8, label: 'dove with host', meaning: 'spirit into the waters' },
    { x: 50, y: 60, label: 'streams of water', meaning: 'senses & intuition' },
    { x: 50, y: 88, label: 'lotus pond', meaning: 'flowering awareness' },
  ],
  37: [ // Two of Cups
    { x: 50, y: 22, label: 'caduceus', meaning: 'healing & balance' },
    { x: 50, y: 28, label: 'winged lion head', meaning: 'passion transformed' },
    { x: 47, y: 55, label: 'exchanged cups', meaning: 'reciprocal affection' },
  ],
  38: [ // Three of Cups
    { x: 48, y: 25, label: 'raised cups', meaning: 'shared joy' },
    { x: 50, y: 88, label: 'harvest fruits', meaning: 'emotional abundance' },
    { x: 78, y: 60, label: 'dancer pose', meaning: 'dynamic harmony' },
  ],
  39: [ // Four of Cups
    { x: 60, y: 60, label: 'crossed arms', meaning: 'defensive apathy' },
    { x: 28, y: 35, label: 'cloud cup', meaning: 'overlooked opportunity' },
    { x: 60, y: 25, label: 'tree shade', meaning: 'withdrawal into mind' },
  ],
  40: [ // Five of Cups
    { x: 38, y: 75, label: 'spilled cups', meaning: 'dwelling on loss' },
    { x: 75, y: 78, label: 'upright cups', meaning: 'overlooked hope' },
    { x: 50, y: 50, label: 'black shroud', meaning: 'deep sorrow' },
    { x: 18, y: 60, label: 'bridge river', meaning: 'path through turmoil' },
  ],
  41: [ // Six of Cups
    { x: 48, y: 60, label: 'castle courtyard', meaning: 'nostalgia & innocence' },
    { x: 35, y: 62, label: 'star flower', meaning: 'pure intentions' },
    { x: 78, y: 35, label: 'older guard', meaning: 'revisiting the past' },
  ],
  42: [ // Seven of Cups
    { x: 50, y: 45, label: 'swirling clouds', meaning: 'illusion & fantasy' },
    { x: 32, y: 30, label: 'shrouded figure', meaning: 'subconscious shadow' },
    { x: 50, y: 60, label: 'cup visions', meaning: 'temptations of desire' },
  ],
  43: [ // Eight of Cups
    { x: 28, y: 65, label: 'missing cup', meaning: 'incomplete fulfillment' },
    { x: 28, y: 18, label: 'ascending moon', meaning: 'seeking spiritual truth' },
    { x: 65, y: 35, label: 'midnight marsh', meaning: 'difficult transition' },
  ],
  44: [ // Nine of Cups
    { x: 50, y: 65, label: 'crossed arms', meaning: 'self-satisfaction' },
    { x: 50, y: 25, label: 'cup display', meaning: 'emotional security' },
    { x: 50, y: 55, label: 'blue red garb', meaning: 'calm and passion' },
  ],
  45: [ // Ten of Cups
    { x: 50, y: 25, label: 'rainbow cups', meaning: 'emotional peace' },
    { x: 75, y: 80, label: 'dancing couples', meaning: 'domestic harmony' },
    { x: 80, y: 55, label: 'home meadow', meaning: 'stable abundance' },
  ],
  46: [ // Page of Cups
    { x: 60, y: 35, label: 'fish in cup', meaning: 'unexpected intuition' },
    { x: 50, y: 55, label: 'feathery tunic', meaning: 'emotional sensitivity' },
    { x: 50, y: 85, label: 'wavy sea', meaning: 'shifting emotions' },
  ],
  47: [ // Knight of Cups
    { x: 75, y: 70, label: 'gentle horse', meaning: 'calm approach' },
    { x: 35, y: 25, label: 'winged helmet', meaning: 'poetic imagination' },
    { x: 25, y: 80, label: 'calm river', meaning: 'controlled emotion' },
  ],
  48: [ // Queen of Cups
    { x: 50, y: 35, label: 'ciborium cup', meaning: 'hidden secrets' },
    { x: 35, y: 65, label: 'sea throne', meaning: 'psychic immersion' },
    { x: 65, y: 85, label: 'river stones', meaning: 'thoughts shaped by emotion' },
  ],
  49: [ // King of Cups
    { x: 50, y: 65, label: 'sea throne', meaning: 'emotional mastery' },
    { x: 32, y: 50, label: 'leaping fish', meaning: 'stable intuition' },
    { x: 50, y: 85, label: 'turbulent sea', meaning: 'calm amid crisis' },
  ],

  // ---- Swords ----
  50: [ // Ace of Swords
    { x: 50, y: 30, label: 'crowned sword', meaning: 'mental clarity' },
    { x: 75, y: 25, label: 'olive palm', meaning: 'peace or conquest' },
    { x: 25, y: 45, label: 'floating yods', meaning: 'power of truth' },
    { x: 50, y: 85, label: 'mountain peak', meaning: 'detached perspective' },
  ],
  51: [ // Two of Swords
    { x: 38, y: 35, label: 'blindfold', meaning: 'inner balance' },
    { x: 50, y: 35, label: 'crossed swords', meaning: 'defensive stalemate' },
    { x: 65, y: 12, label: 'crescent moon', meaning: 'emotion vs logic' },
    { x: 78, y: 60, label: 'rocky shallows', meaning: 'precarious stillness' },
  ],
  52: [ // Three of Swords
    { x: 50, y: 48, label: 'pierced heart', meaning: 'heartbreak & grief' },
    { x: 50, y: 22, label: 'storm clouds', meaning: 'mental sorrow' },
    { x: 50, y: 38, label: 'symmetrical swords', meaning: 'logic over feeling' },
  ],
  53: [ // Four of Swords
    { x: 47, y: 65, label: 'tomb effigy', meaning: 'rest & recuperation' },
    { x: 27, y: 25, label: 'stained glass', meaning: 'insight in retreat' },
    { x: 38, y: 88, label: 'vertical sword', meaning: 'truth held in reserve' },
  ],
  54: [ // Five of Swords
    { x: 33, y: 38, label: 'smirking victor', meaning: 'hollow victory' },
    { x: 50, y: 78, label: 'scattered swords', meaning: 'broken alliances' },
    { x: 60, y: 25, label: 'jagged sky', meaning: 'fractured peace' },
  ],
  55: [ // Six of Swords
    { x: 33, y: 45, label: 'ferryman and mourner', meaning: 'transition to safety' },
    { x: 60, y: 75, label: 'rippled water', meaning: 'calming turbulence' },
    { x: 65, y: 50, label: 'vertical swords', meaning: 'protective structure' },
  ],
  56: [ // Seven of Swords
    { x: 47, y: 38, label: 'stealing glance', meaning: 'stealth & deception' },
    { x: 78, y: 60, label: 'left-behind swords', meaning: 'unfinished business' },
    { x: 85, y: 65, label: 'camp tents', meaning: 'evading authority' },
  ],
  57: [ // Eight of Swords
    { x: 50, y: 50, label: 'rope bindings', meaning: 'self-imposed traps' },
    { x: 60, y: 50, label: 'sword enclosure', meaning: 'limiting beliefs' },
    { x: 80, y: 38, label: 'distant castle', meaning: 'disconnected security' },
    { x: 50, y: 88, label: 'muddy marsh', meaning: 'stalled momentum' },
  ],
  58: [ // Nine of Swords
    { x: 38, y: 60, label: 'hands on face', meaning: 'anxiety & guilt' },
    { x: 50, y: 25, label: 'wall swords', meaning: 'intrusive thoughts' },
    { x: 65, y: 78, label: 'zodiac quilt', meaning: 'cosmic processing' },
  ],
  59: [ // Ten of Swords
    { x: 50, y: 45, label: 'piercing swords', meaning: 'rock bottom' },
    { x: 60, y: 65, label: 'golden horizon', meaning: 'dawn of renewal' },
    { x: 50, y: 18, label: 'black sky', meaning: 'end of darkness' },
  ],
  60: [ // Page of Swords
    { x: 55, y: 35, label: 'raised sword', meaning: 'vigilant curiosity' },
    { x: 60, y: 18, label: 'dynamic clouds', meaning: 'fast-moving ideas' },
    { x: 75, y: 12, label: 'flock of birds', meaning: 'rapid communication' },
  ],
  61: [ // Knight of Swords
    { x: 35, y: 60, label: 'charging charger', meaning: 'reckless momentum' },
    { x: 60, y: 22, label: 'slashing sword', meaning: 'aggressive truth' },
    { x: 18, y: 50, label: 'shattered trees', meaning: 'sweeping away the old' },
  ],
  62: [ // Queen of Swords
    { x: 65, y: 60, label: 'severed hand reach', meaning: 'logic over emotion' },
    { x: 30, y: 28, label: 'butterfly crown', meaning: 'intellectual transformation' },
    { x: 50, y: 75, label: 'cloud throne', meaning: 'clear judgment' },
  ],
  63: [ // King of Swords
    { x: 50, y: 45, label: 'upright sword', meaning: 'judicial authority' },
    { x: 50, y: 18, label: 'cherub icons', meaning: 'rational mastery' },
    { x: 75, y: 35, label: 'calm atmosphere', meaning: 'detached focus' },
  ],

  // ---- Pentacles ----
  64: [ // Ace of Pentacles
    { x: 50, y: 28, label: 'golden coin', meaning: 'material abundance' },
    { x: 50, y: 75, label: 'hedge archway', meaning: 'new prosperity' },
    { x: 50, y: 88, label: 'lily garden', meaning: 'refined by care' },
  ],
  65: [ // Two of Pentacles
    { x: 50, y: 47, label: 'infinity loop', meaning: 'juggling priorities' },
    { x: 17, y: 78, label: 'tossing ships', meaning: 'navigating volatility' },
    { x: 50, y: 28, label: 'dancer attire', meaning: 'playful resilience' },
  ],
  66: [ // Three of Pentacles
    { x: 50, y: 32, label: 'church plans', meaning: 'skilled collaboration' },
    { x: 28, y: 65, label: 'stonemason', meaning: 'solid foundations' },
    { x: 68, y: 58, label: 'consulting monks', meaning: 'expert guidance' },
  ],
  67: [ // Four of Pentacles
    { x: 48, y: 50, label: 'locked embrace', meaning: 'fear of loss' },
    { x: 48, y: 33, label: 'blocked chakras', meaning: 'guarding wealth' },
    { x: 78, y: 65, label: 'grey city', meaning: 'rigid materialism' },
  ],
  68: [ // Five of Pentacles
    { x: 50, y: 22, label: 'stained glass', meaning: 'overlooked aid' },
    { x: 35, y: 75, label: 'barefoot crutches', meaning: 'poverty & isolation' },
    { x: 65, y: 70, label: 'ragged shrouds', meaning: 'feeling cast out' },
  ],
  69: [ // Six of Pentacles
    { x: 64, y: 38, label: 'balanced scales', meaning: 'just distribution' },
    { x: 28, y: 70, label: 'kneeling supplicants', meaning: 'dependency dynamics' },
    { x: 47, y: 60, label: 'tendered coins', meaning: 'philanthropy & patronage' },
  ],
  70: [ // Seven of Pentacles
    { x: 65, y: 60, label: 'leaning on hoe', meaning: 'assessing investment' },
    { x: 25, y: 65, label: 'lush vine', meaning: 'patient growth' },
    { x: 80, y: 88, label: 'single coin', meaning: 'seed for the future' },
  ],
  71: [ // Eight of Pentacles
    { x: 38, y: 70, label: 'chisel and mallet', meaning: 'meticulous practice' },
    { x: 80, y: 45, label: 'wall-hung coins', meaning: 'proven track record' },
    { x: 18, y: 80, label: 'town path', meaning: 'focused mastery' },
  ],
  72: [ // Nine of Pentacles
    { x: 70, y: 38, label: 'hooded falcon', meaning: 'disciplined luxury' },
    { x: 35, y: 55, label: 'grape clusters', meaning: 'self-sufficiency' },
    { x: 60, y: 90, label: 'snail on path', meaning: 'deliberate growth' },
  ],
  73: [ // Ten of Pentacles
    { x: 60, y: 32, label: 'archway tower', meaning: 'lasting heritage' },
    { x: 22, y: 75, label: 'three generations', meaning: 'generational legacy' },
    { x: 75, y: 90, label: 'white dogs', meaning: 'loyalty & peace' },
  ],
  74: [ // Page of Pentacles
    { x: 47, y: 33, label: 'cradled coin', meaning: 'studying opportunity' },
    { x: 30, y: 88, label: 'furrowed field', meaning: 'preparing to learn' },
    { x: 75, y: 80, label: 'flourishing groves', meaning: 'future harvest' },
  ],
  75: [ // Knight of Pentacles
    { x: 38, y: 60, label: 'plodding workhorse', meaning: 'steady reliability' },
    { x: 78, y: 78, label: 'open fields', meaning: 'methodical planning' },
    { x: 55, y: 45, label: 'heavy armor', meaning: 'guarding routine' },
  ],
  76: [ // Queen of Pentacles
    { x: 50, y: 50, label: 'cradled pentacle', meaning: 'material security' },
    { x: 50, y: 38, label: 'goat throne', meaning: 'deep grounding' },
    { x: 25, y: 88, label: 'leaping rabbit', meaning: 'rapid abundance' },
  ],
  77: [ // King of Pentacles
    { x: 50, y: 22, label: 'bull head', meaning: 'solid stability' },
    { x: 45, y: 50, label: 'castle vine robe', meaning: 'wealth & defense' },
    { x: 30, y: 60, label: 'scepter of dominion', meaning: 'mastery of enterprise' },
  ],
};
