import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { CapturedDocument } from '../types/passportTypes';
import { PassportScreeningResponse } from '../../../services/screeningService';
import { FaceVerificationResponse } from '../../../services/faceVerificationService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { SlideUpView } from '../../../utils/animations';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  User,
  Info,
  Scan,
} from 'lucide-react-native';

export const FaceVerificationResultScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument | undefined = route.params?.document;
  const verificationResponse: FaceVerificationResponse | undefined = route.params?.verificationResponse;
  const liveFaceUri: string | undefined = route.params?.liveFaceUri;

  const resultData = verificationResponse?.face_verification;

  // Extract structured backend signals with safe fallback mapping
  const passportFaceDetected: boolean =
    resultData?.passport_face_detected ?? Boolean(resultData?.passport_face?.detected);
  const liveFaceDetected: boolean =
    resultData?.live_face_detected ?? Boolean(resultData?.live_face?.detected);
  const facePositioned: boolean =
    resultData?.face_positioned ?? (resultData?.quality?.live_face !== 'POOR');
  const livenessPassed: boolean =
    resultData?.liveness_passed ?? (resultData?.liveness?.status === 'PASS');
  const similarityScore: number | null =
    resultData?.similarity_score ??
    (resultData?.similarity != null && resultData.similarity > 0 ? resultData.similarity : null);
  const matchThreshold: number = resultData?.match_threshold ?? 0.50;

  // Final verification status resolution
  const rawStatus = resultData?.status;
  let finalStatus: 'PASS' | 'REVIEW' | 'FAIL' = 'REVIEW';
  if (rawStatus === 'PASS' || rawStatus === 'MATCH') {
    finalStatus = 'PASS';
  } else if (rawStatus === 'FAIL' || rawStatus === 'MISMATCH') {
    finalStatus = 'FAIL';
  } else {
    finalStatus = 'REVIEW';
  }

  const isPass = finalStatus === 'PASS';
  const isReview = finalStatus === 'REVIEW';
  const isFail = finalStatus === 'FAIL';

  const screeningResponse: PassportScreeningResponse | undefined = route.params?.screeningResponse;

  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleRetryVerification = () => {
    navigation.navigate('FaceVerification', { document, screeningResponse });
  };

  const handleViewRiskAssessment = () => {
    navigation.navigate('RiskAssessment', {
      document,
      screeningResponse,
      verificationResponse,
    });
  };

  const renderStatusHeader = () => {
    let headerTitle = 'VERIFICATION REQUIRES REVIEW';
    let headerSubtitle = resultData?.message || 'Manual inspection recommended.';
    let pillLabel = 'REVIEW';
    let pillStyle = styles.reviewPill;
    let pillText = styles.reviewPillLabel;
    let iconCircleStyle = styles.warningCircle;
    let IconComponent = AlertTriangle;
    let iconColor: string = colors.warning;

    if (isPass) {
      headerTitle = 'FACE VERIFIED';
      headerSubtitle = resultData?.message || 'Passport face and live face match.';
      pillLabel = 'PASS';
      pillStyle = styles.matchPill;
      pillText = styles.matchPillLabel;
      iconCircleStyle = styles.successCircle;
      IconComponent = CheckCircle2;
      iconColor = colors.success;
    } else if (isFail) {
      headerTitle = 'FACE VERIFICATION FAILED';
      headerSubtitle = resultData?.message || 'Passport face and live face do not sufficiently match.';
      pillLabel = 'FAIL';
      pillStyle = styles.mismatchPill;
      pillText = styles.mismatchPillLabel;
      iconCircleStyle = styles.errorCircle;
      IconComponent = XCircle;
      iconColor = colors.danger;
    }

    return (
      <View style={styles.heroCard}>
        <View style={[styles.iconCircle, iconCircleStyle]}>
          <IconComponent size={36} color={iconColor} />
        </View>

        <View style={[styles.badgePill, pillStyle]}>
          <Text style={pillText}>{pillLabel}</Text>
        </View>

        <Text style={styles.resultTitle}>{headerTitle}</Text>
        <Text style={styles.resultSubtitle}>{headerSubtitle}</Text>

        {/* Status Indicators Grid */}
        <View style={styles.signalsGrid}>
          <View style={styles.signalTile}>
            <Text style={styles.signalTileLabel}>Passport Face</Text>
            <Text style={[styles.signalTileValue, { color: passportFaceDetected ? colors.success : colors.warning }]}>
              {passportFaceDetected ? '✓ Detected' : '✕ Not Detected'}
            </Text>
          </View>

          <View style={styles.signalTile}>
            <Text style={styles.signalTileLabel}>Live Face</Text>
            <Text style={[styles.signalTileValue, { color: liveFaceDetected ? colors.success : colors.warning }]}>
              {liveFaceDetected ? '✓ Detected' : '✕ Not Detected'}
            </Text>
          </View>

          <View style={styles.signalTile}>
            <Text style={styles.signalTileLabel}>Liveness</Text>
            <Text style={[styles.signalTileValue, { color: livenessPassed ? colors.success : colors.warning }]}>
              {livenessPassed ? '✓ Passed' : '⚠ Review'}
            </Text>
          </View>

          <View style={styles.signalTile}>
            <Text style={styles.signalTileLabel}>Face Match</Text>
            <Text
              style={[
                styles.signalTileValue,
                { color: isPass ? colors.success : isFail ? colors.danger : colors.warning },
              ]}
            >
              {isPass ? '✓ Match' : isFail ? '✕ No Match' : '⚠ Inconclusive'}
            </Text>
          </View>
        </View>

        {/* Similarity Score Card */}
        <View style={styles.similarityBox}>
          <Text style={styles.similarityLabel}>FACE SIMILARITY</Text>
          {similarityScore != null ? (
            <>
              <Text
                style={[
                  styles.similarityValue,
                  { color: isPass ? colors.success : isFail ? colors.danger : colors.warning },
                ]}
              >
                {Math.round(similarityScore * 100)}%
              </Text>
              <Text style={styles.similaritySubtext}>
                Match threshold: {Math.round(matchThreshold * 100)}%
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.similarityValue, { color: colors.secondaryText, fontSize: 20 }]}>
                Not available
              </Text>
              <Text style={styles.similaritySubtext}>
                Face comparison was inconclusive or incomplete
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Header Bar */}
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

      {/* Main Document Face Verification Section */}
      <SlideUpView delay={100}>
        <View style={styles.sectionHeader}>
          <View style={styles.headerTitleRow}>
            <Scan size={16} color={colors.secondaryNavy} />
            <Text style={styles.sectionTitle}>DOCUMENT FACE VERIFICATION</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Passport photo vs live camera</Text>
        </View>

        {renderStatusHeader()}
      </SlideUpView>

      {/* Side-by-Side Face Comparison Card */}
      <SlideUpView delay={150} style={styles.comparisonCard}>
        <Text style={styles.cardHeaderTitle}>FACE COMPARISON</Text>

        <View style={styles.facesRow}>
          {/* Passport Photo Face */}
          <View style={styles.faceCol}>
            <Text style={styles.faceColLabel}>Passport Photo</Text>
            <View style={styles.faceFrame}>
              {document?.uri ? (
                <Image source={{ uri: document.uri }} style={styles.faceImg} resizeMode="cover" />
              ) : (
                <User size={36} color={colors.mutedText} />
              )}
            </View>
            <View style={styles.detectedBadge}>
              {passportFaceDetected ? (
                <>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={styles.detectedText}>Face Detected</Text>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} color={colors.warning} />
                  <Text style={[styles.detectedText, { color: colors.warning }]}>Not Detected</Text>
                </>
              )}
            </View>
          </View>

          {/* Versus Divider */}
          <View style={styles.vsContainer}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>

          {/* Live Camera Face */}
          <View style={styles.faceCol}>
            <Text style={styles.faceColLabel}>Live Camera</Text>
            <View style={styles.faceFrame}>
              {liveFaceUri ? (
                <Image source={{ uri: liveFaceUri }} style={styles.faceImg} resizeMode="cover" />
              ) : (
                <User size={36} color={colors.mutedText} />
              )}
            </View>
            <View style={styles.detectedBadge}>
              {liveFaceDetected ? (
                <>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={styles.detectedText}>Live Person</Text>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} color={colors.warning} />
                  <Text style={[styles.detectedText, { color: colors.warning }]}>Not Detected</Text>
                </>
              )}
            </View>
          </View>
        </View>
      </SlideUpView>

      {/* Audit Checklist Card */}
      <SlideUpView delay={180} style={styles.checklistCard}>
        <Text style={styles.cardHeaderTitle}>VERIFICATION AUDIT DETAILS</Text>

        <View style={styles.checkList}>
          {/* Passport Face Detected Audit Row */}
          <View style={styles.checkRow}>
            {passportFaceDetected ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.warning} />
            )}
            <Text style={styles.checkLabel}>
              Passport Face {passportFaceDetected ? 'Detected' : 'Not Detected'}
            </Text>
          </View>

          {/* Live Face Positioned Audit Row */}
          <View style={styles.checkRow}>
            {liveFaceDetected && facePositioned ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : (
              <AlertTriangle size={16} color={colors.warning} />
            )}
            <Text style={styles.checkLabel}>
              Live Face {liveFaceDetected && facePositioned ? 'Positioned & Sufficient Quality' : 'Positioning Insufficient'}
            </Text>
          </View>

          {/* Liveness Audit Row */}
          {(() => {
            const livenessStatus = resultData?.liveness?.status || (livenessPassed ? 'PASS' : 'REVIEW');
            const isLivenessPass = livenessStatus === 'PASS';
            const isLivenessFail = livenessStatus === 'FAIL';
            const isLivenessReview = livenessStatus === 'REVIEW';

            const iconColor = isLivenessPass
              ? colors.success
              : isLivenessFail
              ? colors.danger
              : isLivenessReview
              ? colors.warning
              : colors.mutedText;

            const labelText = isLivenessPass
              ? 'Liveness Verified'
              : isLivenessFail
              ? 'Liveness Failed'
              : isLivenessReview
              ? 'Liveness Requires Review'
              : 'Liveness Check Unavailable';

            return (
              <View style={styles.checkRow}>
                {isLivenessPass ? (
                  <CheckCircle2 size={16} color={iconColor} />
                ) : isLivenessFail ? (
                  <XCircle size={16} color={iconColor} />
                ) : (
                  <AlertTriangle size={16} color={iconColor} />
                )}
                <Text style={styles.checkLabel}>
                  {labelText} ({resultData?.liveness?.method || 'basic_challenge'})
                </Text>
              </View>
            );
          })()}

          {/* Face Comparison Final Audit Row */}
          <View style={styles.checkRow}>
            {isPass ? (
              <CheckCircle2 size={16} color={colors.success} />
            ) : isFail ? (
              <XCircle size={16} color={colors.danger} />
            ) : (
              <AlertTriangle size={16} color={colors.warning} />
            )}
            <Text style={styles.checkLabel}>
              Face Comparison {isPass ? 'Passed' : isFail ? 'Failed' : 'Requires Review'}
            </Text>
          </View>

          <View style={styles.checkRow}>
            <ShieldCheck size={16} color={colors.primaryNavy} />
            <Text style={styles.checkLabel}>
              Model Architecture: OpenCV YuNet + SFace (ArcFace)
            </Text>
          </View>
        </View>
      </SlideUpView>

      {/* Security Disclaimer Notice */}
      <SlideUpView delay={200} style={styles.securityNoticeCard}>
        <Info size={16} color={colors.secondaryNavy} />
        <Text style={styles.securityNoticeText}>
          This system provides AI-assisted face similarity analysis. It does not treat face verification as absolute proof of identity. The final decision remains with the border control officer.
        </Text>
      </SlideUpView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <PrimaryButton
          title="View Risk Assessment"
          onPress={handleViewRiskAssessment}
          icon={<ShieldCheck size={18} color="#FFFFFF" />}
        />
        {isPass ? (
          <SecondaryButton title="Return to Dashboard" onPress={handleReturnDashboard} style={styles.secondaryBtn} />
        ) : (
          <>
            <SecondaryButton title="Recapture Live Face" onPress={handleRetryVerification} style={styles.secondaryBtn} />
            <SecondaryButton
              title="Return to Dashboard"
              onPress={handleReturnDashboard}
              style={styles.secondaryBtn}
            />
          </>
        )}
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
  sectionHeader: {
    marginBottom: spacing.sm,
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
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  successCircle: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.25)',
  },
  warningCircle: {
    backgroundColor: '#FEF3C7',
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  errorCircle: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(198, 40, 40, 0.25)',
  },
  badgePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.xs,
  },
  matchPill: {
    backgroundColor: colors.softMint,
  },
  matchPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  reviewPill: {
    backgroundColor: '#FEF3C7',
  },
  reviewPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  mismatchPill: {
    backgroundColor: colors.dangerBg,
  },
  mismatchPillLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  resultTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  signalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  signalTile: {
    width: '48%',
    backgroundColor: colors.paleBlue,
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signalTileLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.secondaryText,
  },
  signalTileValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  similarityBox: {
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  similarityLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  similarityValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 32,
    fontWeight: '800',
  },
  similaritySubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 2,
  },
  comparisonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  cardHeaderTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  facesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  faceCol: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  faceColLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  faceFrame: {
    width: 100,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceImg: {
    width: '100%',
    height: '100%',
  },
  detectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detectedText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  vsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  vsText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondaryNavy,
  },
  checklistCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  checkList: {
    gap: spacing.sm,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkLabel: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    color: colors.primaryNavy,
  },
  securityNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.paleBlue,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(31, 78, 121, 0.15)',
    marginBottom: spacing.xl,
  },
  securityNoticeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryNavy,
    flex: 1,
    lineHeight: 16,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  secondaryBtn: {
    marginTop: 0,
  },
});

export default FaceVerificationResultScreen;
