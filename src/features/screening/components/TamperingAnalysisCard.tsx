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
  const [showSignals, setShowSignals] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  if (!analysis) return null;

  const { status, score, signals, suspicious_regions, reasons, method } = analysis;

  const isLow = status === 'LOW_SUSPICION';
  const isMed = status === 'MEDIUM_SUSPICION';
  const isHigh = status === 'HIGH_SUSPICION';
  const isInconclusive = status === 'INCONCLUSIVE';

  const renderSignalProgress = (label: string, value: number) => {
    const percent = Math.round(value * 100);
    let barColor: string = colors.success;
    if (value >= 0.35 && value < 0.50) barColor = colors.warning;
    if (value >= 0.50) barColor = colors.danger;

    return (
      <View key={label} style={styles.signalRow}>
        <View style={styles.signalHeader}>
          <Text style={styles.signalLabel}>{label}</Text>
          <Text style={[styles.signalPercent, { color: barColor }]}>{percent}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.max(4, percent))}%`, backgroundColor: barColor }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.cardContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <ScanEye size={16} color={colors.secondaryNavy} />
          <Text style={styles.sectionTitle}>DOCUMENT AUTHENTICITY ANALYSIS</Text>
        </View>
        <Text style={styles.sectionSubtitle}>AI-assisted image forensic assessment</Text>
      </View>

      {/* Main Status Banner */}
      <View
        style={[
          styles.statusBanner,
          isLow
            ? styles.bannerLow
            : isMed
            ? styles.bannerMed
            : isHigh
            ? styles.bannerHigh
            : styles.bannerInconclusive,
        ]}
      >
        <View
          style={[
            styles.bannerIconCircle,
            isLow
              ? styles.iconLow
              : isMed
              ? styles.iconMed
              : isHigh
              ? styles.iconHigh
              : styles.iconInconclusive,
          ]}
        >
          {isLow ? (
            <ShieldCheck size={22} color={colors.success} />
          ) : isMed ? (
            <AlertTriangle size={22} color={colors.warning} />
          ) : isHigh ? (
            <AlertCircle size={22} color={colors.danger} />
          ) : (
            <HelpCircle size={22} color={colors.mutedText} />
          )}
        </View>

        <View style={styles.bannerTextCol}>
          <Text
            style={[
              styles.bannerTitleText,
              isLow
                ? styles.titleLow
                : isMed
                ? styles.titleMed
                : isHigh
                ? styles.titleHigh
                : styles.titleInconclusive,
            ]}
          >
            {isLow
              ? 'Low Tampering Suspicion'
              : isMed
              ? 'Medium Tampering Suspicion'
              : isHigh
              ? 'High Tampering Suspicion'
              : 'Inconclusive Assessment'}
          </Text>

          <Text style={styles.bannerSubtext}>
            {isLow
              ? 'No strong forensic anomalies detected across image compression or texture layers.'
              : isMed
              ? 'Localized compression or texture anomalies detected. Manual review recommended.'
              : isHigh
              ? 'Multiple strong forensic anomalies detected across image layers. Manual review required.'
              : 'Image resolution or contrast is insufficient for reliable forensic analysis.'}
          </Text>
        </View>
      </View>

      {/* Methodology Badge */}
      <View style={styles.methodPill}>
        <Cpu size={12} color={colors.secondaryNavy} />
        <Text style={styles.methodPillText}>
          Method: OpenCV Forensic Baseline (baseline-1.0) • Score: {score.toFixed(2)}
        </Text>
      </View>

      {/* Suspicious Regions Alert Banner (if regions detected) */}
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

      {/* Explainable Reasons */}
      {reasons && reasons.length > 0 ? (
        <View style={styles.reasonsBox}>
          <Text style={styles.reasonsHeaderTitle}>FORENSIC FINDINGS</Text>
          {reasons.map((reason, idx) => (
            <View key={idx} style={styles.reasonRow}>
              <View style={styles.reasonBullet} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Expandable Forensic Signals */}
      <TouchableOpacity
        onPress={() => setShowSignals(!showSignals)}
        style={styles.toggleSignalsBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.toggleSignalsText}>
          {showSignals ? 'Hide Forensic Signals' : 'View Measurable Forensic Signals'}
        </Text>
        {showSignals ? (
          <ChevronUp size={16} color={colors.primaryNavy} />
        ) : (
          <ChevronDown size={16} color={colors.primaryNavy} />
        )}
      </TouchableOpacity>

      {showSignals ? (
        <View style={styles.signalsContainer}>
          {renderSignalProgress('Compression Anomaly (ELA)', signals.compression_anomaly)}
          {renderSignalProgress('Texture Pattern Variance', signals.texture_anomaly)}
          {renderSignalProgress('High-Freq Noise Distribution', signals.noise_anomaly)}
          {renderSignalProgress('Edge Boundary Consistency', signals.edge_anomaly)}
          {renderSignalProgress('Illumination Gradient', signals.illumination_anomaly)}
        </View>
      ) : null}

      {/* Suspicious Region Modal Overlay */}
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  bannerLow: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.25)',
  },
  bannerMed: {
    backgroundColor: colors.warningBg,
    borderColor: 'rgba(183, 121, 31, 0.25)',
  },
  bannerHigh: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.25)',
  },
  bannerInconclusive: {
    backgroundColor: colors.paleBlue,
    borderColor: colors.border,
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLow: {
    backgroundColor: 'rgba(46, 125, 91, 0.12)',
  },
  iconMed: {
    backgroundColor: 'rgba(183, 121, 31, 0.12)',
  },
  iconHigh: {
    backgroundColor: 'rgba(180, 35, 24, 0.12)',
  },
  iconInconclusive: {
    backgroundColor: 'rgba(102, 112, 133, 0.12)',
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
  titleLow: { color: colors.success },
  titleMed: { color: colors.warning },
  titleHigh: { color: colors.danger },
  titleInconclusive: { color: colors.secondaryText },
  bannerSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 16,
  },
  methodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paleBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  methodPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
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
  reasonsBox: {
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  reasonsHeaderTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reasonBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.secondaryNavy,
  },
  reasonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryNavy,
    fontWeight: '500',
  },
  toggleSignalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toggleSignalsText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  signalsContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  signalRow: {
    gap: 2,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
  },
  signalPercent: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.paleBlue,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
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
