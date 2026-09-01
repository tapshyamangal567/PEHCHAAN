import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { colors, typography } from '../../theme';

export interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'horizontal' | 'vertical' | 'icon';
  showTagline?: boolean;
  align?: 'center' | 'flex-start' | string;
  style?: ViewStyle;
  textColor?: string;
  subtextColor?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showTagline = true,
  align = 'center',
  style,
  textColor = colors.primaryNavy,
  subtextColor = colors.secondaryText,
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'md' ? 44 : size === 'lg' ? 56 : 64;
  const titleSize = size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 26 : 30;
  const subtextSize = size === 'sm' ? 9 : size === 'md' ? 10 : 12;

  // Professional Security Shield Emblem SVG
  const LogoMark = () => (
    <View style={[styles.markWrapper, { width: iconSize, height: iconSize }]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 100 100" fill="none">
        {/* Shield Outer Body */}
        <Path
          d="M50 8L86 22V50C86 72 70 88 50 94C30 88 14 72 14 50V22L50 8Z"
          fill={colors.primaryNavy}
        />
        {/* Inner Shield Accent */}
        <Path
          d="M50 14L80 26V50C80 68 66 82 50 88C34 82 20 68 20 50V26L50 14Z"
          fill="#1E4E79"
          opacity={0.3}
        />
        {/* Central Identity Face / Biometric Silhouette */}
        <Circle cx="50" cy="40" r="11" fill="#FFFFFF" />
        <Path
          d="M32 68C32 58 40 54 50 54C60 54 68 58 68 68V70H32V68Z"
          fill="#FFFFFF"
        />
        {/* Biometric Verification Check Mark */}
        <Path
          d="M44 48L48 52L58 42"
          stroke={colors.success}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom Tricolor Identity Bars */}
        <Rect x="36" y="78" width="12" height="2.5" rx="1" fill="#F28C28" />
        <Rect x="52" y="78" width="12" height="2.5" rx="1" fill="#138A4B" />
      </Svg>
    </View>
  );

  if (variant === 'icon') {
    return (
      <View style={[styles.container, { alignItems: align === 'flex-start' ? 'flex-start' : 'center' }, style]}>
        <LogoMark />
      </View>
    );
  }

  if (variant === 'vertical') {
    return (
      <View style={[styles.verticalContainer, { alignItems: align === 'flex-start' ? 'flex-start' : 'center' }, style]}>
        <LogoMark />
        <View style={[styles.verticalTextWrapper, { alignItems: align === 'flex-start' ? 'flex-start' : 'center' }]}>
          <Text style={[styles.wordmark, { fontSize: titleSize, color: textColor }]}>
            PEHCHAAN
          </Text>
          {showTagline && (
            <Text style={[styles.tagline, { fontSize: subtextSize, color: subtextColor }]}>
              BORDER SECURITY & VERIFICATION
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Default: Clean horizontal layout (Header & Sidebar friendly)
  return (
    <View style={[styles.horizontalContainer, { alignItems: 'center' }, style]}>
      <LogoMark />
      <View style={styles.textWrapper}>
        <View style={styles.titleRow}>
          <Text style={[styles.wordmark, { fontSize: titleSize, color: textColor }]}>
            PEHCHAAN
          </Text>
          <View style={styles.govPill}>
            <Text style={styles.govText}>GOV</Text>
          </View>
        </View>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: subtextSize, color: subtextColor }]}>
            IMMIGRATION & BORDER SECURITY
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  horizontalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  verticalContainer: {
    justifyContent: 'center',
    gap: 8,
  },
  markWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    justifyContent: 'center',
  },
  verticalTextWrapper: {
    marginTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wordmark: {
    fontFamily: typography.h1.fontFamily,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  govPill: {
    backgroundColor: 'rgba(18, 52, 91, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  govText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  tagline: {
    fontFamily: typography.caption.fontFamily,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 1,
  },
});

export default AppLogo;
