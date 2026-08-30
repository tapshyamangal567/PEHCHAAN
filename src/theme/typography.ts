import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fontFamilies = {
  inter: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  poppins: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
};

export const typography: Record<string, TextStyle> = {
  screenTitle: {
    fontFamily: fontFamilies.inter.semiBold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamilies.inter.bold,
    fontSize: 28,
    lineHeight: 36,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamilies.inter.semiBold,
    fontSize: 22,
    lineHeight: 30,
    color: colors.primaryText,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamilies.inter.semiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.primaryText,
  },
  metricValue: {
    fontFamily: fontFamilies.inter.bold,
    fontSize: 30,
    lineHeight: 36,
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryText,
  },
  body: {
    fontFamily: fontFamilies.inter.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryText,
  },
  bodyMedium: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primaryText,
  },
  label: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondaryText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: fontFamilies.inter.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedText,
  },
  button: {
    fontFamily: fontFamilies.inter.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
  },
  brandWordmark: {
    fontFamily: fontFamilies.inter.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.primaryNavy,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 11,
    lineHeight: 15,
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
};

