import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from '../../../utils/animations';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { colors, typography, spacing, radius } from '../../../theme';
import { SupervisorReviewCase } from '../data/mockSupervisorData';
import { FileText, ChevronRight, User } from 'lucide-react-native';

interface ReviewCaseCardProps {
  caseData: SupervisorReviewCase;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ReviewCaseCard: React.FC<ReviewCaseCardProps> = ({
  caseData,
  onPress,
  style,
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Review Case ${caseData.caseId} submitted by ${caseData.officerName}`}
      style={[styles.card, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.caseIdBox}>
          <FileText size={16} color={colors.primaryRose} />
          <Text style={[typography.bodyMedium, styles.caseIdText]}>
            {caseData.caseId}
          </Text>
          <Text style={[typography.caption, styles.docTypeBadge]}>
            {caseData.documentType}
          </Text>
        </View>
        <Text style={[typography.caption, styles.timeText]}>
          {caseData.timestamp}
        </Text>
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.officerColumn}>
          <Text style={[typography.body, styles.holderName]} numberOfLines={1}>
            {caseData.holderName} ({caseData.nationality})
          </Text>
          <View style={styles.officerMetaRow}>
            <User size={12} color={colors.mutedText} />
            <Text style={[typography.caption, styles.officerText]}>
              Officer: {caseData.officerName}
            </Text>
          </View>
        </View>

        <View style={styles.rightColumn}>
          <RiskBadge level={caseData.riskLevel} score={caseData.riskScore} />
          <ChevronRight size={18} color={colors.mutedText} style={styles.chevron} />
        </View>
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
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  caseIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  caseIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  docTypeBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    fontSize: 10,
    color: colors.secondaryText,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  officerColumn: {
    flex: 1,
    marginRight: spacing.sm,
  },
  holderName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  officerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  officerText: {
    color: colors.mutedText,
    fontSize: 12,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevron: {
    marginLeft: 4,
  },
});

export default ReviewCaseCard;
