import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RiskAssessmentData, RiskFactorItem } from '../../../services/riskScoringService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';

interface RiskAssessmentCardProps {
  assessment: RiskAssessmentData;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ assessment }) => {
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({});

  const toggleFactor = (name: string) => {
    setExpandedFactors((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const { score, level, coverage, risk_factors, verification_incomplete, recommendation } = assessment;

  const isLow = level === 'LOW';
  const isMedium = level === 'MEDIUM';
  const isHigh = level === 'HIGH';

  // Theme color tokens for risk level
  const themeColor = isLow ? colors.success : isMedium ? colors.warning : colors.danger;
  const themeBg = isLow ? colors.softMint : isMedium ? colors.warningBg : colors.dangerBg;

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>EXPLAINABLE RISK ASSESSMENT</Text>
        <View style={[styles.levelPill, { backgroundColor: themeBg }]}>
          <Text style={[styles.levelPillLabel, { color: themeColor }]}>
            {level} RISK
          </Text>
        </View>
      </View>

      {/* Main Score Meter Display */}
      <View style={styles.scoreMeterContainer}>
        <View style={styles.scoreRow}>
          <View style={styles.scoreCol}>
            <Text style={styles.scoreLabel}>RISK SCORE</Text>

            <View style={styles.scoreValueRow}>
              <Text style={[styles.scoreValue, { color: themeColor }]}>{score}</Text>
              <Text style={styles.scoreMax}> / 100</Text>
            </View>
          </View>

          {/* Coverage Gauge Badge */}
          <View style={styles.coverageBox}>
            <Text style={styles.coverageLabel}>COVERAGE</Text>

            <Text style={styles.coverageValue}>{coverage.percentage}%</Text>

            <Text style={styles.coverageSub}>
              {coverage.available_checks} / {coverage.total_checks} checks
            </Text>
          </View>
        </View>

        {/* Meter Progress Bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(5, score))}%`,
                backgroundColor: themeColor,
              },
            ]}
          />
        </View>

        {verification_incomplete ? (
          <View style={styles.incompleteWarningPill}>
            <AlertCircle size={13} color={colors.warning} />
            <Text style={styles.incompleteWarningText}>
              Incomplete Verification — Additional checks recommended
            </Text>
          </View>
        ) : null}
      </View>

      {/* Recommendation Banner */}
      <View style={[styles.recommendationBanner, { borderColor: themeColor }]}>
        <View style={styles.recLeftRow}>

          {isLow ? (
            <ShieldCheck size={18} color={colors.success} />
          ) : isMedium ? (
            <AlertTriangle size={18} color={colors.warning} />
          ) : (
            <ShieldAlert size={18} color={colors.danger} />
          )}
          <View style={styles.recTextCol}>
            <Text style={styles.recTitle}>RECOMMENDED OFFICER ACTION</Text>
            <Text style={styles.recText}>{recommendation}</Text>
          </View>
        </View>
      </View>

      {/* Risk Factors Section */}
      <View style={styles.factorsSection}>
        <Text style={styles.factorsSectionTitle}>EXPLAINABLE RISK FACTORS</Text>

        <View style={styles.factorsList}>
          {risk_factors.map((factor) => {
            const isExpanded = Boolean(expandedFactors[factor.name]);
            const isAvailable = factor.status !== 'NOT_AVAILABLE';
            const isPenalized = factor.points > 0;

            return (
              <View key={factor.name} style={styles.factorItem}>
                <TouchableOpacity
                  onPress={() => toggleFactor(factor.name)}
                  style={styles.factorHeaderBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle explanation for ${factor.name}`}
                >
                  <View style={styles.factorLeft}>
                    {isPenalized ? (
                      <AlertTriangle size={15} color={colors.warning} />
                    ) : isAvailable ? (
                      <CheckCircle2 size={15} color={colors.success} />
                    ) : (
                      <Info size={15} color={colors.mutedText} />
                    )}
                    <View>
                      <Text style={styles.factorName}>{factor.name}</Text>

                      <Text style={styles.factorStatus}>
                        {factor.status.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.factorRight}>
                    <Text
                      style={[
                        styles.pointsBadgeText,
                        isPenalized ? styles.pointsPenalized : styles.pointsNeutral,
                      ]}
                    >
                      {factor.points > 0 ? `+${factor.points} pts` : '0 pts'}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color={colors.secondaryText} />
                    ) : (
                      <ChevronDown size={16} color={colors.secondaryText} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Collapsible "Why?" Explanation */}
                {isExpanded ? (
                  <View style={styles.factorReasonContainer}>
                    <Text style={styles.factorReasonTitle}>Why?</Text>
                    <Text style={styles.factorReasonText}>{factor.reason}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Security Wording Notice */}
      <View style={styles.disclaimerBox}>
        <Info size={13} color={colors.secondaryNavy} />
        <Text style={styles.disclaimerText}>
          This risk score is an AI decision-support screening signal. Final clearance decision remains with the officer.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  levelPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  levelPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '800',
  },
  scoreMeterContainer: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scoreCol: {},
  scoreLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  scoreValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 34,
    fontWeight: '800',
  },
  scoreMax: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  coverageBox: {
    alignItems: 'flex-end',
  },
  coverageLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  coverageValue: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  coverageSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  incompleteWarningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.warningBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  incompleteWarningText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  recommendationBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recLeftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  recTextCol: {
    flex: 1,
  },
  recTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  recText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  factorsSection: {
    marginBottom: spacing.md,
  },
  factorsSectionTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  factorsList: {
    gap: 6,
  },
  factorItem: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  factorHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
  },
  factorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  factorName: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  factorStatus: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
  },
  factorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  pointsPenalized: {
    color: colors.warning,
  },
  pointsNeutral: {
    color: colors.success,
  },
  factorReasonContainer: {
    backgroundColor: '#1E293B',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  factorReasonTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 2,
  },
  factorReasonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.softBlue,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  disclaimerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryNavy,
    flex: 1,
    lineHeight: 15,
  },
});

export default RiskAssessmentCard;
