import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { NetworkStatusIndicator } from '../../../components/ui/NetworkStatusIndicator';
import { DocumentValidationCard } from '../components/DocumentValidationCard';
import { TamperingAnalysisCard } from '../components/TamperingAnalysisCard';
import { FaceVerificationCard } from '../components/FaceVerificationCard';
import { BlockchainIntegrityCard } from '../components/BlockchainIntegrityCard';
import { CapturedDocument } from '../types/passportTypes';
import { PassportScreeningResponse } from '../../../services/screeningService';
import { FaceMatchResult } from '../../../services/faceVerificationService';

import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from '../../../theme';

import { SlideUpView } from '../../../utils/animations';

import {
  CheckCircle2,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  Scan,
  User,
  Hash,
  Globe,
  Calendar,
  UserCheck,
  Camera,
  AlertTriangle,
  Layers,
} from 'lucide-react-native';


export const VerificationResultsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument | undefined =
    route.params?.document;

  const screeningResponse:
    | (PassportScreeningResponse & {
      face_verification_result?: FaceMatchResult;
      updated_risk_score?: number;
      updated_risk_level?: string;
    })
    | undefined = route.params?.screeningResponse;

  const faceMatchResult: FaceMatchResult | undefined =
    route.params?.faceMatchResult ||
    screeningResponse?.face_verification_result;

  const isOfflineMode = Boolean(
    route.params?.isOfflineMode ||
    (screeningResponse as any)?.is_offline_mode
  );

  const localCaseId =
    route.params?.localCaseId ||
    (screeningResponse as any)?.local_case_id;

  const [showRawOcr, setShowRawOcr] =
    useState<boolean>(false);


  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', {
      screen: 'Home',
    });
  };


  const handleStartNewScreening = () => {
    navigation.navigate('PassportUpload');
  };


  // Existing face verification flow
  const handleVerifyPerson = () => {
    navigation.navigate('FaceVerification', {
      document,
      screeningResponse,
    });
  };


  // Team member offline queue flow
  const handleOpenOfflineQueue = () => {
    navigation.navigate('OfflineSync');
  };


  // Team member identity verification flow
  const handleStartFaceVerification = () => {
    navigation.navigate('IdentityVerification', {
      document,
      passportUri: document?.uri,
      verificationId: screeningResponse?.verification_id,
      currentScreeningResponse: screeningResponse,
    });
  };


  const fields = screeningResponse?.fields;
  const ocr = screeningResponse?.ocr;
  const mrz = screeningResponse?.mrz;
  const metadata = screeningResponse?.metadata;


  const ocrConfidencePercent = ocr
    ? Math.round(ocr.confidence * 100)
    : 0;

  const isMrzDetected = Boolean(mrz?.detected);


  // Determine overall risk display
  const currentRiskScore = isOfflineMode
    ? 32
    : (
      faceMatchResult?.updated_risk_score ??
      (
        faceMatchResult?.status === 'LOW_SIMILARITY'
          ? 72
          : 8
      )
    );


  const currentRiskLevel = isOfflineMode
    ? 'MEDIUM (PRELIMINARY)'
    : (
      faceMatchResult?.updated_risk_level ??
      (
        faceMatchResult?.status === 'LOW_SIMILARITY'
          ? 'HIGH'
          : 'LOW'
      )
    );


  const renderDataRow = (
    label: string,
    value: string | null | undefined,
    icon: React.ReactNode
  ) => {
    const isDetected = Boolean(
      value && value.trim() !== ''
    );

    return (
      <View style={styles.fieldRow}>
        <View style={styles.fieldIconWrapper}>
          {icon}
        </View>

        <View style={styles.fieldTextCol}>
          <Text style={styles.fieldLabel}>
            {label}
          </Text>

          <Text
            style={[
              styles.fieldValue,
              !isDetected && styles.notDetectedText,
            ]}
          >
            {isDetected
              ? value
              : isOfflineMode
                ? 'Queued for Server OCR'
                : 'Not detected'}
          </Text>
        </View>

        {!isDetected ? (
          <View style={styles.notDetectedBadge}>
            <Text style={styles.notDetectedBadgeLabel}>
              {isOfflineMode
                ? 'Pending Server'
                : 'Not detected'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };


  return (
    <ScreenContainer
      scrollable
      style={styles.screenBg}
      contentContainerStyle={styles.container}
    >

      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleReturnDashboard}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Return to dashboard"
        >
          <ArrowLeft
            size={18}
            color={colors.primaryNavy}
          />

          <Text style={styles.backText}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <NetworkStatusIndicator />
      </View>


      {/* Offline Mode Alert Banner */}
      {isOfflineMode && (
        <SlideUpView
          delay={50}
          style={styles.offlineBannerCard}
        >
          <View style={styles.offlineBannerHeader}>
            <Layers
              size={18}
              color="#D97706"
            />

            <Text style={styles.offlineBannerTitle}>
              OFFLINE VERIFICATION MODE
            </Text>
          </View>

          <Text style={styles.offlineBannerText}>
            Document captured and stored securely in
            local queue. Authoritative server verification
            will execute automatically once network is
            restored.
          </Text>

          {localCaseId && (
            <View style={styles.localCasePill}>
              <Text style={styles.localCasePillLabel}>
                Local Case ID: {localCaseId}
              </Text>
            </View>
          )}
        </SlideUpView>
      )}


      {/* Hero Header Card */}
      <SlideUpView
        delay={100}
        style={styles.heroCard}
      >
        <View style={styles.iconCircle}>
          <CheckCircle2
            size={36}
            color={
              isOfflineMode
                ? '#D97706'
                : colors.success
            }
          />
        </View>

        <Text style={styles.titleText}>
          {isOfflineMode
            ? 'Offline Preliminary Assessment'
            : 'Passport Information'}
        </Text>

        <Text style={styles.subtitleText}>
          {isOfflineMode
            ? 'Document queued for server synchronization'
            : 'Information extracted from the document'}
        </Text>


        {/* Status Indicators */}
        <View style={styles.badgesRow}>

          {/* MRZ Status */}
          <View
            style={[
              styles.statusPill,
              isMrzDetected
                ? styles.mrzSuccessPill
                : styles.mrzNeutralPill,
            ]}
          >
            <Scan
              size={14}
              color={
                isMrzDetected
                  ? colors.success
                  : colors.secondaryNavy
              }
            />

            <Text
              style={[
                styles.statusPillLabel,
                isMrzDetected
                  ? styles.mrzSuccessLabel
                  : styles.mrzNeutralLabel,
              ]}
            >
              {isMrzDetected
                ? 'MRZ Detected'
                : 'MRZ Not Detected'}
            </Text>
          </View>


          {/* OCR Confidence */}
          {ocr ? (
            <View style={styles.ocrPill}>
              <Cpu
                size={14}
                color={colors.primaryNavy}
              />

              <Text style={styles.ocrPillLabel}>
                OCR Confidence: {ocrConfidencePercent}%
              </Text>
            </View>
          ) : null}

        </View>
      </SlideUpView>


      {/* Extracted Passport Data */}
      <SlideUpView
        delay={150}
        style={styles.dataCard}
      >
        <View style={styles.dataCardHeader}>
          <Text style={styles.cardHeaderTitle}>
            EXTRACTED IDENTITY DETAILS
          </Text>

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
            <User
              size={18}
              color={colors.primaryNavy}
            />
          )}

          {renderDataRow(
            'Passport Number',
            fields?.passport_number,
            <Hash
              size={18}
              color={colors.primaryNavy}
            />
          )}

          {renderDataRow(
            'Nationality',
            fields?.nationality,
            <Globe
              size={18}
              color={colors.primaryNavy}
            />
          )}

          {renderDataRow(
            'Date of Birth',
            fields?.date_of_birth,
            <Calendar
              size={18}
              color={colors.primaryNavy}
            />
          )}

          {renderDataRow(
            'Gender',
            fields?.gender,
            <UserCheck
              size={18}
              color={colors.primaryNavy}
            />
          )}

          {renderDataRow(
            'Date of Issue',
            fields?.date_of_issue,
            <Calendar
              size={18}
              color={colors.secondaryText}
            />
          )}

          {renderDataRow(
            'Date of Expiry',
            fields?.date_of_expiry,
            <Calendar
              size={18}
              color={colors.primaryNavy}
            />
          )}

        </View>
      </SlideUpView>


      {/* Face Matching / Identity Verification */}
      <SlideUpView delay={180}>
        {faceMatchResult ? (
          <FaceVerificationCard
            result={faceMatchResult}
          />
        ) : (
          <View style={styles.facePromptCard}>

            <View style={styles.facePromptHeader}>
              <View style={styles.facePromptIconCircle}>
                <Camera
                  size={20}
                  color={colors.primaryNavy}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.facePromptTitle}>
                  IDENTITY VERIFICATION
                </Text>

                <Text style={styles.facePromptSubtitle}>
                  Compare live traveler face against
                  extracted passport portrait.
                </Text>
              </View>
            </View>


            <TouchableOpacity
              style={styles.verifyIdentityBtn}
              onPress={handleStartFaceVerification}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start live face verification"
            >
              <Camera
                size={18}
                color="#FFFFFF"
              />

              <Text style={styles.verifyIdentityBtnText}>
                Verify Identity (Live Face Match)
              </Text>
            </TouchableOpacity>

          </View>
        )}
      </SlideUpView>


      {/* Automated Document Validation */}
      <SlideUpView delay={200}>
        <DocumentValidationCard
          validation={screeningResponse?.validation}
        />
      </SlideUpView>


      {/* Tampering Analysis */}
      <SlideUpView delay={210}>
        <TamperingAnalysisCard
          analysis={
            screeningResponse?.tampering_analysis
          }
          documentUri={document?.uri}
        />
      </SlideUpView>


      {/* Overall Risk Assessment */}
      <SlideUpView
        delay={220}
        style={styles.overallRiskCard}
      >
        <View style={styles.riskHeaderRow}>

          <Text style={styles.riskCardTitle}>
            OVERALL RISK ASSESSMENT
          </Text>

          <View
            style={[
              styles.riskPill,
              currentRiskLevel === 'CRITICAL' ||
                currentRiskLevel === 'HIGH'
                ? styles.riskPillHigh
                : currentRiskLevel === 'MEDIUM'
                  ? styles.riskPillMedium
                  : styles.riskPillLow,
            ]}
          >
            <Text
              style={[
                styles.riskPillBaseText,
                currentRiskLevel === 'CRITICAL' ||
                  currentRiskLevel === 'HIGH'
                  ? styles.riskPillTextHigh
                  : currentRiskLevel === 'MEDIUM'
                    ? styles.riskPillTextMedium
                    : styles.riskPillTextLow,
              ]}
            >
              {currentRiskLevel} — {currentRiskScore}/100
            </Text>
          </View>

        </View>


        <View style={styles.riskSignalsRow}>

          <View style={styles.signalBadge}>
            <CheckCircle2
              size={13}
              color="#059669"
            />

            <Text style={styles.signalBadgeText}>
              OCR Complete
            </Text>
          </View>


          <View style={styles.signalBadge}>
            <CheckCircle2
              size={13}
              color="#059669"
            />

            <Text style={styles.signalBadgeText}>
              MRZ Valid
            </Text>
          </View>


          <View style={styles.signalBadge}>

            {faceMatchResult ? (
              faceMatchResult.status ===
                'STRONG_MATCH' ? (
                <>
                  <CheckCircle2
                    size={13}
                    color="#059669"
                  />

                  <Text style={styles.signalBadgeText}>
                    Identity:{' '}
                    {Math.round(
                      faceMatchResult.similarity_score
                    )}
                    %
                  </Text>
                </>
              ) : (
                <>
                  <AlertTriangle
                    size={13}
                    color="#DC2626"
                  />

                  <Text
                    style={[
                      styles.signalBadgeText,
                      { color: '#DC2626' },
                    ]}
                  >
                    Identity:{' '}
                    {faceMatchResult.status ===
                      'LOW_SIMILARITY'
                      ? 'Low Similarity'
                      : 'Inconclusive'}
                  </Text>
                </>
              )
            ) : (
              <Text
                style={[
                  styles.signalBadgeText,
                  { color: '#64748B' },
                ]}
              >
                Identity Pending
              </Text>
            )}

          </View>

        </View>
      </SlideUpView>

      {/* Blockchain Integrity Layer (Polygon Amoy) */}
      <SlideUpView delay={220}>
        <BlockchainIntegrityCard
          verificationId={screeningResponse?.verification_id}
          blockchainData={(screeningResponse as any)?.blockchain}
          isOfflineMode={isOfflineMode}
        />
      </SlideUpView>

      {/* Document Thumbnail */}
      {document ? (
        <SlideUpView
          delay={230}
          style={styles.documentCard}
        >
          <Text style={styles.cardHeaderTitle}>
            PROCESSED PASSPORT IMAGE
          </Text>

          <View style={styles.documentRow}>

            <View style={styles.thumbnailWrapper}>
              <Image
                source={{ uri: document.uri }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.docInfoCol}>

              <Text
                style={styles.docNameText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {document.fileName}
              </Text>

              <Text style={styles.docMetaText}>
                {document.fileSizeFormatted}
              </Text>

              <View style={styles.statusBadgeRow}>
                <ShieldCheck
                  size={13}
                  color={colors.success}
                />

                <Text style={styles.statusBadgeLabel}>
                  Document Processed
                </Text>
              </View>

            </View>
          </View>

        </SlideUpView>
      ) : null}


      {/* Raw OCR */}
      {ocr?.raw_text ? (
        <SlideUpView
          delay={240}
          style={styles.ocrToggleCard}
        >
          <TouchableOpacity
            onPress={() =>
              setShowRawOcr(!showRawOcr)
            }
            style={styles.ocrToggleBtn}
            accessibilityRole="button"
            accessibilityLabel="View extracted raw OCR text"
          >
            <View style={styles.ocrToggleLeft}>

              <FileText
                size={16}
                color={colors.primaryNavy}
              />

              <Text style={styles.ocrToggleTitle}>
                View extracted text
              </Text>

            </View>

            {showRawOcr ? (
              <ChevronUp
                size={18}
                color={colors.secondaryText}
              />
            ) : (
              <ChevronDown
                size={18}
                color={colors.secondaryText}
              />
            )}

          </TouchableOpacity>


          {showRawOcr ? (
            <View style={styles.rawOcrContainer}>
              <Text style={styles.rawOcrText}>
                {ocr.raw_text}
              </Text>
            </View>
          ) : null}

        </SlideUpView>
      ) : null}


      {/* Action Buttons */}
      <View style={styles.actionsContainer}>

        {isOfflineMode ? (
          <PrimaryButton
            title="View Offline Queue"
            onPress={handleOpenOfflineQueue}
            accessibilityLabel="View Offline Queue"
          />
        ) : (
          <PrimaryButton
            title="Verify Person"
            onPress={handleVerifyPerson}
            icon={
              <UserCheck
                size={18}
                color="#FFFFFF"
              />
            }
            accessibilityLabel="Proceed to live face verification"
          />
        )}


        <SecondaryButton
          title={
            screeningResponse?.tampering_analysis
              ?.status === 'HIGH_SUSPICION'
              ? 'Manual Review Required'
              : screeningResponse?.tampering_analysis
                ?.status === 'MEDIUM_SUSPICION'
                ? 'Manual Review Recommended'
                : 'Return to Dashboard'
          }
          onPress={handleReturnDashboard}
          accessibilityLabel="Officer Action Review Button"
          style={styles.secondaryBtn}
        />


        <SecondaryButton
          title="Start New Screening"
          onPress={handleStartNewScreening}
          icon={
            <RefreshCw
              size={16}
              color={colors.primaryNavy}
            />
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  offlineBannerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 16,
    marginBottom: 16,
    ...shadows.soft,
  },

  offlineBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  offlineBannerTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },

  offlineBannerText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
    marginBottom: 10,
  },

  localCasePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },

  localCasePillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
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
    marginBottom: spacing.md,
  },

  titleText: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  subtitleText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  mrzSuccessPill: {
    backgroundColor: colors.softMint,
    borderColor: '#A7F3D0',
  },

  mrzNeutralPill: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },

  statusPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },

  mrzSuccessLabel: {
    color: '#065F46',
  },

  mrzNeutralLabel: {
    color: colors.secondaryNavy,
  },

  ocrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },

  ocrPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryNavy,
  },

  /* Face Prompt Card */
  facePromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    padding: 16,
    marginBottom: 16,
    ...shadows.soft,
  },

  facePromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  facePromptIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  facePromptTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },

  facePromptSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  verifyIdentityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    ...shadows.soft,
  },

  verifyIdentityBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Overall Risk Card */
  overallRiskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    ...shadows.soft,
  },

  riskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  riskCardTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },

  riskPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  riskPillBaseText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },

  riskPillLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },

  riskPillTextLow: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },

  riskPillMedium: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },

  riskPillTextMedium: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 12,
  },

  riskPillHigh: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  riskPillTextHigh: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
  },

  riskSignalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  signalBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  /* Extracted Data Card */
  dataCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.soft,
  },

  dataCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FAFCFF',
  },

  cardHeaderTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryNavy,
    letterSpacing: 0.8,
  },

  fieldsCountText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryNavy,
  },

  fieldsList: {
    paddingHorizontal: spacing.lg,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  fieldIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  fieldTextCol: {
    flex: 1,
  },

  fieldLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 2,
  },

  fieldValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },

  notDetectedText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontWeight: '400',
  },

  notDetectedBadge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },

  notDetectedBadgeLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#64748B',
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
    marginTop: spacing.md,
    gap: spacing.md,
  },

  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
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
    fontFamily:
      Platform.OS === 'ios'
        ? 'Menlo'
        : 'monospace',
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
