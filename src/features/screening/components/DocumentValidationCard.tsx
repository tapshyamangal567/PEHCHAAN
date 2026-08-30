import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
} from 'lucide-react-native';
import { ValidationResult, ValidationCheckItem } from '../../../services/screeningService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface DocumentValidationCardProps {
  validation?: ValidationResult | null;
}

export const DocumentValidationCard: React.FC<DocumentValidationCardProps> = ({ validation }) => {
  if (!validation) {
    return null;
  }

  const { overall_status, checks, passed, failed, not_available } = validation;

  const renderCheckRow = (key: string, title: string, item?: ValidationCheckItem) => {
    if (!item) return null;

    const { status, message } = item;

    let icon = <HelpCircle size={16} color={colors.mutedText} />;
    let badgeStyle: any = styles.badgeNotAvailable;
    let badgeTextStyle: any = styles.badgeTextNotAvailable;
    let labelText = 'N/A';

    if (status === 'PASS') {
      icon = <CheckCircle2 size={16} color={colors.success} />;
      badgeStyle = styles.badgePass;
      badgeTextStyle = styles.badgeTextPass;
      labelText = 'PASS';
    } else if (status === 'FAIL') {
      icon = <XCircle size={16} color={colors.danger} />;
      badgeStyle = styles.badgeFail;
      badgeTextStyle = styles.badgeTextFail;
      labelText = 'FAIL';
    } else if (status === 'REVIEW' || status === 'NOT_AVAILABLE') {
      icon = <AlertCircle size={16} color={colors.warning} />;
      badgeStyle = styles.badgeReview;
      badgeTextStyle = styles.badgeTextReview;
      labelText = status === 'REVIEW' ? 'REVIEW' : 'N/A';
    }

    return (
      <View key={key} style={styles.checkRow}>
        <View style={styles.checkIconCol}>{icon}</View>

        <View style={styles.checkTextCol}>
          <Text style={styles.checkTitle}>{title}</Text>
          <Text style={styles.checkMessage}>{message}</Text>
        </View>

        <View style={[styles.statusBadge, badgeStyle]}>
          <Text style={[styles.statusBadgeText, badgeTextStyle]}>{labelText}</Text>
        </View>
      </View>
    );
  };

  const isPass = overall_status === 'PASS';
  const isFail = overall_status === 'FAIL';

  return (
    <View style={styles.cardContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <FileCheck2 size={16} color={colors.secondaryNavy} />
          <Text style={styles.sectionTitle}>DOCUMENT VALIDATION</Text>
        </View>
        <Text style={styles.sectionSubtitle}>Automated integrity & format checks</Text>
      </View>

      {/* Main Overall Status Banner */}
      <View
        style={[
          styles.statusBanner,
          isPass ? styles.bannerPass : isFail ? styles.bannerFail : styles.bannerReview,
        ]}
      >
        <View
          style={[
            styles.bannerIconCircle,
            isPass ? styles.iconPass : isFail ? styles.iconFail : styles.iconReview,
          ]}
        >
          {isPass ? (
            <ShieldCheck size={22} color={colors.success} />
          ) : isFail ? (
            <XCircle size={22} color={colors.danger} />
          ) : (
            <AlertTriangle size={22} color={colors.warning} />
          )}
        </View>

        <View style={styles.bannerTextCol}>
          <Text
            style={[
              styles.bannerTitleText,
              isPass ? styles.titlePass : isFail ? styles.titleFail : styles.titleReview,
            ]}
          >
            {isPass
              ? '✓ Document checks passed'
              : isFail
              ? '✕ Validation failed'
              : '⚠ Document requires review'}
          </Text>

          <Text style={styles.bannerSubtext}>
            {isPass
              ? 'All evaluated document parameters passed automated validation rules.'
              : isFail
              ? 'One or more checks failed (e.g. expired document or MRZ structural error).'
              : 'Some document fields or MRZ parameters require officer verification.'}
          </Text>
        </View>
      </View>

      {/* Quick Summary Counts */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>PASSED</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{passed}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>REVIEW</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{not_available}</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>FAILED</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>{failed}</Text>
        </View>
      </View>

      {/* Individual Checks List */}
      <View style={styles.checksList}>
        {renderCheckRow('mrz_detected', 'MRZ Detection', checks?.mrz_detected)}
        {renderCheckRow('mrz_structure', 'MRZ Structure', checks?.mrz_structure)}
        {renderCheckRow('passport_number', 'Passport Number', checks?.passport_number)}
        {renderCheckRow('date_of_birth', 'Date of Birth', checks?.date_of_birth)}
        {renderCheckRow('date_of_expiry', 'Expiry Date', checks?.date_of_expiry)}
        {renderCheckRow('gender', 'Gender', checks?.gender)}
        {renderCheckRow('nationality', 'Nationality', checks?.nationality)}
        {renderCheckRow('ocr_mrz_consistency', 'OCR / MRZ Consistency', checks?.ocr_mrz_consistency)}
        {renderCheckRow('required_fields', 'Identity Completeness', checks?.required_fields)}
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
  bannerPass: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.25)',
  },
  bannerFail: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.25)',
  },
  bannerReview: {
    backgroundColor: colors.warningBg,
    borderColor: 'rgba(183, 121, 31, 0.25)',
  },
  bannerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPass: {
    backgroundColor: 'rgba(46, 125, 91, 0.12)',
  },
  iconFail: {
    backgroundColor: 'rgba(180, 35, 24, 0.12)',
  },
  iconReview: {
    backgroundColor: 'rgba(183, 121, 31, 0.12)',
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
  titlePass: {
    color: colors.success,
  },
  titleFail: {
    color: colors.danger,
  },
  titleReview: {
    color: colors.warning,
  },
  bannerSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    lineHeight: 16,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.paleBlue,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  checksList: {
    gap: spacing.xs,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 225, 234, 0.5)',
    gap: spacing.sm,
  },
  checkIconCol: {
    width: 24,
    alignItems: 'center',
  },
  checkTextCol: {
    flex: 1,
  },
  checkTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  checkMessage: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgePass: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  badgeTextPass: {
    color: colors.success,
  },
  badgeFail: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.2)',
  },
  badgeTextFail: {
    color: colors.danger,
  },
  badgeReview: {
    backgroundColor: colors.warningBg,
    borderColor: 'rgba(183, 121, 31, 0.2)',
  },
  badgeTextReview: {
    color: colors.warning,
  },
  badgeNotAvailable: {
    backgroundColor: colors.paleBlue,
    borderColor: colors.border,
  },
  badgeTextNotAvailable: {
    color: colors.mutedText,
  },
  statusBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default DocumentValidationCard;
