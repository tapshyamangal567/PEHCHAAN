import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../theme';

export const DocumentQualityPreCheck: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <ShieldCheck size={16} color={colors.primaryNavy} />
          <Text style={styles.sectionTitle}>Capture Quality</Text>
        </View>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>Pre-check</Text>
        </View>
      </View>

      <View style={styles.checksGrid}>
        <View style={styles.checkItem}>
          <CheckCircle2 size={14} color={colors.primaryNavy} />
          <Text style={styles.checkText}>Document visible</Text>
        </View>
        <View style={styles.checkItem}>
          <CheckCircle2 size={14} color={colors.primaryNavy} />
          <Text style={styles.checkText}>Image readable</Text>
        </View>
        <View style={styles.checkItem}>
          <CheckCircle2 size={14} color={colors.primaryNavy} />
          <Text style={styles.checkText}>Passport page detected</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 225, 234, 0.7)',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  tagBadge: {
    backgroundColor: colors.softBlue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
  },
  tagText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  checksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '500',
  },
});

export default DocumentQualityPreCheck;
