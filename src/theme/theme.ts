import { colors } from './colors';
import { spacing, radius, shadows } from './spacing';
import { typography, fontFamilies } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamilies,
  iconSizes: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  buttonSizes: {
    height: 52,
    radius: radius.button,
  },
  inputSizes: {
    height: 50,
    radius: radius.input,
  },
} as const;

export type Theme = typeof theme;
export { colors, spacing, radius, shadows, typography, fontFamilies };
export default theme;
