import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { User, Check, Flag, Hourglass } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface SupervisorMetricCardProps {
  label: string;
  value: number | string;
  loading?: boolean;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  style?: StyleProp<ViewStyle>;
}

export const SupervisorMetricCard: React.FC<SupervisorMetricCardProps> = ({
  label,
  value,
  loading = false,
  variant = 'default',
  style,
}) => {
  const getConfig = () => {
    switch (variant) {
      case 'success':
        return {
          bg: '#F0FDF4',
          border: '#DCFCE7',
          iconBg: '#DCFCE7',
          iconColor: '#16A34A',
          textColor: '#15803D',
          sparkColor: '#22C55E',
          icon: <Check size={16} color="#FFFFFF" strokeWidth={3} />,
          iconIsCheck: true,
          sparkPath: 'M0 24 C10 24, 20 20, 30 20 C40 20, 50 12, 60 4',
          sparkDotX: 60,
          sparkDotY: 4,
        };
      case 'danger':
        return {
          bg: '#FEF2F2',
          border: '#FEE2E2',
          iconBg: '#FEE2E2',
          iconColor: '#DC2626',
          textColor: '#DC2626',
          sparkColor: '#EF4444',
          icon: <Flag size={15} color="#DC2626" fill="#DC2626" />,
          iconIsCheck: false,
          sparkPath: 'M0 20 C10 20, 20 12, 30 18 C40 24, 50 14, 60 6',
          sparkDotX: 60,
          sparkDotY: 6,
        };
      case 'warning':
        return {
          bg: '#FFFBEB',
          border: '#FEF3C7',
          iconBg: '#FEF3C7',
          iconColor: '#D97706',
          textColor: '#D97706',
          sparkColor: '#F59E0B',
          icon: <Hourglass size={15} color="#D97706" />,
          iconIsCheck: false,
          sparkPath: 'M0 22 C10 22, 20 14, 30 18 C40 22, 50 10, 60 4',
          sparkDotX: 60,
          sparkDotY: 4,
        };
      case 'default':
      default:
        return {
          bg: '#F0F7FF',
          border: '#E0EEFA',
          iconBg: '#E0EEFA',
          iconColor: '#2563EB',
          textColor: '#0F172A',
          sparkColor: '#3B82F6',
          icon: <User size={15} color="#2563EB" fill="#2563EB" />,
          iconIsCheck: false,
          sparkPath: 'M0 20 C10 20, 20 10, 30 18 C40 26, 50 12, 60 4',
          sparkDotX: 60,
          sparkDotY: 4,
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Icon Badge */}
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: config.iconIsCheck ? '#16A34A' : config.iconBg,
            },
          ]}
        >
          {config.icon}
        </View>

        {/* Middle: Label & Big Value */}
        <View style={styles.textColumn}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={config.textColor} style={styles.loader} />
          ) : (
            <Text style={[styles.value, { color: config.textColor }]}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          )}
        </View>

        {/* Right: Sparkline Graphic */}
        <View style={styles.sparklineContainer}>
          <Svg width="64" height="28" viewBox="0 0 64 28" fill="none">
            <Path
              d={config.sparkPath}
              stroke={config.sparkColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={config.sparkDotX}
              cy={config.sparkDotY}
              r="3"
              fill={config.sparkColor}
            />
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    ...shadows.soft,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: typography.label.fontFamily,
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  loader: {
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  sparklineContainer: {
    position: 'absolute',
    right: 0,
    bottom: -2,
  },
});

export default SupervisorMetricCard;
