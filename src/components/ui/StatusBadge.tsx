import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { SystemStatus } from '../../types/common';

interface StatusBadgeProps {
  status: SystemStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'ACTIVE':
      case 'VERIFIED':
        return {
          bg: colors.successBg,
          border: 'rgba(46, 125, 91, 0.3)',
          text: colors.success,
          label: status,
        };
      case 'PENDING':
        return {
          bg: colors.warningBg,
          border: 'rgba(183, 121, 31, 0.3)',
          text: colors.warning,
          label: 'PENDING',
        };
      case 'FLAGGED':
        return {
          bg: colors.dangerBg,
          border: 'rgba(180, 35, 24, 0.3)',
          text: colors.danger,
          label: 'FLAGGED',
        };
      case 'ARCHIVED':
      default:
        return {
          bg: colors.softBlue,
          border: colors.border,
          text: colors.mutedText,
          label: status,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[typography.caption, styles.text, { color: config.text }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontFamily: typography.caption.fontFamily,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default StatusBadge;
