import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PremiumCard } from '../../../components/cards/PremiumCard';
import { colors, typography, spacing, radius } from '../../../theme';

interface RiskDistributionCardProps {
  low: number;
  medium: number;
  high: number;
}

export const RiskDistributionCard: React.FC<RiskDistributionCardProps> = ({
  low = 89,
  medium = 8,
  high = 3,
}) => {
  return (
    <PremiumCard style={styles.card}>
      <Text style={[typography.h3, styles.title]}>Today's Risk Distribution</Text>

      {/* Segmented Horizontal Progress Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barSegment, { width: `${low}%`, backgroundColor: colors.success }]} />
        <View style={[styles.barSegment, { width: `${medium}%`, backgroundColor: colors.warning }]} />
        <View style={[styles.barSegment, { width: `${high}%`, backgroundColor: colors.danger }]} />
      </View>

      {/* Legend & Stats */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={typography.caption}>LOW ({low}%)</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={typography.caption}>MEDIUM ({medium}%)</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <Text style={typography.caption}>HIGH ({high}%)</Text>
        </View>
      </View>
    </PremiumCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: 16,
    marginBottom: spacing.md,
  },
  barTrack: {
    height: 12,
    borderRadius: radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
    marginBottom: spacing.md,
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
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default RiskDistributionCard;
