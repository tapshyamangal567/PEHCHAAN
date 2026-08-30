import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PremiumCard } from './PremiumCard';
import { colors, typography, spacing } from '../../theme';
import { StatusBadge } from '../ui/StatusBadge';
import { SystemStatus } from '../../types/common';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: SystemStatus;
  icon?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  trend,
  status,
  icon,
  style,
  onPress,
}) => {
  return (
    <PremiumCard style={style} onPress={onPress}>
      <View style={styles.header}>
        <Text style={typography.label}>{label}</Text>
        {icon && <View style={styles.iconBox}>{icon}</View>}
      </View>

      <Text style={[typography.h1, styles.valueText]}>{value}</Text>

      <View style={styles.footer}>
        {change && (
          <Text
            style={[
              typography.caption,
              trend === 'up' && { color: colors.success },
              trend === 'down' && { color: colors.danger },
            ]}
          >
            {change}
          </Text>
        )}
        {status && <StatusBadge status={status} />}
      </View>
    </PremiumCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  iconBox: {
    padding: spacing.xs,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
  },
  valueText: {
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});

export default MetricCard;
