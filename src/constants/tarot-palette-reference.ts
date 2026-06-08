/**
 * Tarot / Guidance screen — color & type reference
 *
 * Snapshot of every color token observed in the rendered Guidance/Tarot
 * screen (Justice card view). Kept separate from the app-wide `theme.ts`
 * tokens so this exact palette can be revisited, tweaked, or reapplied
 * later without re-deriving it from the UI by eye.
 *
 * NOT currently wired into the app — reference + future-edit only.
 */

export const TAROT_PALETTE = {
  // ---- Backgrounds ----
  bgPrimary: '#0D0A1E',     // main screen background
  surfaceIndigo: '#1E1840', // card image background
  surfaceViolet: '#2D2460', // placement grid items

  // ---- Gold / champagne ----
  goldPrimary: '#C9A84C',     // labels, borders, dividers, active nav
  goldBright: '#E8C97A',      // card title ("Justice"), placement values
  goldFaint: 'rgba(201,168,76,0.12)',  // meta item backgrounds, message block bg
  goldDivider: 'rgba(201,168,76,0.22)', // all borders and lines

  // ---- Text ----
  textBright: '#F2EAD8',                  // message text
  textMuted: 'rgba(232,201,122,0.45)',    // subtitle ("Libra"), nav items, inactive pills
  textTerraAmber: 'rgba(180,140,80,0.8)', // uppercase labels, keywords

  // ---- Surfaces ----
  surfacePurpleFaint: 'rgba(45,36,96,0.6)',     // placement grid item backgrounds
  surfacePillInactive: 'rgba(255,255,255,0.03)', // inactive top pill buttons
} as const;

export const TAROT_TYPE = {
  display: {
    // card title ("Justice"), placement values
    fontFamily: 'Playfair Display',
    fontWeight: '400',
  },
  body: {
    // body copy, labels, italics
    fontFamily: 'Cormorant Garamond',
    fontWeight: '300', // ranges 300–500 depending on emphasis
  },
} as const;
