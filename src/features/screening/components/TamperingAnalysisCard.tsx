import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ScanEye,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Cpu,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import { TamperingAnalysisResult } from '../../../services/screeningService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface TamperingAnalysisCardProps {
  analysis?: TamperingAnalysisResult | null;
  documentUri?: string;
}

export const TamperingAnalysisCard: React.FC<TamperingAnalysisCardProps> = ({
  analysis,
  documentUri,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // 1. DATA MISSING / NULL CASE
  if (!analysis) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <ScanEye size={16} color={colors.secondaryNavy} />
            <Text style={styles.sectionTitle}>DOCUMENT AUTHENTICITY ANALYSIS</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Image forensic assessment</Text>
        </View>

        <View style={styles.unavailableBanner}>
          <HelpCircle size={22} color={colors.mutedText} />
          <View style={styles.unavailableTextCol}>
            <Text style={styles.unavailableTitle}>AUTHENTICITY ANALYSIS UNAVAILABLE</Text>
            <Text style={styles.unavailableSubtext}>
              No reliable forensic signal was returned for this document.
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimerText}>
          Automated image forensics provides screening signals only. It does not independently establish document authenticity. Final verification remains with the authorized officer.
        </Text>
      </View>
    );
  }

  const { status, score = 0, signals, suspicious_regions, reasons, method, model_version } = analysis;

  // 2. DYNAMIC SCORE MAPPING & CLASSIFICATION (UI interpretation thresholds)
  const percentScore = Math.round(score * 100);

  let resultTitle: string = 'LOW FORENSIC SIGNAL';
  let resultDescription: string = 'No strong visual or texture anomalies detected. Standard screening procedures apply.';
  let categoryColor: string = colors.success;
  let categoryBg: string = colors.softMint;
  let categoryBorder: string = 'rgba(46, 125, 91, 0.25)';
  let CategoryIcon: React.ComponentType<{ size?: number; color?: string }> = ShieldCheck;

  if (status === 'INCONCLUSIVE') {
    resultTitle = '⚠ Inconclusive Forensic Assessment';
    resultDescription = 'Image quality limits reliable forensic assessment. Manual review recommended.';
    categoryColor = colors.secondaryText;
    categoryBg = colors.paleBlue;
    categoryBorder = colors.border;
    CategoryIcon = HelpCircle;
  } else if (status === 'HIGH_SUSPICION' || score >= 0.50) {
    resultTitle = '⚠ High Tampering Suspicion';
    resultDescription = 'Multiple agreeing forensic anomalies indicate possible localized manipulation. Manual verification required.';
    categoryColor = colors.danger;
    categoryBg = colors.dangerBg;
    categoryBorder = 'rgba(180, 35, 24, 0.25)';
    CategoryIcon = AlertCircle;
  } else if (status === 'MEDIUM_SUSPICION' || score >= 0.20) {
    resultTitle = '⚠ Medium Tampering Suspicion';
    resultDescription = 'Localized compression or texture anomalies detected. Manual review is recommended.';
    categoryColor = colors.warning;
    categoryBg = colors.warningBg;
    categoryBorder = 'rgba(183, 121, 31, 0.25)';
    CategoryIcon = AlertTriangle;
  } else {
    resultTitle = '✓ Low Tampering Suspicion';
    resultDescription = 'No significant localized forensic anomaly detected. Standard screening procedures apply.';
    categoryColor = colors.success;
    categoryBg = colors.softMint;
    categoryBorder = 'rgba(46, 125, 91, 0.25)';
    CategoryIcon = ShieldCheck;
  }

  // 3. FORENSIC ASSESSMENT CHECKS MATRIX
  const assessmentChecks = [
    {
      name: 'Image Quality',
      status: status === 'INCONCLUSIVE' ? 'REVIEW' : 'PASS',
      label: status === 'INCONCLUSIVE' ? 'Low Resolution / Blur' : 'Sufficient Quality',
    },
    {
      name: 'Compression Consistency',
      status: signals?.compression_anomaly == null ? 'NOT AVAILABLE' : signals.compression_anomaly < 0.35 ? 'PASS' : 'REVIEW',
      label: signals?.compression_anomaly == null ? 'Signal N/A' : signals.compression_anomaly < 0.35 ? 'Uniform Compression' : 'Compression Anomaly',
    },
    {
      name: 'Text / Edge Consistency',
      status: signals?.edge_anomaly == null ? 'NOT AVAILABLE' : signals.edge_anomaly < 0.35 ? 'PASS' : 'REVIEW',
      label: signals?.edge_anomaly == null ? 'Signal N/A' : signals.edge_anomaly < 0.35 ? 'Consistent Edges' : 'Edge Density Variance',
    },
    {
      name: 'Localized Artifacts',
      status: !suspicious_regions || suspicious_regions.length === 0 ? 'PASS' : 'REVIEW',
      label: !suspicious_regions || suspicious_regions.length === 0 ? 'None Flagged' : `${suspicious_regions.length} Patch(es) Flagged`,
    },
    {
      name: 'Overall Forensic Signal',
      status: score < 0.35 ? 'PASS' : 'REVIEW',
      label: score < 0.35 ? 'Within Baseline' : 'Elevated Signal',
    },
  ];

  // 4. RECOMMENDED ACTION DETERMINATION
  let actionTitle: string = 'Routine verification';
  let actionSubtext: string = 'Proceed with standard identity verification procedures.';
  let actionBadgeColor: string = colors.success;

  if (score >= 0.75) {
    actionTitle = 'Detailed manual inspection recommended';
    actionSubtext = 'Thorough physical or secondary document inspection required.';
    actionBadgeColor = colors.danger;
  } else if (score >= 0.20) {
    actionTitle = 'Manual verification recommended';
    actionSubtext = 'Conduct secondary document review before finalizing decision.';
    actionBadgeColor = colors.warning;
  }

  // Helper for human-readable reason mapping
  const mapReasonToDetail = (reasonStr: string) => {
    const lower = reasonStr.toLowerCase();
    if (lower.includes('compression')) {
      return {
        title: 'Localized Compression Anomaly',
        description: 'Compression pattern variations detected across image sectors.',
      };
    }
    if (lower.includes('texture')) {
      return {
        title: 'Texture Pattern Variance',
        description: 'Surface texture distribution exhibits localized variation.',
      };
    }
    if (lower.includes('noise')) {
      return {
        title: 'Noise Pattern Anomaly',
        description: 'Noise profile exhibits non-uniform distribution across document regions.',
      };
    }
    if (lower.includes('edge') || lower.includes('boundary')) {
      return {
        title: 'Localized Image Artifact',
        description: 'A region of the image contains edge or boundary characteristics that differ from surrounding areas.',
      };
    }
    if (lower.includes('illumination') || lower.includes('light')) {
      return {
        title: 'Illumination Gradient Anomaly',
        description: 'Light distribution across the document surface shows non-uniform gradients.',
      };
    }
    return {
      title: 'Observed Forensic Signal',
      description: reasonStr,
    };
  };

  return (
    <View style={styles.cardContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <ScanEye size={16} color={colors.secondaryNavy} />
          <Text style={styles.sectionTitle}>DOCUMENT AUTHENTICITY ANALYSIS</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Image forensic assessment</Text>
      </View>

      {/* Main Result Card */}
      <View style={[styles.statusBanner, { backgroundColor: categoryBg, borderColor: categoryBorder }]}>
        <View style={styles.bannerIconCircle}>
          <CategoryIcon size={22} color={categoryColor} />
        </View>

        <View style={styles.bannerTextCol}>
          <Text style={[styles.bannerTitleText, { color: categoryColor }]}>{resultTitle}</Text>
          <Text style={styles.bannerSubtext}>{resultDescription}</Text>
        </View>
      </View>

      {/* Forensic Assessment Checks Table */}
      <View style={styles.assessmentBox}>
        <Text style={styles.boxHeaderTitle}>FORENSIC ASSESSMENT</Text>
        <View style={styles.checksList}>
          {assessmentChecks.map((item, idx) => {
            const isPass = item.status === 'PASS';
            const isReview = item.status === 'REVIEW';
            const badgeBg = isPass ? colors.softMint : isReview ? colors.warningBg : '#F3F4F6';
            const badgeText = isPass ? colors.success : isReview ? colors.warning : colors.mutedText;

            return (
              <View key={idx} style={styles.checkRow}>
                <View style={styles.checkLeft}>
                  <Text style={styles.checkName}>{item.name}</Text>
                  <Text style={styles.checkMeta}>{item.label}</Text>
                </View>
                <View style={[styles.checkBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.checkBadgeLabel, { color: badgeText }]}>{item.status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Suspicion Score Visualizer Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeaderRow}>
          <Text style={styles.scoreTitle}>Image Forensic Signal</Text>
          <Text style={styles.scoreValueText}>
            <Text style={styles.scoreNumber}>{percentScore}</Text> / 100
          </Text>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, Math.max(4, percentScore))}%`,
                backgroundColor: categoryColor,
              },
            ]}
          />
        </View>

        <View style={styles.scoreExplRow}>
          <Info size={13} color={colors.secondaryText} />
          <Text style={styles.scoreExplText}>
            This score represents image-forensic signals only. It does not confirm that the passport is fraudulent.
          </Text>
        </View>
      </View>

      {/* Suspicious Regions Alert Banner (if regions flagged) */}
      {suspicious_regions && suspicious_regions.length > 0 ? (
        <View style={styles.regionsAlertCard}>
          <View style={styles.regionsAlertHeader}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.regionsAlertTitle}>
              {suspicious_regions.length} Suspicious Region(s) Flagged
            </Text>
          </View>
          <Text style={styles.regionsAlertSubtext}>
            Localized pixel/texture deviations detected. Inspect high-resolution overlay.
          </Text>
          {documentUri ? (
            <TouchableOpacity
              onPress={() => setShowRegionModal(true)}
              style={styles.viewRegionBtn}
              activeOpacity={0.7}
            >
              <Maximize2 size={12} color={colors.white} />
              <Text style={styles.viewRegionBtnText}>View Region Overlay</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Detected Signals / Forensic Findings */}
      <View style={styles.findingsBox}>
        <Text style={styles.boxHeaderTitle}>DETECTED SIGNALS</Text>
        {reasons && reasons.length > 0 ? (
          reasons.map((reason, idx) => {
            const detail = mapReasonToDetail(reason);
            return (
              <View key={idx} style={styles.findingCard}>
                <View style={styles.findingHeader}>
                  <View style={styles.findingDot} />
                  <Text style={styles.findingTitle}>{detail.title}</Text>
                </View>
                <Text style={styles.findingDesc}>{detail.description}</Text>
              </View>
            );
          })
        ) : (
          <View style={styles.noFindingRow}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={styles.noFindingText}>No localized anomalies detected across scanned layers.</Text>
          </View>
        )}
      </View>

      {/* Recommended Action Card */}
      <View style={styles.actionCard}>
        <View style={styles.actionHeaderRow}>
          <Text style={styles.actionHeaderTitle}>RECOMMENDED ACTION</Text>
          <View style={[styles.actionPill, { backgroundColor: actionBadgeColor }]}>
            <Text style={styles.actionPillText}>{actionTitle}</Text>
          </View>
        </View>
        <Text style={styles.actionSubtext}>{actionSubtext}</Text>
        <Text style={styles.actionOfficerNote}>
          Note: Final verification decision remains with the authorized officer.
        </Text>
      </View>

      {/* Collapsible Technical Details */}
      <TouchableOpacity
        onPress={() => setShowTechnicalDetails(!showTechnicalDetails)}
        style={styles.techToggleBtn}
        activeOpacity={0.7}
      >
        <View style={styles.techToggleLeft}>
          <Cpu size={14} color={colors.primaryNavy} />
          <Text style={styles.techToggleText}>Technical Details</Text>
        </View>
        {showTechnicalDetails ? (
          <ChevronUp size={16} color={colors.primaryNavy} />
        ) : (
          <ChevronDown size={16} color={colors.primaryNavy} />
        )}
      </TouchableOpacity>

      {showTechnicalDetails ? (
        <View style={styles.techDetailsBox}>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Analysis Engine:</Text>
            <Text style={styles.techValue}>Image Forensics</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Method:</Text>
            <Text style={styles.techValue}>{method || 'OpenCV Forensic Baseline'}</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Version:</Text>
            <Text style={styles.techValue}>{model_version || 'baseline-1.0'}</Text>
          </View>
          <View style={styles.techRow}>
            <Text style={styles.techLabel}>Score:</Text>
            <Text style={styles.techValue}>{score.toFixed(2)}</Text>
          </View>

          {signals ? (
            <View style={styles.signalsSubbox}>
              <Text style={styles.signalsSubboxTitle}>Available Signal Metrics:</Text>
              {Object.entries(signals).map(([key, val]) => (
                <View key={key} style={styles.signalMetricRow}>
                  <Text style={styles.signalMetricKey}>{key.replace(/_/g, ' ')}:</Text>
                  <Text style={styles.signalMetricVal}>
                    {typeof val === 'number' ? val.toFixed(2) : String(val)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Mandatory Disclaimer */}
      <Text style={styles.disclaimerText}>
        Automated image forensics provides screening signals only. It does not independently establish document authenticity. Final verification remains with the authorized officer.
      </Text>

      {/* Suspicious Region Inspector Modal Overlay */}
      {showRegionModal && documentUri ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowRegionModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Suspicious Region Inspector</Text>
                <TouchableOpacity onPress={() => setShowRegionModal(false)} style={styles.modalCloseBtn}>
                  <X size={20} color={colors.white} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalFrame}>
                <Image source={{ uri: documentUri }} style={styles.modalImage} resizeMode="contain" />
              </View>

              <Text style={styles.modalFooterText}>
                Forensic patches exceeding 3.0 std dev relative to background texture.
              </Text>
            </View>
          </View>
        </Modal>
      ) : null}
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
  sectionHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryNavy,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paleBlue,
    marginBottom: spacing.md,
  },
  unavailableTextCol: {
    flex: 1,
  },
  unavailableTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
    marginBottom: 2,
  },
  unavailableSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitleText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 16,
  },
  assessmentBox: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  boxHeaderTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  checksList: {
    gap: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checkLeft: {
    flex: 1,
  },
  checkName: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  checkMeta: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
  },
  checkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  checkBadgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scoreTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  scoreValueText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
  },
  scoreNumber: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.paleBlue,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreExplRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  scoreExplText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    flex: 1,
    lineHeight: 14,
  },
  regionsAlertCard: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  regionsAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  regionsAlertTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  regionsAlertSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    marginBottom: spacing.sm,
  },
  viewRegionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  viewRegionBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  findingsBox: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  findingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  findingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  findingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondaryNavy,
  },
  findingTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  findingDesc: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    paddingLeft: 12,
  },
  noFindingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  noFindingText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  actionHeaderTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  actionPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  actionSubtext: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryNavy,
    marginBottom: 4,
  },
  actionOfficerNote: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  techToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  techToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techToggleText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  techDetailsBox: {
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  techRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  techLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
  },
  techValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  signalsSubbox: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 2,
  },
  signalsSubboxTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  signalMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalMetricKey: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#CBD5E1',
    textTransform: 'capitalize',
  },
  signalMetricVal: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  disclaimerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 15,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 25, 44, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: colors.primaryNavy,
    borderRadius: 12,
  },
  modalFrame: {
    width: '100%',
    height: 240,
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalFooterText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
  },
});

export default TamperingAnalysisCard;
