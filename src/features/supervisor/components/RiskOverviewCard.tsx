import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ChevronRight, Shield } from 'lucide-react-native';

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
  const total = low + medium + high;
  const isZero = total === 0;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Shield size={16} color="#0F172A" />
          <Text style={styles.title}>Risk Distribution</Text>
        </View>
        {onPress && (
          <TouchableOpacity onPress={onPress} style={styles.rightAction} activeOpacity={0.7}>
            <Text style={styles.viewText}>View Cases</Text>
            <ChevronRight size={14} color="#1D4ED8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Progress Bar */}
      <View style={styles.barTrack}>
        {isZero ? (
          <View style={[styles.barSegment, { width: '100%', backgroundColor: '#E2E8F0' }]} />
        ) : (
          <>
            {low > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { width: `${low}%`, backgroundColor: '#10B981' },
                ]}
              />
            )}
            {medium > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { width: `${medium}%`, backgroundColor: '#F59E0B' },
                ]}
              />
            )}
            {high > 0 && (
              <View
                style={[
                  styles.barSegment,
                  { width: `${high}%`, backgroundColor: '#DC2626' },
                ]}
              />
            )}
          </>
        )}
      </View>

      {/* Legend Column Items */}
      <View style={styles.legendRow}>
        {/* Low */}
        <View style={styles.legendColumn}>
          <View style={styles.legendLabelRow}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendLabel}>LOW</Text>
          </View>
          <Text style={styles.legendPercent}>{low}%</Text>
        </View>

        {/* Medium */}
        <View style={styles.legendColumn}>
          <View style={styles.legendLabelRow}>
            <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendLabel}>MEDIUM</Text>
          </View>
          <Text style={styles.legendPercent}>{medium}%</Text>
        </View>

        {/* High */}
        <View style={styles.legendColumn}>
          <View style={styles.legendLabelRow}>
            <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendLabel}>HIGH</Text>
          </View>
          <Text style={styles.legendPercent}>{high}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  legendColumn: {
    alignItems: 'center',
  },
  legendLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  legendPercent: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});

export default RiskOverviewCard;
