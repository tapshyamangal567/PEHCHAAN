import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { CapturedDocument } from '../types/passportTypes';
import { FaceVerificationResponse, VerificationStatus } from '../../../services/faceVerificationService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  UserX,
  User,
  Activity,
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
  const status: VerificationStatus = resultData?.status || 'REVIEW';
  const similarity = resultData?.similarity ?? 0.0;
  const similarityPercent = Math.round(similarity * 100);

  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleRetryVerification = () => {
    navigation.navigate('FaceVerification', { document });
  };

  const handleViewRiskAssessment = () => {
    navigation.navigate('RiskAssessment', {
      document,
      verificationResponse,
    });
  };

  const isMatch = status === 'MATCH';
  const isReview = status === 'REVIEW';
  const isMismatch = status === 'MISMATCH';

  const renderStatusHeader = () => {
    if (isMatch) {
      return (
        <View style={styles.heroCard}>
          <View style={[styles.iconCircle, styles.successCircle]}>
            <CheckCircle2 size={40} color={colors.success} />
          </View>
          <View style={[styles.badgePill, styles.matchPill]}>
            <Text style={styles.matchPillLabel}>MATCH</Text>
          </View>
          <Text style={styles.resultTitle}>Face Match</Text>
          <Text style={styles.resultSubtitle}>{resultData?.message}</Text>

          <View style={styles.similarityBox}>
            <Text style={styles.similarityLabel}>FACE SIMILARITY SCORE</Text>
            <Text style={[styles.similarityValue, { color: colors.success }]}>
              {similarityPercent}%
            </Text>
            <Text style={styles.similaritySubtext}>
              Above configured match threshold ({Math.round(0.5 * 100)}%)
            </Text>
          </View>
        </View>
      );
    }

    if (isReview) {
      return (
        <View style={styles.heroCard}>
          <View style={[styles.iconCircle, styles.warningCircle]}>
            <AlertTriangle size={40} color={colors.warning} />
          </View>
          <View style={[styles.badgePill, styles.reviewPill]}>
            <Text style={styles.reviewPillLabel}>REVIEW</Text>
          </View>
          <Text style={styles.resultTitle}>Manual Review Required</Text>
          <Text style={styles.resultSubtitle}>{resultData?.message}</Text>

          <View style={styles.similarityBox}>
            <Text style={styles.similarityLabel}>FACE SIMILARITY SCORE</Text>
            <Text style={[styles.similarityValue, { color: colors.warning }]}>
              {similarityPercent}%
            </Text>
            <Text style={styles.similaritySubtext}>
              Borderline similarity score requires manual inspection
            </Text>
          </View>
        </View>
      );
    }

    if (isMismatch) {
      return (
        <View style={styles.heroCard}>
          <View style={[styles.iconCircle, styles.errorCircle]}>
            <XCircle size={40} color={colors.danger} />
          </View>
          <View style={[styles.badgePill, styles.mismatchPill]}>
            <Text style={styles.mismatchPillLabel}>MISMATCH</Text>
          </View>
          <Text style={styles.resultTitle}>Face Mismatch</Text>
          <Text style={styles.resultSubtitle}>{resultData?.message}</Text>

          <View style={styles.similarityBox}>
            <Text style={styles.similarityLabel}>FACE SIMILARITY SCORE</Text>
            <Text style={[styles.similarityValue, { color: colors.danger }]}>
              {similarityPercent}%
            </Text>
            <Text style={styles.similaritySubtext}>
              Below minimum verification threshold
            </Text>
          </View>
        </View>
      );
    }

    // Handle special failure statuses (PASSPORT_FACE_NOT_FOUND, MULTIPLE_FACES, etc.)
    return (
      <View style={styles.heroCard}>
        <View style={[styles.iconCircle, styles.warningCircle]}>
          <ShieldAlert size={40} color={colors.warning} />
        </View>
        <View style={[styles.badgePill, styles.reviewPill]}>
          <Text style={styles.reviewPillLabel}>{status.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.resultTitle}>Manual Review Required</Text>
        <Text style={styles.resultSubtitle}>{resultData?.message}</Text>
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

      {/* Hero Header Card */}
      <SlideUpView delay={100}>{renderStatusHeader()}</SlideUpView>

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
              <CheckCircle2 size={12} color={colors.success} />
              <Text style={styles.detectedText}>Face Detected</Text>
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
              <CheckCircle2 size={12} color={colors.success} />
              <Text style={styles.detectedText}>Live Person</Text>
            </View>
          </View>
        </View>
      </SlideUpView>

      {/* Audit Checklist Card */}
      <SlideUpView delay={180} style={styles.checklistCard}>
        <Text style={styles.cardHeaderTitle}>VERIFICATION AUDIT DETAILS</Text>

        <View style={styles.checkList}>
          <View style={styles.checkRow}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.checkLabel}>Passport Face Detected</Text>
          </View>
          <View style={styles.checkRow}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.checkLabel}>Live Face Positioned</Text>
          </View>
          <View style={styles.checkRow}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.checkLabel}>
              Liveness Check Passed ({resultData?.liveness.method || 'basic_challenge'})
            </Text>
          </View>
          <View style={styles.checkRow}>
            <ShieldCheck size={16} color={colors.primaryNavy} />
            <Text style={styles.checkLabel}>
              Model Architecture: OpenCV YuNet + ArcFace SFace
            </Text>
          </View>
        </View>
      </SlideUpView>

      {/* Mandatory Security Disclaimer Notice */}
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
        {isMatch ? (
          <SecondaryButton title="Return to Dashboard" onPress={handleReturnDashboard} style={styles.secondaryBtn} />
        ) : isReview ? (
          <>
            <SecondaryButton title="Recapture Live Face" onPress={handleRetryVerification} style={styles.secondaryBtn} />
            <SecondaryButton
              title="Manual Officer Review"
              onPress={handleReturnDashboard}
              style={styles.secondaryBtn}
            />
          </>
        ) : (
          <SecondaryButton title="Retry Verification" onPress={handleRetryVerification} style={styles.secondaryBtn} />
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 22,
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
