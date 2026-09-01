import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ChevronRight } from 'lucide-react-native';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeCount?: number;
  badgeLabel?: string;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success' | 'purple';
  iconBg?: string;
  arrowColor?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  subtitle,
  icon,
  badgeCount,
  badgeLabel,
  badgeVariant = 'default',
  iconBg = '#F1F5F9',
  arrowColor = '#1D4ED8',
  onPress,
  style,
}) => {
  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'danger':
        return { bg: '#FEF2F2', text: '#DC2626', border: 'transparent' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#D97706', border: 'transparent' };
      case 'success':
        return { bg: '#DCFCE7', text: '#15803D', border: 'transparent' };
      case 'purple':
        return { bg: '#F3E8FF', text: '#7E22CE', border: 'transparent' };
      default:
        return { bg: '#F1F5F9', text: '#475569', border: 'transparent' };
    }
  };

  const bColor = getBadgeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      style={[styles.card, style]}
    >
      {/* Top Row: Icon & Badge */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
        {(badgeCount !== undefined && badgeCount > 0) || badgeLabel ? (
          <View
            style={[
              styles.badge,
              { backgroundColor: bColor.bg, borderColor: bColor.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: bColor.text }]}>
              {badgeLabel || `${badgeCount} PENDING`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Title & Subtitle */}
      <View style={styles.contentColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      {/* Bottom Link: Open > */}
      <View style={styles.arrowRow}>
        <Text style={[styles.openText, { color: arrowColor }]}>Open</Text>
        <ChevronRight size={14} color={arrowColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 142,
    ...shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  contentColumn: {
    flex: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  openText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
  },
});

export default QuickActionCard;
