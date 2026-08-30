import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G, Text as SvgText, TextPath } from 'react-native-svg';
import { colors, typography, spacing } from '../../theme';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  align?: 'center' | 'flex-start';
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showTagline = true,
  align = 'center',
}) => {
  // Dimensions
  const sealDiameter = size === 'sm' ? 64 : size === 'md' ? 100 : size === 'lg' ? 128 : 156;
  const wordmarkFontSize = size === 'sm' ? 18 : size === 'md' ? 24 : size === 'lg' ? 28 : 32;

  return (
    <View style={[styles.container, { alignItems: align }]}>
      {/* Official PEHCHAAN Emblem Seal */}
      <View style={[styles.sealWrapper, { width: sealDiameter, height: sealDiameter }]}>
        <Svg width={sealDiameter} height={sealDiameter} viewBox="0 0 200 200" fill="none">
          {/* 1. Outer Double Circle Seal in Deep Navy */}
          <Circle cx="100" cy="100" r="95" stroke={colors.primaryNavy} strokeWidth="5" fill="#FFFFFF" />
          <Circle cx="100" cy="100" r="88" stroke={colors.primaryNavy} strokeWidth="1.5" />

          {/* 2. Top Curved Text "PEHCHAAN" inside upper rim */}
          {/* Arc path for text */}
          <Path
            id="textArc"
            d="M 28 100 A 72 72 0 0 1 172 100"
            fill="none"
          />
          <SvgText fill={colors.primaryNavy} fontSize="14" fontWeight="800" letterSpacing="4">
            <TextPath href="#textArc" startOffset="50%" textAnchor="middle">
              PEHCHAAN
            </TextPath>
          </SvgText>

          {/* 3. Ashoka Emblem (Sarnath Lions Motif) at Top Center */}
          <G transform="translate(100, 32)">
            {/* Crown / Base of Lions */}
            <Rect x="-8" y="10" width="16" height="2" fill={colors.primaryNavy} />
            <Path d="M-10 10 L-7 2 L0 0 L7 2 L10 10 Z" fill={colors.primaryNavy} />
            {/* Center Lion Head */}
            <Circle cx="0" cy="4" r="3" fill="#FFFFFF" />
            <Path d="M-4 1 L-1 -3 L1 -3 L4 1" stroke={colors.primaryNavy} strokeWidth="1" />
            {/* Sub-text under Emblem */}
            <SvgText x="0" y="15" fill={colors.primaryNavy} fontSize="5" fontWeight="700" textAnchor="middle" letterSpacing="0.5">
              TRUST. VERIFY. PROTECT.
            </SvgText>
          </G>

          {/* 4. Left and Right Laurel Sprigs / Wheat Branches */}
          {/* Left Branch */}
          <G stroke={colors.primaryNavy} strokeWidth="1.5" fill="none">
            <Path d="M 38 115 C 32 95 38 75 52 58" />
            <Path d="M 44 64 C 40 60 35 62 33 66 C 36 68 41 68 44 64 Z" fill={colors.primaryNavy} />
            <Path d="M 40 76 C 34 74 31 77 30 82 C 34 83 38 81 40 76 Z" fill={colors.primaryNavy} />
            <Path d="M 38 90 C 31 90 28 94 28 99 C 32 99 36 96 38 90 Z" fill={colors.primaryNavy} />
            <Path d="M 40 104 C 34 106 32 111 33 116 C 37 114 40 110 40 104 Z" fill={colors.primaryNavy} />
          </G>
          {/* Right Branch */}
          <G stroke={colors.primaryNavy} strokeWidth="1.5" fill="none">
            <Path d="M 162 115 C 168 95 162 75 148 58" />
            <Path d="M 156 64 C 160 60 165 62 167 66 C 164 68 159 68 156 64 Z" fill={colors.primaryNavy} />
            <Path d="M 160 76 C 166 74 169 77 170 82 C 166 83 162 81 160 76 Z" fill={colors.primaryNavy} />
            <Path d="M 162 90 C 169 90 172 94 172 99 C 168 99 164 96 162 90 Z" fill={colors.primaryNavy} />
            <Path d="M 160 104 C 166 106 168 111 167 116 C 163 114 160 110 160 104 Z" fill={colors.primaryNavy} />
          </G>

          {/* 5. Central Security Shield with Fingerprint & Person Silhouette */}
          <G transform="translate(100, 114)">
            {/* Shield Outline */}
            <Path
              d="M -26 -38 L 26 -38 L 26 0 C 26 18 14 32 0 38 C -14 32 -26 18 -26 0 Z"
              fill="#FFFFFF"
              stroke={colors.primaryNavy}
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            {/* Inner Fingerprint Arcs */}
            <Path d="M -16 -12 C -16 -22 16 -22 16 -12" stroke={colors.primaryNavy} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d="M -11 -6 C -11 -16 11 -16 11 -6" stroke={colors.primaryNavy} strokeWidth="2" fill="none" strokeLinecap="round" />
            <Path d="M -6 0 C -6 -10 6 -10 6 0" stroke={colors.primaryNavy} strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Person Silhouette Head & Shoulders */}
            <Circle cx="0" cy="-2" r="5.5" fill={colors.primaryNavy} />
            <Path d="M -13 22 C -13 12 13 12 13 22 Z" fill={colors.primaryNavy} />
          </G>

          {/* 6. Indian Tricolor Bottom Arcs & Padlock */}
          {/* Saffron Arc (Bottom Left) */}
          <Path
            d="M 45 158 A 78 78 0 0 0 84 179"
            stroke={colors.saffron}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Green Arc (Bottom Right) */}
          <Path
            d="M 116 179 A 78 78 0 0 0 155 158"
            stroke={colors.indiaGreen}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Padlock Icon at Bottom Center */}
          <G transform="translate(100, 178)">
            {/* Padlock Shackle */}
            <Path d="M -5 -2 A 5 5 0 0 1 5 -2 V 3 H -5 Z" fill="none" stroke={colors.primaryNavy} strokeWidth="2.5" />
            {/* Padlock Body */}
            <Rect x="-8" y="2" width="16" height="13" rx="2" fill={colors.primaryNavy} />
            {/* Keyhole */}
            <Circle cx="0" cy="7" r="1.8" fill="#FFFFFF" />
            <Path d="M 0 7 L 0 11" stroke="#FFFFFF" strokeWidth="1.5" />
          </G>
        </Svg>
      </View>

      {/* Brand Text Below Logo */}
      <View style={styles.textWrapper}>
        <Text style={[typography.brandWordmark, styles.wordmarkText, { fontSize: wordmarkFontSize }]}>
          PEHCHAAN
        </Text>

        {showTagline && (
          <View style={styles.taglineRow}>
            <View style={styles.saffronLine} />
            <Text style={styles.taglineText}>IDENTIFY. VERIFY. EMPOWER.</Text>
            <View style={styles.greenLine} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  textWrapper: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  wordmarkText: {
    color: colors.primaryNavy,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.xs,
  },
  saffronLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.saffron,
    borderRadius: 1,
  },
  greenLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.indiaGreen,
    borderRadius: 1,
  },
  taglineText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 1.2,
  },
});

export default AppLogo;

