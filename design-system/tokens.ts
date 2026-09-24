/**
 * Virelo Academy — design tokens (single source of truth for TypeScript consumers).
 * The same values are mirrored as CSS variables in app/globals.css (@theme).
 * Formula: VIRELO = NAVY + GOLD + WHITE + CAIRO + MONTSERRAT + GEOMETRY + MINIMAL LUXURY + PREMIUM MOTION + CLEAN UX
 */
export const colors = {
  navy: "#071A33",
  navy800: "#0D2340",
  navy700: "#102A49",
  gold: "#D4AF37",
  white: "#FFFFFF",
  background: "#F7F8FA",
  surface: "#FFFFFF",
  text: "#071A33",
  textSecondary: "#5F6B7A",
  border: "#E6E9EF",
  muted: "#8A94A6",
  success: "#2E7D32",
  danger: "#C62828",
} as const;

/** 8px spacing system */
export const spacing = [4, 8, 16, 24, 32, 40, 48, 64, 80, 96, 120] as const;

export const radius = { sm: 8, md: 12, card: 16, lg: 20, hero: 24, pill: 999 } as const;

export const motion = { micro: 180, normal: 300, large: 500, easing: "ease-out" } as const;

export const fonts = { arabic: "Cairo", latin: "Montserrat" } as const;
