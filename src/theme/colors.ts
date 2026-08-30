export const colors = {
  // Brand Base Palette
  primaryNavy: '#12345B',
  secondaryNavy: '#1F4E79',
  softBlue: '#EAF2F8',
  paleBlue: '#F4F8FC',
  
  background: '#F5F7FA',
  warmBackground: '#FBFAF7',
  surface: '#FFFFFF',
  
  softLavender: '#F3F1F8',
  softMint: '#EEF7F2',
  softWarm: '#FBF4ED',

  // Typography
  primaryText: '#172B4D',
  secondaryText: '#667085',
  mutedText: '#98A2B3',

  // Borders & Dividers
  border: '#D9E1EA',
  borderDark: '#B8C6D6',
  focusBorder: '#1F4E79',
  inputBg: '#FFFFFF',

  // Identity Accents (Used Sparingly)
  saffron: '#F28C28',
  saffronSoft: 'rgba(242, 140, 40, 0.12)',
  indiaGreen: '#138A4B',
  indiaGreenSoft: 'rgba(19, 138, 75, 0.12)',

  // Semantics & Status
  success: '#2E7D5B',
  successBg: '#EEF7F2',
  warning: '#B7791F',
  warningBg: '#FDF7E7',
  danger: '#B42318',
  dangerBg: '#FDF2F2',
  info: '#2F6FED',
  infoBg: '#EAF2F8',

  // Backwards Compatibility & Utility Aliases
  surfaceSubtle: '#F4F8FC',
  navyBorder: '#D9E1EA',
  accentBlue: '#1F4E79',
  accentBlueSoft: '#EAF2F8',

  primaryRose: '#12345B',
  lightRose: '#D9E1EA',
  softRoseBg: '#EAF2F8',
  roseBorder: '#D9E1EA',

  // Utility Colors
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(23, 43, 77, 0.5)',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;


