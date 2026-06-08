# Inner Light

A personal wellness app — tarot guidance, identity-based affirmations, and journaling — built on the Atomic Habits identity→action framework. Expo SDK 56, Expo Router file-based navigation, AsyncStorage for persistence.

## Project history

### V0 — initial build (Rushabh Parikh + Claude Opus 4.6)
Scaffolded with `create-expo-app`, then built out as "Inner Light V0":
- **Onboarding** — 3-step identity flow (who am I becoming → goals → begin)
- **Home** — daily overview, streak counter, quick actions
- **Tarot ("Guidance")** — 78-card deck with flip animation, reversals, yes/no mode, astrology correspondences
- **Affirmations** — 50+ identity-based affirmations across 6 life categories, hold-to-affirm interaction
- **Journal** — daily prompts spanning 5 Atomic Habits dimensions, entry persistence
- Original look: neumorphic violet theme

### Visual redesign arc (Rushabh Parikh + Claude Opus 4.6)
A long iteration on the app's look and feel, in order:
1. Dark-mode redesign — cinematic purple/gold palette + 78 public-domain Rider-Waite tarot card illustrations with flip/reversal animation, glassmorphic `Card` component
2. Stripped to a **black + gold editorial** palette (`refactor: strip theme to B&W + gold editorial palette`)
3. Replaced gradient/card wrappers with a pure-black `Screen`/`GradientBackground`
4. Per-screen editorial redesigns: tab bar, home, journal, affirmations, onboarding, tarot — each pass moving toward a minimal, left-aligned, input-forward, "card art as hero" feel
5. Polish passes for visibility/warmth: warm surfaces, visible buttons everywhere, real tab-bar icons (compass/sparkles/heart/book) with gold active tint, personalized home greeting + identity card + 3-column action grid + streak pill
6. Introduced the **ambient purple atmosphere** — a desaturated violet wash (~5% visibility, "felt more than seen") fading to warm black at the top of every screen, plus `purple`/`purpleSoft`/`purpleBorder` tokens for occasional accents
7. Final touch-ups: visible hold-to-affirm button with progress fill + checkmark, prev/next arrow navigation for affirmations (fixed twice — first with raw scroll offsets, then properly with `scrollToIndex`/`goToIndex`)
8. Added a **Playwright E2E suite** (`e2e/`, `npm run test:e2e`) — 7 tests covering onboarding, home, guidance (tarot), affirmations, journal, and full tab-navigation walkthroughs, with screenshots saved to `e2e/results/`

### Current cycle (sakshi1896 + Claude Sonnet 4.6)
Started with a `speech2textui` commit, then a sequence of feature requests:

**Journal entries — swipeable card stack** (`app/journal-entries.tsx`)
Originally built as a Tinder-style fly-off browser, then redesigned per feedback into a centered carousel/stack: the active entry sits front and center with neighboring entries peeking on either side, all continuously animated off one shared `Animated.Value` (derived per-card transforms via `Animated.add`), driven by `react-native-gesture-handler`. Entries render as annotated polaroids on warm parchment — tilted snapshot, washi tape, handwritten caption, rotated sticker badge — each with a tappable star sticker pinned to its corner to mark it a favorite (persisted via `toggleJournalEntryFavorite` in `useIdentity`). On web, browsing also responds to trackpad/mouse-wheel horizontal swipes (`onWheel`, since `PanGestureHandler` only sees pointer drags, not wheel gestures), in addition to click-and-drag.

**Tab order**
Bottom tabs reordered to **Home → Journal → Affirm → Guidance** (`app/(tabs)/_layout.tsx`).

**Streak badge redesign**
Replaced the home-page streak counter with a hovering flame icon + superscript day-count badge (`src/components/StreakBadge.tsx`, gentle bobbing animation), shown on the Journal and Affirm screens instead. Resets to 0 if a day is missed; wired to `getStreak`/`incrementStreak` in `useIdentity` (previously dead code, now actually drives the streak from both the journal-save and affirmation-completion flows).

**"Analyse my patterns" — LLM-powered journal insights**
Reachable from the Journal screen. Uses **Gemini 2.5 Flash**, called directly from the app via `EXPO_PUBLIC_GEMINI_API_KEY` in a local, gitignored `.env` (get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

- **`src/utils/gemini.ts`** — thin wrapper around the Gemini REST API using `responseSchema` for constrained, structured JSON output
- **`src/utils/journalAnalysis.ts`** — the analysis functions:
  - `analyzeEntryModalities` — per-entry **"hot cross bun"** extraction (thoughts / feelings / behaviors / physical symptoms)
  - `analyzeCognitiveSchemas` — cross-entry CBT schema mining (core beliefs → dysfunctional assumptions → negative automatic thoughts), each finding backed by quoted evidence (informed by [arXiv:2403.16008](https://arxiv.org/abs/2403.16008))
  - `analyzeEmotionalTrajectory` — sentiment & discrete-emotion mining over time, plus day-of-week/calendar-cycle observations
  - `analyzeTopics` — LDA-style latent theme/topic clustering
  - `computeStylometry` — pronoun-ratio and absolute-language ("always"/"never") tracking, computed **entirely locally in JS** (no LLM call — pure counting is more reliable and free, and costs nothing)
- **`app/journal-patterns.tsx`** — hand-rolled monthly calendar of journal entries; tapping a day shows that entry juxtaposed with its on-demand hot-cross-bun analysis
- **`app/journal-deep-patterns.tsx`** — aggregate "deeper patterns" dashboard combining all four cross-entry analyses above

All Gemini-backed views degrade gracefully with a friendly "add your API key" prompt when `EXPO_PUBLIC_GEMINI_API_KEY` isn't set; the locally-computed stylometry section works immediately regardless.

## Setup

```bash
npm install
# .env already exists (gitignored) — fill in EXPO_PUBLIC_GEMINI_API_KEY=<your key>
npx expo start
```

## Testing

```bash
npx tsc --noEmit        # typecheck
npm run test:e2e        # Playwright E2E suite (headless)
npm run test:e2e:headed # same, with a visible browser
```
