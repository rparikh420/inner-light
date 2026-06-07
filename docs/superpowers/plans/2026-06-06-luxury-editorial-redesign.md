# Luxury Editorial Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Inner Light app from "AI-generated dark mode" to a luxury editorial aesthetic inspired by Co-Star's restraint and Aesop's whitespace — pure black backgrounds, minimal typography-driven UI, the Rider-Waite card art as the sole visual hero.

**Architecture:** Strip all generic AI patterns (gradient backgrounds, colored pills, section labels, glowing cards). Replace with pure `#000000` black, `#FFFFFF` white text, one warm accent `#D4A574` for card names only. Remove the Card/GradientBackground wrapper components and use raw Views with intentional spacing. Every screen gets a unique layout — no template repetition.

**Tech Stack:** Expo SDK 56, React Native, expo-router, Animated API, AsyncStorage (unchanged). No new dependencies.

**Design Read (per taste-skill):** Reading this as: premium consumer spirituality app for design-conscious millennials, with a luxury editorial / Co-Star minimal language, leaning toward raw StyleSheet + intentional whitespace + serif-flavored System font hierarchy.

**Dials (per taste-skill):** `DESIGN_VARIANCE: 7 / MOTION_INTENSITY: 5 / VISUAL_DENSITY: 2`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/constants/theme.ts` | Rewrite | Strip to pure B&W + gold. Remove GLOW, CARD_STYLE, PRESS exports. |
| `src/components/GradientBackground.tsx` | Rewrite | Pure black `#000000` View + SafeAreaView, no gradient. |
| `src/components/Card.tsx` | Delete concept | Stop using wrapper cards. Screens compose their own Views. |
| `src/components/NeumorphicCard.tsx` | Delete | No longer needed. |
| `app/(tabs)/tarot.tsx` | Rewrite | Hero screen. Card art dominates. Typography-only info. |
| `app/(tabs)/index.tsx` | Rewrite | Minimal home. Left-aligned. No cards. |
| `app/(tabs)/affirmations.tsx` | Rewrite | Full-screen single affirmation. No pills. |
| `app/(tabs)/journal.tsx` | Rewrite | Clean input-forward design. |
| `app/onboarding/index.tsx` | Rewrite | Stark, cinematic onboarding. |
| `app/(tabs)/_layout.tsx` | Update | Minimal tab bar, thinner, pure black. |

---

### Task 1: Strip theme to pure black + white + gold

**Files:**
- Rewrite: `src/constants/theme.ts`

This is the foundation. Every subsequent task imports from here.

- [ ] **Step 1: Rewrite theme.ts**

Replace the entire file. The new theme is brutally simple — three colors, generous spacing, no glow/card/press presets.

```typescript
/**
 * Inner Light — Luxury Editorial Design System
 *
 * Three colors. Nothing else.
 * The card art is the only visual element. Everything else is typography.
 */

import { Platform } from 'react-native';

export const COLORS = {
  bg: '#000000',
  fg: '#FFFFFF',
  muted: '#666666',
  accent: '#D4A574',       // warm gold — card names, spiritual emphasis only
  border: 'rgba(255,255,255,0.06)',
  danger: '#EF4444',
  success: '#10B981',
} as const;

export const TYPE = {
  heading: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: COLORS.fg,
  },
  body: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    color: COLORS.fg,
  },
  muted: {
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'System' }),
    color: COLORS.muted,
  },
  accent: {
    fontFamily: Platform.select({ ios: 'Georgia', default: 'serif' }),
    color: COLORS.accent,
  },
} as const;

// Generous spacing — let the design breathe
export const S = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
  huge: 80,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 9999,
} as const;

export const SCREEN_PADDING = 24;
```

Key changes:
- `COLORS` down from 16 entries to 7
- Georgia serif for headings (gives editorial feel without custom fonts)
- `S.xl` is 40px and `S.xxl` is 64px — double the old spacing
- No GLOW, no CARD_STYLE, no PRESS exports (screens handle their own press)
- Renamed from verbose `TYPOGRAPHY`/`SPACING`/`BORDER_RADIUS` to terse `TYPE`/`S`/`RADIUS`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd ~/inner-light && npx tsc --noEmit 2>&1 | grep "error" | head -20`

Expected: Many import errors in screens (COLORS.bgCard, TYPOGRAPHY, etc. no longer exist). That's correct — we fix these in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/constants/theme.ts
git commit -m "refactor: strip theme to B&W + gold editorial palette"
```

---

### Task 2: Replace GradientBackground with pure black Screen wrapper

**Files:**
- Rewrite: `src/components/GradientBackground.tsx`
- Delete: `src/components/Card.tsx`
- Delete: `src/components/NeumorphicCard.tsx`

- [ ] **Step 1: Rewrite GradientBackground.tsx**

No gradient. Pure black. Rename concept to `Screen`.

```typescript
import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SCREEN_PADDING } from '../constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  padded?: boolean; // default true
}

export default function Screen({ children, padded = true }: ScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={[styles.safe, padded && styles.padded]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

// Keep old name working
export { default as GradientBackground } from './GradientBackground';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safe: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: SCREEN_PADDING,
  },
});
```

Note: export the component as default AND keep the old `GradientBackground` import path working since all screens import it by that name. The simplest approach: the file IS GradientBackground.tsx, it just renders black now.

- [ ] **Step 2: Gut Card.tsx to a passthrough**

Replace `src/components/Card.tsx` with a minimal re-export so existing imports don't crash while we rewrite screens:

```typescript
import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: string;
}

export default function Card({ children, style }: CardProps) {
  return <View style={style}>{children}</View>;
}
```

- [ ] **Step 3: Verify no crash**

Run: `cd ~/inner-light && npx tsc --noEmit 2>&1 | grep "error" | grep -v "node_modules" | wc -l`

Expected: Error count should decrease (component imports resolve). Remaining errors will be in screens referencing old theme tokens.

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "refactor: replace gradient/card wrappers with pure black Screen"
```

---

### Task 3: Redesign Tarot screen — the hero

**Files:**
- Rewrite: `app/(tabs)/tarot.tsx`

This is the most important screen. The Rider-Waite card illustration dominates. Everything else is typography.

**Design spec:**
- Pure black background (via GradientBackground/Screen)
- No title at top — the card IS the content
- Card back state: just the word "tap" in muted text, centered vertically
- Card front state: Rider-Waite image at 280px wide, centered, with generous space below
- Card name in gold Georgia serif, 28px, below the image
- Astrology text in muted, small, italic, directly below name
- Meaning text in white, 16px, left-aligned, with 24px top margin
- If reversed: image rotated 180deg, "(reversed)" appended to name in muted
- Keywords shown as plain comma-separated text in muted — NOT pills
- Mode toggle: just two plain text links "guidance" / "yes or no" with underline on active — NOT a segmented control
- Yes/No answer: just the word "yes" or "no" in large text, colored green/red
- "shuffle" link at bottom in muted, no button shape, just underlined text
- No Card wrapper component used anywhere — raw Views and Text

- [ ] **Step 1: Write the complete new tarot.tsx**

The agent should write the full file to `app/(tabs)/tarot.tsx`. Key structural rules:

1. Import `Screen` (still exported as default from `GradientBackground.tsx`) not `Card`
2. Import `COLORS, TYPE, S, RADIUS, SCREEN_PADDING` from new theme (not old names)
3. Import `getCardImage` from `../../src/data/tarot-images`
4. Card image: `width: 280, height: 280 * 1.68` (Rider-Waite aspect ratio)
5. Remove all `GLOW`, `PRESS`, `CARD_STYLE` references
6. Mode toggle is two plain `<Text>` elements with `textDecorationLine: 'underline'` on the active one
7. Keywords: `card.keywords.join(' · ')` as a single muted Text — no map/pills
8. Section labels ("meaning", "guidance"): lowercase, muted color, no UPPERCASE
9. "shuffle" action: `<Text style={{ color: COLORS.muted, textDecorationLine: 'underline' }}>shuffle</Text>` — no button container
10. Keep all existing logic (flip animation, AsyncStorage persistence, reversal logic)
11. StyleSheet at bottom — generous spacing: 40px between card image and name, 32px between sections

- [ ] **Step 2: Verify it compiles**

Run: `cd ~/inner-light && npx tsc --noEmit 2>&1 | grep "tarot" | head -10`

Expected: No errors in tarot.tsx

- [ ] **Step 3: Visual check**

Open `http://localhost:8081` and navigate to the Guidance tab. Verify:
- Pure black background
- Card image is the hero (280px wide)
- No colored pills, no glowing cards, no gradient
- Gold card name in serif
- Muted underlined toggle at top, not a segmented control

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/tarot.tsx"
git commit -m "redesign: tarot screen — luxury editorial, card art as hero"
```

---

### Task 4: Redesign Home screen

**Files:**
- Rewrite: `app/(tabs)/index.tsx`

**Design spec:**
- Left-aligned everything (break the centered symmetry)
- Top: greeting in serif gold, date in muted, both left-aligned, 64px top padding
- Daily card: horizontal row — small card image (80px tall) on left, card name + "your card today" text on right. Pressable, navigates to tarot tab. No card container — just a horizontal View with a bottom border
- Identity: "i am becoming" in muted, then the intention in white serif 24px. 40px spacing above.
- Quick actions: three plain text links in a row — "guidance · affirm · journal" — no icon circles, no card wrappers
- Streak: flame icon (Ionicons, 16px) + number in gold, bottom of screen
- If not onboarded: just "begin" as a large centered word, pressable

Key rules:
1. No Card component used
2. No centered headings
3. Import `getCardImage` for the small card preview
4. Use `TYPE.heading` (Georgia serif) for the greeting, `TYPE.accent` for gold text
5. Sections separated by 40-64px of space, not by card boundaries

- [ ] **Step 1: Write the complete new index.tsx**
- [ ] **Step 2: Verify it compiles** — `npx tsc --noEmit 2>&1 | grep "index" | head -10`
- [ ] **Step 3: Visual check** — refresh browser, check Home tab
- [ ] **Step 4: Commit** — `git commit -m "redesign: home screen — left-aligned editorial"`

---

### Task 5: Redesign Affirmations screen

**Files:**
- Rewrite: `app/(tabs)/affirmations.tsx`

**Design spec:**
- Full-screen single affirmation — one affirmation fills the entire screen
- Category name in muted small text at top, left-aligned
- Affirmation text centered vertically, large (24px), serif, white
- Swipe horizontally between affirmations (FlatList horizontal pagingEnabled)
- Category selector: plain text links at top, separated by " · ", active one is white, inactive is muted
- "hold to affirm" instruction in muted at bottom
- On long-press: text briefly turns gold, then back to white
- Counter: "3 / 10" in muted at bottom
- No pills, no badges, no Card wrappers, no icons in the category selector

- [ ] **Step 1: Write the complete new affirmations.tsx**
- [ ] **Step 2: Verify it compiles**
- [ ] **Step 3: Visual check**
- [ ] **Step 4: Commit** — `git commit -m "redesign: affirmations — full-screen editorial"`

---

### Task 6: Redesign Journal screen

**Files:**
- Rewrite: `app/(tabs)/journal.tsx`

**Design spec:**
- Clean, input-forward. The prompt and text area dominate.
- Prompt at top: category in muted small italic, prompt text in white 20px serif
- Follow-up question in muted italic below
- Text input: no visible border, just a thin bottom hairline `rgba(255,255,255,0.06)`. White text on black bg. Placeholder in muted. Multiline, 8 lines min height.
- "save" link in gold below the input when text is non-empty — no button shape
- "new prompt" link in muted below save
- Recent entries: separated by a thin horizontal rule. Date in muted, preview text in white truncated to 2 lines
- No Card wrappers, no category color badges, no icons

- [ ] **Step 1: Write the complete new journal.tsx**
- [ ] **Step 2: Verify it compiles**
- [ ] **Step 3: Visual check**
- [ ] **Step 4: Commit** — `git commit -m "redesign: journal — clean input-forward editorial"`

---

### Task 7: Redesign Onboarding

**Files:**
- Rewrite: `app/onboarding/index.tsx`

**Design spec:**
- Stark and cinematic. Black screen, white text, nothing else.
- Step 1: "who are you becoming?" in large serif (32px), centered. Name input below — just a bottom border, no box. Intention input same style. "next" in muted underlined text at bottom.
- Step 2: Goal chips — plain text, comma separated in a wrapping View. Selected = white. Unselected = muted. No pill backgrounds, no borders. Just text that toggles color on tap.
- Step 3: Summary — intention in gold serif centered. "begin" in large white text, pressable, no button container.
- Step indicator: three dots at top, 4px circles. Active = white, inactive = muted.
- Animate transitions: simple opacity fade (Animated.timing, 300ms)

- [ ] **Step 1: Write the complete new onboarding/index.tsx**
- [ ] **Step 2: Verify it compiles**
- [ ] **Step 3: Visual check** — clear AsyncStorage to re-trigger onboarding: `AsyncStorage.clear()` in console
- [ ] **Step 4: Commit** — `git commit -m "redesign: onboarding — stark cinematic editorial"`

---

### Task 8: Update tab bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Design spec:**
- Pure black tab bar background `#000000`
- No top border (remove `borderTopWidth`)
- Active tint: `#FFFFFF` (white, not gold)
- Inactive tint: `#444444` (very dark gray, barely visible)
- Labels: 10px, weight 400 (light), uppercase, 2px letter spacing
- Height: 80px, paddingBottom 24
- Tab labels: lowercase ("home", "guidance", "affirm", "journal")

- [ ] **Step 1: Update _layout.tsx**

```typescript
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#444444',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '400',
          letterSpacing: 2,
          textTransform: 'lowercase',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="remove-outline" size={16} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tarot"
        options={{
          title: 'guidance',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="remove-outline" size={16} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="affirmations"
        options={{
          title: 'affirm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="remove-outline" size={16} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'journal',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="remove-outline" size={16} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

Note: icons are all `remove-outline` (a simple horizontal dash) — minimal, no visual noise. Tabs differentiated by label only.

- [ ] **Step 2: Verify it compiles**
- [ ] **Step 3: Visual check** — tab bar should be barely visible, just white text labels on black
- [ ] **Step 4: Commit** — `git commit -m "redesign: tab bar — minimal editorial"`

---

### Task 9: Final cleanup and integration test

**Files:**
- Verify: all screens
- Push: to GitHub

- [ ] **Step 1: Full TypeScript check**

Run: `cd ~/inner-light && npx tsc --noEmit 2>&1 | grep "error" | grep -v "node_modules"`

Expected: Zero errors.

- [ ] **Step 2: Visual walkthrough**

Open `http://localhost:8081`. Walk through every screen:
1. Onboarding (clear AsyncStorage first if needed)
2. Home
3. Guidance (tarot) — tap to reveal, check reversed state
4. Affirm — swipe between affirmations, hold to affirm
5. Journal — write an entry, save, verify it appears in recent

- [ ] **Step 3: Fix any layout issues found in visual walkthrough**

Common issues to look for:
- Text truncated or overflowing
- Touch targets smaller than 44px
- Content hidden behind tab bar (need bottom padding)
- Images not loading (check require paths)

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

---

## Self-Review Notes

- **Spec coverage:** All 5 screens + tab bar + theme covered. Each task is independent after Task 1-2 (theme/components).
- **Type consistency:** New theme exports `COLORS`, `TYPE`, `S`, `RADIUS`, `SCREEN_PADDING`. All tasks reference these exact names.
- **No placeholders:** Every task has concrete code or explicit design specs.
- **Risk:** Screens import old theme tokens (`TYPOGRAPHY`, `SPACING`, `BORDER_RADIUS`, `GLOW`, `PRESS`). Tasks 3-7 must use the new names. TypeScript will catch any missed references.
- **Dependency order:** Task 1 → Task 2 → Tasks 3-7 (parallel-safe) → Task 8 → Task 9.
