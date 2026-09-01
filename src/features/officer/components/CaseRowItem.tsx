import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { ScalePressable } from '../../../utils/animations';
import { VerificationBadge } from '../../../components/ui/VerificationBadge';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { OfficerCase } from '../data/mockOfficerData';
import { FileText, ArrowRight, Shield } from 'lucide-react-native';

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
      style={[styles.card, style]}
    >
      {/* 1. Card Top Row: Case ID & Verification Status */}
      <View style={styles.cardHeader}>
        <View style={styles.caseIdBadge}>
          <FileText size={13} color={colors.primaryNavy} />
          <Text style={styles.caseIdText}>{caseData.caseId}</Text>
        </View>

        <View style={styles.headerRight}>
          <VerificationBadge status={caseData.status} size="sm" />
        </View>
      </View>

      {/* 2. Middle Row: Document & Holder Details */}
      <View style={styles.cardBody}>
        <Text style={styles.holderName} numberOfLines={1}>
          {caseData.holderName}
        </Text>
        <Text style={styles.documentMeta}>
          {caseData.documentType} • {caseData.passportNumber} ({caseData.nationality})
        </Text>
      </View>

      {/* 3. Card Bottom: Risk Level & View Details CTA */}
      <View style={styles.cardFooter}>
        <View style={styles.riskBadgeWrapper}>
          <RiskBadge level={caseData.riskLevel} score={caseData.riskScore} />
        </View>

        <TouchableOpacity
          onPress={onPress}
          style={styles.viewDetailsRow}
          activeOpacity={0.7}
        >
          <Text style={styles.timestampText}>{caseData.timestamp}</Text>
          <View style={styles.viewDetailsBtn}>
            <Text style={styles.viewDetailsText}>Details</Text>
            <ArrowRight size={12} color={colors.secondaryNavy} />
          </View>
        </TouchableOpacity>
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  caseIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  caseIdText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    marginBottom: 10,
  },
  holderName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  documentMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  riskBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestampText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  viewDetailsText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
});

export default CaseRowItem;
