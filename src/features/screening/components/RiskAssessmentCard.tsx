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
  XCircle,
  HelpCircle,
  AlertCircle,
} from 'lucide-react-native';

interface RiskAssessmentCardProps {
  assessment: RiskAssessmentData;
}

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ assessment }) => {
  const [expandedFactors, setExpandedFactors] = useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const toggleFactor = (name: string) => {
    setExpandedFactors((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const {
    score,
    level,
    coverage,
    checks,
    risk_factors,
    supporting_signals,
    verification_incomplete,
    recommendation,
  } = assessment;

  const primaryChecksList = checks || risk_factors || [];
  const completedCount = coverage.completed_checks ?? coverage.available_checks ?? 0;
  const totalCount = coverage.total_checks ?? 7;

  const isLow = level === 'LOW';
  const isMedium = level === 'MEDIUM';
  const isHigh = level === 'HIGH';

  // Theme color tokens for risk level
  const themeColor = isLow ? colors.success : isMedium ? colors.warning : colors.danger;
  const themeBg = isLow ? colors.softMint : isMedium ? colors.warningBg : colors.dangerBg;

  const renderStatusBadge = (status: string | null | undefined) => {
    const s = (status || '').toString().toUpperCase();
    if (s === 'PASS' || s === 'LOW_SUSPICION') {
      return (
        <View style={[styles.badgeContainer, styles.badgePass]}>
          <CheckCircle2 size={12} color={colors.success} />
          <Text style={[styles.badgeText, { color: colors.success }]}>PASS</Text>
        </View>
      );
    } else if (s === 'REVIEW' || s === 'MEDIUM_SUSPICION') {
      return (
        <View style={[styles.badgeContainer, styles.badgeReview]}>
          <AlertTriangle size={12} color={colors.warning} />
          <Text style={[styles.badgeText, { color: colors.warning }]}>REVIEW</Text>
        </View>
      );
    } else if (s === 'FAIL' || s === 'HIGH_SUSPICION') {
      return (
        <View style={[styles.badgeContainer, styles.badgeFail]}>
          <XCircle size={12} color={colors.danger} />
          <Text style={[styles.badgeText, { color: colors.danger }]}>FAIL</Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.badgeContainer, styles.badgeNotAvailable]}>
          <HelpCircle size={12} color={colors.mutedText} />
          <Text style={[styles.badgeText, { color: colors.mutedText }]}>NOT AVAILABLE</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>EXPLAINABLE RISK ASSESSMENT</Text>
        <View style={[styles.levelPill, { backgroundColor: themeBg }]}>
          <Text style={[styles.levelPillLabel, { color: themeColor }]}>
            {level} RISK
          </Text>
        </View>
      </View>

      {/* Main Score & Coverage Display */}
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
            <Text style={styles.coverageLabel}>VERIFICATION COVERAGE</Text>
            <Text style={styles.coverageValue}>{completedCount} / {totalCount}</Text>
            <Text style={styles.coverageSub}>{coverage.percentage}% Complete</Text>
          </View>
        </View>

        {/* Progress Bar */}
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
              ⚠ Verification Incomplete — Additional checks recommended
            </Text>
          </View>
        ) : null}
      </View>

      {/* Recommended Officer Action */}
      <View style={[styles.recommendationBanner, { borderColor: themeColor }]}>
        <View style={styles.recLeftRow}>
          {isLow ? (
            <ShieldCheck size={20} color={colors.success} />
          ) : isMedium ? (
            <AlertTriangle size={20} color={colors.warning} />
          ) : (
            <ShieldAlert size={20} color={colors.danger} />
          )}
          <View style={styles.recTextCol}>
            <Text style={styles.recTitle}>RECOMMENDED OFFICER ACTION</Text>
            <Text style={styles.recText}>{recommendation}</Text>
          </View>
        </View>
      </View>

      {/* Primary Verification Checks (7 Checks) */}
      <View style={styles.factorsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.factorsSectionTitle}>PRIMARY VERIFICATION CHECKS (7 CHECKS)</Text>
        </View>

        <View style={styles.factorsList}>
          {primaryChecksList.map((factor) => {
            const isExpanded = Boolean(expandedFactors[factor.name]);
            const isPenalized = factor.points > 0;

            return (
              <View key={factor.name} style={styles.factorItem}>
                <TouchableOpacity
                  onPress={() => toggleFactor(factor.name)}
                  style={styles.factorHeaderBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle details for ${factor.name}`}
                >
                  <View style={styles.factorLeft}>
                    <Text style={styles.factorName}>{factor.name}</Text>
                  </View>

                  <View style={styles.factorRight}>
                    {renderStatusBadge(factor.status)}
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

                {/* Collapsible Explanation */}
                {isExpanded ? (
                  <View style={styles.factorReasonContainer}>
                    <Text style={styles.factorReasonTitle}>Reasoning & Audit Signal:</Text>
                    <Text style={styles.factorReasonText}>{factor.reason}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {/* Supporting Signals Section */}
      <View style={styles.supportingSection}>
        <Text style={styles.factorsSectionTitle}>SUPPORTING SIGNALS</Text>
        <View style={styles.supportingGrid}>
          {/* Expiry Signal */}
          <View style={styles.supportingCard}>
            <Text style={styles.supportingLabel}>Passport Validity</Text>
            <Text style={styles.supportingReason}>
              {supporting_signals?.expiry?.reason || 'Within valid date threshold'}
            </Text>
            {renderStatusBadge(supporting_signals?.expiry?.status || 'PASS')}
          </View>

          {/* Image Quality Signal */}
          <View style={styles.supportingCard}>
            <Text style={styles.supportingLabel}>Image Quality</Text>
            <Text style={styles.supportingReason}>
              {supporting_signals?.image_quality?.reason || 'Image resolution & lighting acceptable'}
            </Text>
            {renderStatusBadge(supporting_signals?.image_quality?.status || 'PASS')}
          </View>
        </View>
      </View>

      {/* Expandable "Why this score?" Section */}
      <TouchableOpacity
        onPress={() => setShowExplanation(!showExplanation)}
        style={styles.whyHeaderBtn}
        accessibilityRole="button"
        accessibilityLabel="Toggle Why this score breakdown"
      >
        <Text style={styles.whyTitle}>Why this score?</Text>
        {showExplanation ? (
          <ChevronUp size={16} color={colors.primaryNavy} />
        ) : (
          <ChevronDown size={16} color={colors.primaryNavy} />
        )}
      </TouchableOpacity>

      {showExplanation ? (
        <View style={styles.whyExplanationCard}>
          <Text style={styles.whyHeader}>Risk Score Breakdown</Text>
          {primaryChecksList.map((f) => (
            <View key={f.name} style={styles.whyRow}>
              <Text style={styles.whyFactorName}>{f.name}</Text>
              <Text style={styles.whyFactorPoints}>{f.points} pts ({f.status})</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Security Wording Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Info size={13} color={colors.secondaryNavy} />
        <Text style={styles.disclaimerText}>
          This risk score is an explainable decision-support screening signal. Final clearance decision remains with the border control officer.
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  factorsSectionTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
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
  factorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgePass: {
    backgroundColor: colors.softMint,
  },
  badgeReview: {
    backgroundColor: colors.warningBg,
  },
  badgeFail: {
    backgroundColor: colors.dangerBg,
  },
  badgeNotAvailable: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '800',
  },
  pointsBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
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
  supportingSection: {
    marginBottom: spacing.md,
  },
  supportingGrid: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  supportingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportingLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  supportingReason: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  whyHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  whyTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  whyExplanationCard: {
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whyHeader: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
  },
  whyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  whyFactorName: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryNavy,
  },
  whyFactorPoints: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.softBlue,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.xs,
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
