import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { RiskLevel } from '../../types/common';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showDot?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showDot = true,
}) => {
  const getConfig = () => {
    switch (level) {
      case 'LOW':
        return {
          bg: colors.successBg,
          text: colors.success,
          border: 'rgba(46, 125, 91, 0.3)',
          label: 'LOW RISK',
        };
      case 'MEDIUM':
        return {
          bg: colors.warningBg,
          text: colors.warning,
          border: 'rgba(183, 121, 31, 0.3)',
          label: 'MEDIUM RISK',
        };
      case 'HIGH':
        return {
          bg: colors.dangerBg,
          text: colors.danger,
          border: 'rgba(180, 35, 24, 0.3)',
          label: 'HIGH RISK',
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      {showDot && <View style={[styles.dot, { backgroundColor: config.text }]} />}
      <Text style={[styles.text, { color: config.text }]}>
        {config.label} {score !== undefined ? `(${score}%)` : ''}
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
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RiskBadge;
