import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from '../../../utils/animations';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, typography, spacing, radius } from '../../../theme';
import { OfficerCase } from '../data/mockOfficerData';
import { FileText, ChevronRight } from 'lucide-react-native';

interface CaseRowItemProps {
  caseData: OfficerCase;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const CaseRowItem: React.FC<CaseRowItemProps> = ({
  caseData,
  onPress,
  style,
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Case ${caseData.caseId} for ${caseData.holderName}`}
      style={[styles.row, style]}
    >
      <View style={styles.iconBox}>
        <FileText size={20} color={colors.primaryRose} />
      </View>

      <View style={styles.contentColumn}>
        <View style={styles.titleRow}>
          <Text style={[typography.bodyMedium, styles.caseIdText]}>
            {caseData.caseId}
          </Text>
          <Text style={[typography.caption, styles.timeText]}>
            {caseData.timestamp}
          </Text>
        </View>

        <Text style={[typography.caption, styles.subText]} numberOfLines={1}>
          {caseData.holderName} • {caseData.documentType} ({caseData.nationality})
        </Text>
      </View>

      <View style={styles.rightColumn}>
        {caseData.status === 'FLAGGED' ? (
          <RiskBadge level={caseData.riskLevel} showDot={false} />
        ) : (
          <StatusBadge status={caseData.status} size="sm" />
        )}
        <ChevronRight size={16} color={colors.mutedText} style={styles.chevron} />
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.softRoseBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  caseIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  timeText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  subText: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chevron: {
    marginLeft: 2,
  },
});

export default CaseRowItem;
