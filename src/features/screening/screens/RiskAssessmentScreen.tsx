import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';
import { CapturedDocument } from '../types/passportTypes';
import { PassportScreeningResponse } from '../../../services/screeningService';
import { FaceVerificationResponse } from '../../../services/faceVerificationService';
import RiskScoringService, { RiskAssessmentData } from '../../../services/riskScoringService';
import { colors, typography, spacing, shadows } from '../../../theme';
import { SlideUpView } from '../../../utils/animations';
import { ArrowLeft, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react-native';

export const RiskAssessmentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument | undefined = route.params?.document;
  const screeningResponse: PassportScreeningResponse | undefined = route.params?.screeningResponse;
  const verificationResponse: FaceVerificationResponse | undefined = route.params?.verificationResponse;

  const [assessment, setAssessment] = useState<RiskAssessmentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiskAssessment = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        // Build combined payload from module outputs
        const payload: Record<string, any> = {
          mrz: screeningResponse?.mrz,
          consistency: screeningResponse?.consistency,
          validation: screeningResponse?.validation,
          tampering_analysis: screeningResponse?.tampering_analysis,
          face_verification: verificationResponse?.face_verification,
          liveness: verificationResponse?.face_verification?.liveness,
          quality: verificationResponse?.face_verification?.quality,
          fields: screeningResponse?.fields,
        };

        const res = await RiskScoringService.assessRisk(payload);
        if (res.success && res.risk_assessment) {
          setAssessment(res.risk_assessment);
        } else {
          setErrorMsg('Failed to compute risk assessment.');
        }
      } catch (err: any) {
        console.error('Risk assessment API error:', err);
        setErrorMsg(
          err?.response?.data?.detail?.message ||
            err?.message ||
            'Unable to connect to PEHCHAAN server.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAssessment();
  }, [screeningResponse, verificationResponse]);

  const handleReturnDashboard = () => {
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleStartNewScreening = () => {
    navigation.navigate('PassportUpload');
  };

  if (loading) {
    return (
      <ScreenContainer style={styles.centerBg}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
        <Text style={styles.loadingText}>Calculating Explainable Risk Score...</Text>
      </ScreenContainer>
    );
  }

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

      {errorMsg ? (
        <View style={styles.errorCard}>
          <AlertCircle size={20} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : assessment ? (
        <SlideUpView delay={100}>
          <RiskAssessmentCard assessment={assessment} />
        </SlideUpView>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {assessment?.level === 'LOW' ? (
          <PrimaryButton
            title="Proceed to Officer Review"
            onPress={handleReturnDashboard}
            icon={<ShieldCheck size={18} color="#FFFFFF" />}
          />
        ) : assessment?.level === 'MEDIUM' ? (
          <PrimaryButton
            title="Manual Review Recommended"
            onPress={handleReturnDashboard}
          />
        ) : (
          <PrimaryButton
            title="Manual Verification Required"
            onPress={handleReturnDashboard}
          />
        )}

        <SecondaryButton
          title="Start New Screening"
          onPress={handleStartNewScreening}
          icon={<RefreshCw size={16} color={colors.primaryNavy} />}
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
  centerBg: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    color: colors.primaryNavy,
    fontWeight: '600',
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.danger,
    flex: 1,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  secondaryBtn: {
    marginTop: 0,
  },
});

export default RiskAssessmentScreen;
