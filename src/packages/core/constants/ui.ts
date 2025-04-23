
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const TRANSITIONS = {
  DEFAULT: 'all 0.3s ease',
  FAST: 'all 0.15s ease',
  SLOW: 'all 0.5s ease'
} as const;

export const Z_INDEX = {
  modal: 50,
  dropdown: 40,
  header: 30,
  footer: 20,
  base: 1,
} as const;
