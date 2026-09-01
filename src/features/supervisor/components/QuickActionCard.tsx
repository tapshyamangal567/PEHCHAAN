import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from '../../../utils/animations';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ChevronRight } from 'lucide-react-native';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeCount?: number;
  badgeLabel?: string;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'success';
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
  onPress,
  style,
}) => {
  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'danger':
        return { bg: colors.dangerBg, text: colors.danger, border: 'rgba(180, 35, 24, 0.25)' };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning, border: 'rgba(183, 121, 31, 0.25)' };
      case 'success':
        return { bg: colors.successBg, text: colors.success, border: 'rgba(18, 183, 106, 0.25)' };
      default:
        return { bg: colors.surfaceSubtle, text: colors.secondaryText, border: colors.border };
    }
  };

  const bColor = getBadgeColors();

  return (
    <ScalePressable
      onPress={onPress}
      activeScale={0.97}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconBox}>{icon}</View>
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

      <View style={styles.contentColumn}>
        <Text style={[typography.bodyMedium, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.caption, styles.subtitle]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.arrowRow}>
        <Text style={styles.openText}>Open</Text>
        <ChevronRight size={14} color={colors.secondaryNavy} />
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
    ...shadows.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  contentColumn: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: colors.mutedText,
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
});

export default QuickActionCard;
