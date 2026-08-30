import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../../theme';
import { ScanLine } from 'lucide-react-native';

interface AnalysisScanningFrameProps {
  imageUri: string;
}

export const AnalysisScanningFrame: React.FC<AnalysisScanningFrameProps> = ({ imageUri }) => {
  const scanPositionY = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Smooth scanning line loop (0 to 180px)
    scanPositionY.value = withRepeat(
      withTiming(180, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle glow pulse
    pulseOpacity.value = withRepeat(
      withTiming(0.7, { duration: 1200, easing: Easing.ease }),
      -1,
      true
    );
  }, [scanPositionY, pulseOpacity]);

  const animatedLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanPositionY.value }],
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => {
    return {
      opacity: pulseOpacity.value,
    };
  });

  return (
    <View style={styles.frameWrapper}>
      {/* Outer subtle glow ring */}
      <Animated.View style={[styles.outerGlowRing, animatedGlowStyle]} />

      <View style={styles.frameContainer}>
        {/* Passport Image */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.passportImage}
            resizeMode="contain"
          />
        ) : null}

        {/* Animated Scanning Beam Line */}
        <Animated.View style={[styles.scanLineBeam, animatedLineStyle]}>
          <View style={styles.scanLineGlow} />
        </Animated.View>

        {/* Framing Corner Markers */}
        <View style={[styles.cornerMarker, styles.topLeft]} />
        <View style={[styles.cornerMarker, styles.topRight]} />
        <View style={[styles.cornerMarker, styles.bottomLeft]} />
        <View style={[styles.cornerMarker, styles.bottomRight]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    position: 'relative',
  },
  outerGlowRing: {
    position: 'absolute',
    width: 280,
    height: 210,
    borderRadius: radius.card,
    backgroundColor: 'rgba(31, 78, 121, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(31, 78, 121, 0.2)',
  },
  frameContainer: {
    width: 260,
    height: 190,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  passportImage: {
    width: '90%',
    height: '90%',
  },
  scanLineBeam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: colors.primaryNavy,
  },
  scanLineGlow: {
    height: 12,
    backgroundColor: 'rgba(31, 78, 121, 0.15)',
    marginTop: -6,
  },
  cornerMarker: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: colors.primaryNavy,
  },
  topLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});

export default AnalysisScanningFrame;
