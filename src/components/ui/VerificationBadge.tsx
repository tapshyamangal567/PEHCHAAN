import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { SystemStatus } from '../../types/common';

export type VerificationStatus =
  | 'CLEARED'
  | 'UNDER REVIEW'
  | 'REJECTED'
  | 'FLAGGED'
  | 'VERIFIED'
  | 'PENDING'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED'
  | SystemStatus;

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md';
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'CLEARED':
      case 'VERIFIED':
      case 'ACTIVE':
        return {
          bg: colors.successBg,
          text: colors.success,
          border: 'rgba(46, 125, 91, 0.3)',
          icon: <ShieldCheck size={size === 'sm' ? 12 : 14} color={colors.success} />,
          label: status === 'ACTIVE' ? 'ACTIVE' : 'VERIFIED',
        };
      case 'UNDER REVIEW':
      case 'PENDING':
        return {
          bg: colors.infoBg,
          text: colors.info,
          border: 'rgba(47, 111, 237, 0.3)',
          icon: <Clock size={size === 'sm' ? 12 : 14} color={colors.info} />,
          label: status === 'PENDING' ? 'PENDING' : 'UNDER REVIEW',
        };
      case 'FLAGGED':
        return {
          bg: colors.warningBg,
          text: colors.warning,
          border: 'rgba(183, 121, 31, 0.3)',
          icon: <AlertTriangle size={size === 'sm' ? 12 : 14} color={colors.warning} />,
          label: 'FLAGGED',
        };
      case 'REJECTED':
      case 'INACTIVE':
      default:
        return {
          bg: colors.dangerBg,
          text: colors.danger,
          border: 'rgba(180, 35, 24, 0.3)',
          icon: <ShieldAlert size={size === 'sm' ? 12 : 14} color={colors.danger} />,
          label: status,
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      {config.icon}
      <Text style={[styles.text, { color: config.text }, size === 'sm' && styles.textSm]}>
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
    paddingVertical: 3.5,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 4,
  },
  text: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  textSm: {
    fontSize: 10,
  },
});

export default VerificationBadge;
