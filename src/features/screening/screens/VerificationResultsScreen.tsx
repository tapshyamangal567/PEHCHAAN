import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { DocumentValidationCard } from '../components/DocumentValidationCard';
import { TamperingAnalysisCard } from '../components/TamperingAnalysisCard';
import { CapturedDocument } from '../types/passportTypes';
import { PassportScreeningResponse } from '../../../services/screeningService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import {
  CheckCircle2,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Scan,
  User,
  Hash,
  Globe,
  Calendar,
  UserCheck,
} from 'lucide-react-native';

export const VerificationResultsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument | undefined = route.params?.document;
  const screeningResponse: PassportScreeningResponse | undefined = route.params?.screeningResponse;

  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleStartNewScreening = () => {
    navigation.navigate('PassportUpload');
  };

  const fields = screeningResponse?.fields;
  const ocr = screeningResponse?.ocr;
  const mrz = screeningResponse?.mrz;
  const metadata = screeningResponse?.metadata;

  const ocrConfidencePercent = ocr ? Math.round(ocr.confidence * 100) : 0;
  const isMrzDetected = Boolean(mrz?.detected);

  const renderDataRow = (
    label: string,
    value: string | null | undefined,
    icon: React.ReactNode
  ) => {
    const isDetected = Boolean(value && value.trim() !== '');
    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrapper}>{icon}</View>
        <View style={styles.fieldTextCol}>
          <Text style={styles.fieldLabel}>{label}</Text>
          <Text style={[styles.fieldValue, !isDetected && styles.notDetectedText]}>
            {isDetected ? value : 'Not detected'}
          </Text>
        </View>
        {!isDetected ? (
          <View style={styles.notDetectedBadge}>
            <Text style={styles.notDetectedBadgeLabel}>Not detected</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleReturnDashboard}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Return to dashboard"
        >
          <ArrowLeft size={18} color={colors.primaryNavy} />
          <Text style={styles.backText}>Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Header Card */}
      <SlideUpView delay={100} style={styles.heroCard}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={36} color={colors.success} />
        </View>

        <Text style={styles.titleText}>Passport Information</Text>
        <Text style={styles.subtitleText}>Information extracted from the document</Text>

        {/* Status Indicators Row */}
        <View style={styles.badgesRow}>
          {/* MRZ Status Badge */}
          <View
            style={[
              styles.statusPill,
              isMrzDetected ? styles.mrzSuccessPill : styles.mrzNeutralPill,
            ]}
          >
            <Scan size={14} color={isMrzDetected ? colors.success : colors.secondaryNavy} />
            <Text
              style={[
                styles.statusPillLabel,
                isMrzDetected ? styles.mrzSuccessLabel : styles.mrzNeutralLabel,
              ]}
            >
              {isMrzDetected ? 'MRZ Detected' : 'MRZ Not Detected'}
            </Text>
          </View>

          {/* OCR Confidence Badge */}
          {ocr ? (
            <View style={styles.ocrPill}>
              <Cpu size={14} color={colors.primaryNavy} />
              <Text style={styles.ocrPillLabel}>OCR Confidence: {ocrConfidencePercent}%</Text>
            </View>
          ) : null}
        </View>
      </SlideUpView>

      {/* Extracted Passport Data Grid Card */}
      <SlideUpView delay={150} style={styles.dataCard}>
        <View style={styles.dataCardHeader}>
          <Text style={styles.cardHeaderTitle}>EXTRACTED IDENTITY DETAILS</Text>
          {metadata ? (
            <Text style={styles.fieldsCountText}>
              {metadata.fields_extracted} / 7 fields
            </Text>
          ) : null}
        </View>

        <View style={styles.fieldsList}>
          {renderDataRow(
            'Full Name',
            fields?.full_name,
            <User size={18} color={colors.primaryNavy} />
          )}
          {renderDataRow(
            'Passport Number',
            fields?.passport_number,
            <Hash size={18} color={colors.primaryNavy} />
          )}
          {renderDataRow(
            'Nationality',
            fields?.nationality,
            <Globe size={18} color={colors.primaryNavy} />
          )}
          {renderDataRow(
            'Date of Birth',
            fields?.date_of_birth,
            <Calendar size={18} color={colors.primaryNavy} />
          )}
          {renderDataRow(
            'Gender',
            fields?.gender,
            <UserCheck size={18} color={colors.primaryNavy} />
          )}
          {renderDataRow(
            'Date of Issue',
            fields?.date_of_issue,
            <Calendar size={18} color={colors.secondaryText} />
          )}
          {renderDataRow(
            'Date of Expiry',
            fields?.date_of_expiry,
            <Calendar size={18} color={colors.primaryNavy} />
          )}
        </View>
      </SlideUpView>

      {/* Automated Document Validation Section */}
      <SlideUpView delay={180}>
        <DocumentValidationCard validation={screeningResponse?.validation} />
      </SlideUpView>

      {/* AI-Assisted Document Authenticity / Tampering Analysis Section */}
      <SlideUpView delay={200}>
        <TamperingAnalysisCard
          analysis={screeningResponse?.tampering_analysis}
          documentUri={document?.uri}
        />
      </SlideUpView>

      {/* Document Thumbnail Card */}
      {document ? (
        <SlideUpView delay={220} style={styles.documentCard}>
          <Text style={styles.cardHeaderTitle}>PROCESSED PASSPORT IMAGE</Text>

          <View style={styles.documentRow}>
            <View style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: document.uri }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.docInfoCol}>
              <Text style={styles.docNameText} numberOfLines={1} ellipsizeMode="middle">
                {document.fileName}
              </Text>
              <Text style={styles.docMetaText}>{document.fileSizeFormatted}</Text>

              <View style={styles.statusBadgeRow}>
                <ShieldCheck size={13} color={colors.success} />
                <Text style={styles.statusBadgeLabel}>Document Processed</Text>
              </View>
            </View>
          </View>
        </SlideUpView>
      ) : null}

      {/* Optional Raw OCR Collapsible Toggle */}
      {ocr?.raw_text ? (
        <SlideUpView delay={250} style={styles.ocrToggleCard}>
          <TouchableOpacity
            onPress={() => setShowRawOcr(!showRawOcr)}
            style={styles.ocrToggleBtn}
            accessibilityRole="button"
            accessibilityLabel="View extracted raw OCR text"
          >
            <View style={styles.ocrToggleLeft}>
              <FileText size={16} color={colors.primaryNavy} />
              <Text style={styles.ocrToggleTitle}>View extracted text</Text>
            </View>
            {showRawOcr ? (
              <ChevronUp size={18} color={colors.secondaryText} />
            ) : (
              <ChevronDown size={18} color={colors.secondaryText} />
            )}
          </TouchableOpacity>

          {showRawOcr ? (
            <View style={styles.rawOcrContainer}>
              <Text style={styles.rawOcrText}>{ocr.raw_text}</Text>
            </View>
          ) : null}
        </SlideUpView>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <PrimaryButton
          title={
            screeningResponse?.tampering_analysis?.status === 'HIGH_SUSPICION'
              ? 'Manual Review Required'
              : screeningResponse?.tampering_analysis?.status === 'MEDIUM_SUSPICION'
              ? 'Manual Review Recommended'
              : screeningResponse?.tampering_analysis?.status === 'INCONCLUSIVE'
              ? 'Retake Document'
              : 'Continue Review'
          }
          onPress={handleReturnDashboard}
          accessibilityLabel="Officer Action Review Button"
        />
        <SecondaryButton
          title="Start New Screening"
          onPress={handleStartNewScreening}
          icon={<RefreshCw size={16} color={colors.primaryNavy} />}
          accessibilityLabel="Start another passport screening"
          style={styles.secondaryBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: spacing.xxxl * 2,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
  backText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.softMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  mrzSuccessPill: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.25)',
  },
  mrzSuccessLabel: {
    color: colors.success,
  },
  mrzNeutralPill: {
    backgroundColor: colors.paleBlue,
    borderColor: colors.border,
  },
  mrzNeutralLabel: {
    color: colors.secondaryNavy,
  },
  statusPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  ocrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.softBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(31, 78, 121, 0.15)',
  },
  ocrPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  fieldsCountText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  fieldsList: {
    gap: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  fieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTextCol: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  notDetectedText: {
    color: colors.mutedText,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  notDetectedBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  notDetectedBadgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
  },
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  docInfoCol: {
    flex: 1,
  },
  docNameText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  docMetaText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  ocrToggleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    ...shadows.soft,
  },
  ocrToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  ocrToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ocrToggleTitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  rawOcrContainer: {
    backgroundColor: '#1E293B',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rawOcrText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  secondaryBtn: {
    marginTop: 0,
  },
});

export default VerificationResultsScreen;
