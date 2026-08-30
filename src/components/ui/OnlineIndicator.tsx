import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

interface OnlineIndicatorProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  label = 'System Operational',
  size = 'md',
}) => {
  return (
    <View style={[styles.container, size === 'sm' && styles.containerSm]}>
      <View style={styles.pulseWrapper}>
        <View style={styles.outerRing} />
        <View style={styles.dot} />
      </View>
      <Text style={[styles.text, size === 'sm' && styles.textSm]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 91, 0.25)',
  },
  containerSm: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
  },
  pulseWrapper: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(46, 125, 91, 0.3)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  text: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  textSm: {
    fontSize: 10,
  },
});

export default OnlineIndicator;
