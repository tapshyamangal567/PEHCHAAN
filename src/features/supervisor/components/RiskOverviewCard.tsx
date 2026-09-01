import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ChevronRight, ShieldCheck } from 'lucide-react-native';

interface RiskOverviewCardProps {
  low: number;
  medium: number;
  high: number;
  onPress?: () => void;
}

export const RiskOverviewCard: React.FC<RiskOverviewCardProps> = ({
  low = 0,
  medium = 0,
  high = 0,
  onPress,
}) => {
  // If all are zero (empty database), render a subtle placeholder bar
  const total = low + medium + high;
  const isZero = total === 0;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <ShieldCheck size={16} color={colors.primaryNavy} />
          <Text style={[typography.bodyMedium, styles.title]}>Risk Distribution</Text>
        </View>
        {onPress && (
          <View style={styles.rightAction}>
            <Text style={styles.viewText}>View Cases</Text>
            <ChevronRight size={14} color={colors.secondaryNavy} />
          </View>
        )}
      </View>

      {/* Segmented Horizontal Progress Bar */}
      <View style={styles.barTrack}>
        {isZero ? (
          <View style={[styles.barSegment, { width: '100%', backgroundColor: colors.surfaceSubtle }]} />
        ) : (
          <>
            {low > 0 && (
              <View style={[styles.barSegment, { width: `${low}%`, backgroundColor: colors.success }]} />
            )}
            {medium > 0 && (
              <View style={[styles.barSegment, { width: `${medium}%`, backgroundColor: colors.warning }]} />
            )}
            {high > 0 && (
              <View style={[styles.barSegment, { width: `${high}%`, backgroundColor: colors.danger }]} />
            )}
          </>
        )}
      </View>

      {/* Legend & Stats */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendLabel}>LOW <Text style={styles.legendValue}>{low}%</Text></Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendLabel}>MEDIUM <Text style={styles.legendValue}>{medium}%</Text></Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendLabel}>HIGH <Text style={styles.legendValue}>{high}%</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginVertical: spacing.xs,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  barTrack: {
    height: 8,
    borderRadius: radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
    marginBottom: spacing.sm,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
  },
  legendValue: {
    fontWeight: '700',
    color: colors.primaryText,
  },
});

export default RiskOverviewCard;
