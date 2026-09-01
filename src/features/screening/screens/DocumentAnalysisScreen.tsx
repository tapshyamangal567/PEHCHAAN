import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { AnalysisScanningFrame } from '../components/AnalysisScanningFrame';
import { AnalysisProgressChecklist } from '../components/AnalysisProgressChecklist';
import { CancelAnalysisModal } from '../components/CancelAnalysisModal';
import { AnalysisErrorCard } from '../components/AnalysisErrorCard';
import { CapturedDocument, AnalysisStepItem } from '../types/passportTypes';
import ScreeningService, { PassportScreeningResponse } from '../../../services/screeningService';
import { OfflineStorageService } from '../../../services/offline/offlineStorageService';
import { API_BASE_URL } from '../../../config/api';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import { Lock, CheckCircle2, X, WifiOff, AlertTriangle, RefreshCw, Layers } from 'lucide-react-native';

const INITIAL_STEPS: AnalysisStepItem[] = [
  {
    id: 'step-1',
    backendStep: 'PREPARING',
    label: 'Preparing document',
    status: 'active',
    startTimeMs: 0,
  },
  {
    id: 'step-2',
    backendStep: 'UPLOADING',
    label: 'Uploading document',
    status: 'pending',
    startTimeMs: 600,
  },
  {
    id: 'step-3',
    backendStep: 'OCR_PROCESSING',
    label: 'Extracting information',
    status: 'pending',
    startTimeMs: 1800,
  },
  {
    id: 'step-4',
    backendStep: 'PARSING',
    label: 'Processing passport',
    status: 'pending',
    startTimeMs: 3400,
  },
  {
    id: 'step-5',
    backendStep: 'COMPLETED',
    label: 'Preparing results',
    status: 'pending',
    startTimeMs: 5000,
  },
];

export const DocumentAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument = route.params?.document || {
    uri: '',
    source: 'gallery',
    fileName: 'passport.jpg',
    fileSize: 2516582,
    fileSizeFormatted: '2.4 MB',
    mimeType: 'image/jpeg',
    capturedAt: new Date().toISOString(),
  };

  const [steps, setSteps] = useState<AnalysisStepItem[]>(INITIAL_STEPS);
  const [progress, setProgress] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<{ title: string; description: string }>({
    title: 'Unable to process passport',
    description: 'Please check your connection and try again.',
  });
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  useEffect(() => {
    isCancelledRef.current = false;
    runRealPassportAnalysis();

    return () => {
      isCancelledRef.current = true;
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const [isOfflineModalVisible, setIsOfflineModalVisible] = useState<boolean>(false);

  const handleContinueOffline = async () => {
    try {
      setIsOfflineModalVisible(false);
      // Create secure offline case
      const offlineCase = await OfflineStorageService.createOfflineCase({
        documentUri: document.uri,
        documentName: document.fileName,
        documentSizeFormatted: document.fileSizeFormatted,
      });

      // Construct preliminary offline screening response
      const preliminaryResponse: any = {
        success: true,
        document_type: 'passport',
        is_offline_mode: true,
        local_case_id: offlineCase.local_case_id,
        ocr: {
          raw_text: '',
          confidence: 0.0,
          status_label: 'UNAVAILABLE OFFLINE',
        },
        fields: {
          full_name: null,
          passport_number: null,
          nationality: null,
          date_of_birth: null,
          gender: null,
          date_of_issue: null,
          date_of_expiry: null,
        },
        field_confidence: {},
        mrz: {
          detected: false,
          line1: null,
          line2: null,
          checksum_valid: null,
        },
        consistency: {
          name_match: null,
          passport_number_match: null,
          dob_match: null,
          expiry_match: null,
        },
        metadata: {
          processing_time_ms: 0,
          fields_extracted: 0,
        },
      };

      navigation.navigate('VerificationResults', {
        document,
        screeningResponse: preliminaryResponse,
        isOfflineMode: true,
        localCaseId: offlineCase.local_case_id,
      });
    } catch (err: any) {
      setErrorDetails({
        title: 'Storage Error',
        description: err.message || 'Unable to save case locally. Please check device storage.',
      });
      setHasError(true);
    }
  };

  const runRealPassportAnalysis = async () => {
    setHasError(false);
    setIsFinished(false);
    setProgress(0);
    setSteps(INITIAL_STEPS);

    const startTime = Date.now();

    // 1. Animate progress steps smoothly while API request is processing
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Cap simulated progress at 90% until backend returns
      const currentPercent = Math.min(90, (elapsed / 6000) * 90);
      setProgress(currentPercent);

      setSteps((prevSteps) =>
        prevSteps.map((step, idx) => {
          const nextStep = prevSteps[idx + 1];
          const isCurrentStepTime = elapsed >= step.startTimeMs;
          const isNextStepTime = nextStep ? elapsed >= nextStep.startTimeMs : false;

          if (isNextStepTime) {
            return { ...step, status: 'completed' };
          } else if (isCurrentStepTime) {
            return { ...step, status: 'active' };
          } else {
            return { ...step, status: 'pending' };
          }
        })
      );
    }, 100);

    try {
      // 2. Perform Real FastAPI Upload Request
      const response: PassportScreeningResponse = await ScreeningService.processPassport(document.uri);

      if (isCancelledRef.current) return;

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      // 3. Mark all steps completed and show success
      setSteps((prev) => prev.map((s) => ({ ...s, status: 'completed' })));
      setProgress(100);
      setIsFinished(true);

      timerRef.current = setTimeout(() => {
        if (!isCancelledRef.current) {
          navigation.navigate('VerificationResults', {
            document,
            screeningResponse: response,
          });
        }
      }, 600);
    } catch (err: any) {
      if (isCancelledRef.current) return;

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

      // Check if network is down or server unreachable
      const isNetworkIssue =
        err?.code === 'ERR_NETWORK' ||
        err?.message?.includes('Network Error') ||
        err?.message?.includes('ECONNREFUSED') ||
        err?.message?.includes('timeout');

      if (isNetworkIssue) {
        setIsOfflineModalVisible(true);
      } else {
        const description = err?.response?.data?.error?.message || err?.message || 'Please try again.';
        setErrorDetails({ title: 'Unable to process passport', description });
        setHasError(true);
      }
    }
  };

  const handleCancelConfirm = () => {
    isCancelledRef.current = true;
    setShowCancelModal(false);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    navigation.navigate('OfficerMainTabs', { screen: 'Home' });
  };

  const handleRetakeFromError = () => {
    setHasError(false);
    navigation.navigate('PassportUpload');
  };

  const handleRetryFromError = () => {
    runRealPassportAnalysis();
  };

  if (hasError) {
    return (
      <ScreenContainer style={styles.screenBg} contentContainerStyle={styles.container}>
        <AnalysisErrorCard
          title={errorDetails.title}
          description={errorDetails.description}
          onRetake={handleRetakeFromError}
          onRetry={handleRetryFromError}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Background Ambient Glow Shapes */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerCategory}>DOCUMENT INTAKE</Text>
          <TouchableOpacity
            onPress={() => setShowCancelModal(true)}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel screening process"
          >
            <X size={18} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>

        <Text style={styles.titleText}>Analyzing Passport</Text>
        <Text style={styles.subtitleText}>
          Extracting document information securely
        </Text>
      </View>

      {/* Central Animated Scanning Frame */}
      <SlideUpView delay={50}>
        <AnalysisScanningFrame imageUri={document.uri} />
      </SlideUpView>

      {/* Sequential Progress Checklist */}
      <SlideUpView delay={100}>
        <AnalysisProgressChecklist steps={steps} progressPercent={progress} />
      </SlideUpView>

      {/* Success Transition Indicator */}
      {isFinished ? (
        <FadeInView duration={200} style={styles.finishedTransitionCard}>
          <CheckCircle2 size={20} color={colors.success} />
          <Text style={styles.finishedText}>Document Processed</Text>
        </FadeInView>
      ) : (
        /* Status Information Card */
        <SlideUpView delay={150} style={styles.statusCard}>
          <View style={styles.statusIconCircle}>
            <Lock size={16} color={colors.primaryNavy} />
          </View>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusTitle}>Secure Document Processing</Text>
            <Text style={styles.statusSubtitle}>
              Connecting to PEHCHAAN FastAPI server for OCR and MRZ extraction.
            </Text>
          </View>
        </SlideUpView>
      )}

      {/* Cancel Action Button */}
      <View style={styles.cancelActionWrapper}>
        <TouchableOpacity
          onPress={() => setShowCancelModal(true)}
          style={styles.cancelTextBtn}
          accessibilityRole="button"
          accessibilityLabel="Cancel screening"
        >
          <Text style={styles.cancelTextBtnLabel}>Cancel Screening</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Confirmation Bottom Sheet */}
      <CancelAnalysisModal
        visible={showCancelModal}
        onContinueScreening={() => setShowCancelModal(false)}
        onConfirmCancel={handleCancelConfirm}
      />

      {/* Limited Connectivity Fallback Modal */}
      <Modal
        visible={isOfflineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOfflineModalVisible(false)}
      >
        <View style={styles.offlineModalOverlay}>
          <View style={styles.offlineModalCard}>
            <View style={styles.offlineModalIconCircle}>
              <WifiOff size={28} color="#D97706" />
            </View>

            <Text style={styles.offlineModalTitle}>LIMITED CONNECTIVITY</Text>
            <Text style={styles.offlineModalSubtitle}>
              The PEHCHAAN server is currently unavailable.
            </Text>
            <Text style={styles.offlineModalBody}>
              You can continue with available offline verification features. Your case will be securely synchronized when connectivity returns.
            </Text>

            <TouchableOpacity
              style={styles.continueOfflineBtn}
              onPress={handleContinueOffline}
              activeOpacity={0.85}
            >
              <Layers size={16} color="#FFFFFF" />
              <Text style={styles.continueOfflineBtnText}>Continue Offline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryConnBtn}
              onPress={() => {
                setIsOfflineModalVisible(false);
                runRealPassportAnalysis();
              }}
              activeOpacity={0.7}
            >
              <RefreshCw size={15} color={colors.primaryNavy} />
              <Text style={styles.retryConnBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(234, 242, 248, 0.7)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 248, 252, 0.8)',
  },
  headerContainer: {
    marginBottom: spacing.xs,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerCategory: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondaryNavy,
    letterSpacing: 0.8,
  },
  cancelBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
  },
  finishedTransitionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softMint,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 91, 0.2)',
    marginBottom: spacing.lg,
  },
  finishedText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  cancelActionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  cancelTextBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTextBtnLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondaryText,
  },

  /* Offline Modal Styles */
  offlineModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  offlineModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 24,
    alignItems: 'center',
    ...shadows.soft,
  },
  offlineModalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  offlineModalTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryNavy,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  offlineModalSubtitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
    textAlign: 'center',
    marginBottom: 10,
  },
  offlineModalBody: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  continueOfflineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  continueOfflineBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  retryConnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
  },
  retryConnBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
});

export default DocumentAnalysisScreen;
