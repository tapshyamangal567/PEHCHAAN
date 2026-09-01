import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface SupervisorMetricCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'primary';
  style?: StyleProp<ViewStyle>;
}

export const SupervisorMetricCard: React.FC<SupervisorMetricCardProps> = ({
  label,
  value,
  icon,
  loading = false,
  variant = 'default',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: colors.successBg,
          border: 'rgba(18, 183, 106, 0.25)',
          text: colors.success,
        };
      case 'danger':
        return {
          bg: colors.dangerBg,
          border: 'rgba(180, 35, 24, 0.25)',
          text: colors.danger,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: 'rgba(183, 121, 31, 0.25)',
          text: colors.warning,
        };
      case 'primary':
        return {
          bg: colors.surfaceSubtle,
          border: colors.border,
          text: colors.primaryNavy,
        };
      default:
        return {
          bg: colors.surface,
          border: colors.border,
          text: colors.primaryText,
        };
    }
  };

  const vStyle = getVariantStyles();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: vStyle.bg, borderColor: vStyle.border },
        style,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={vStyle.text} style={styles.loader} />
      ) : (
        <Text style={[styles.value, { color: vStyle.text }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.5,
    fontWeight: '600',
    flex: 1,
  },
  iconContainer: {
    marginLeft: 4,
  },
  value: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  loader: {
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
});

export default SupervisorMetricCard;
