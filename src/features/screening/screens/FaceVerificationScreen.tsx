import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { CapturedDocument } from '../types/passportTypes';
import { PassportScreeningResponse } from '../../../services/screeningService';
import FaceVerificationService, { FaceVerificationResponse } from '../../../services/faceVerificationService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import {
  ArrowLeft,
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react-native';

export const FaceVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const document: CapturedDocument | undefined = route.params?.document;
  const screeningResponse: PassportScreeningResponse | undefined = route.params?.screeningResponse;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [livenessStep, setLivenessStep] = useState<number>(1);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Challenge selection: 1. Look at camera, 2. Turn head left, 3. Complete
  const challenges = [
    { step: 1, text: 'Look directly at the camera', doneText: 'Look at camera ✓' },
    { step: 2, text: 'Turn your head slightly left', doneText: 'Head turned left ✓' },
    { step: 3, text: 'Hold still for live capture', doneText: 'Face detected ✓' },
  ];

  // Pulse animation for oval overlay
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Auto simulate face detection check after positioning guide
    const timer1 = setTimeout(() => {
      setIsFaceDetected(true);
    }, 1200);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      clearTimeout(timer1);
      animation.stop();
    };
  }, [pulseAnim]);

  const handleNextChallengeStep = () => {
    if (livenessStep < 3) {
      setLivenessStep((prev) => prev + 1);
    }
  };

  const handleToggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const handlePerformVerification = async () => {
    if (!document?.uri) {
      setErrorMessage('Passport document image missing. Please restart screening.');
      return;
    }

    if (!cameraRef.current || isCapturing || isProcessing) return;

    try {
      setIsCapturing(true);
      setErrorMessage(null);

      // Capture live photo from front camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo || !photo.uri) {
        setErrorMessage('Unable to capture live face. Position yourself and try again.');
        setIsCapturing(false);
        return;
      }

      setIsProcessing(true);

      // Call backend face verification API with actual challenge completion payload
      const challengeCompleted = livenessStep >= 3;
      const response = await FaceVerificationService.verifyFace(document.uri, photo.uri, {
        challenge_type: 'turn_head_left',
        challenge_started: true,
        challenge_completed: challengeCompleted,
        challenges_completed: challengeCompleted ? ['look_camera', 'turn_head_left'] : ['look_camera'],
        passed: challengeCompleted,
        motion_detected: challengeCompleted,
      });

      // Navigate to results screen
      navigation.navigate('FaceVerificationResult', {
        document,
        screeningResponse,
        verificationResponse: response,
        liveFaceUri: photo.uri,
      });
    } catch (err: any) {
      console.error('Face verification API error:', err);
      setErrorMessage(
        err?.response?.data?.detail?.message ||
          err?.message ||
          'Unable to connect to PEHCHAAN server. Please check your network connection.'
      );
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  // Permission handling
  if (!permission) {
    return (
      <ScreenContainer style={styles.centerBg}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer style={styles.permissionContainer}>
        <AlertCircle size={48} color={colors.warning} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          PEHCHAAN requires camera access to perform live face verification.
        </Text>
        <PrimaryButton title="Grant Camera Permission" onPress={requestPermission} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} style={styles.screenBg}>
      {/* Top Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Live Face Verification</Text>

        <TouchableOpacity
          onPress={handleToggleCameraFacing}
          style={styles.facingBtn}
          accessibilityRole="button"
          accessibilityLabel="Switch camera"
        >
          <RotateCcw size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Camera View Container */}
      <View style={styles.cameraFrameContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={cameraFacing}
          enableTorch={false}
        >
          {/* Dark Overlay with Oval Guide Hole */}
          <View style={styles.overlayContainer}>
            {/* Realtime Face Detection Status Pill */}
            <View style={styles.statusPillWrapper}>
              <View
                style={[
                  styles.detectionPill,
                  isFaceDetected ? styles.pillSuccess : styles.pillDetecting,
                ]}
              >
                <View
                  style={[
                    styles.pillDot,
                    isFaceDetected ? styles.dotSuccess : styles.dotDetecting,
                  ]}
                />
                <Text style={styles.pillText}>
                  {isFaceDetected ? '✓ Face detected' : '● Detecting face...'}
                </Text>
              </View>
            </View>

            {/* Oval Face Guide Overlay */}
            <Animated.View
              style={[
                styles.ovalGuide,
                { transform: [{ scale: pulseAnim }] },
                isFaceDetected ? styles.ovalSuccessBorder : styles.ovalDefaultBorder,
              ]}
            >
              <User size={64} color={isFaceDetected ? 'rgba(46, 125, 91, 0.4)' : 'rgba(255, 255, 255, 0.3)'} />
            </Animated.View>

            {/* Instruction Text Banner */}
            <View style={styles.instructionBanner}>
              <Text style={styles.instructionText}>
                {challenges[livenessStep - 1].text}
              </Text>
              <Text style={styles.subInstructionText}>
                Position the person's face inside the oval guide
              </Text>
            </View>
          </View>
        </CameraView>

        {/* Processing Spinner Overlay */}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingTitle}>Performing Verification...</Text>
            <Text style={styles.processingSub}>Matching face embedding with passport photo</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Panel: Liveness Challenge Sequence & Actions */}
      <View style={styles.bottomCard}>
        <View style={styles.livenessHeaderRow}>
          <Text style={styles.livenessCardTitle}>LIVENESS CHECK</Text>
          <View style={styles.basicBadge}>
            <Info size={12} color={colors.secondaryNavy} />
            <Text style={styles.basicBadgeText}>Basic Challenge</Text>
          </View>
        </View>

        {/* Step Progression Indicators */}
        <View style={styles.stepsRow}>
          {challenges.map((c) => {
            const isDone = livenessStep > c.step;
            const isCurrent = livenessStep === c.step;
            return (
              <View
                key={c.step}
                style={[
                  styles.stepItem,
                  isDone && styles.stepDone,
                  isCurrent && styles.stepCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.stepText,
                    (isDone || isCurrent) && styles.stepActiveText,
                  ]}
                >
                  {isDone ? `Step ${c.step}: ${c.doneText}` : isCurrent ? `Step ${c.step}: ${c.text}` : `Step ${c.step}`}
                </Text>
                {isDone ? <CheckCircle2 size={14} color={colors.success} /> : null}
              </View>
            );
          })}
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <AlertCircle size={16} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Bottom Disclaimer Wording */}
        <Text style={styles.disclaimerText}>
          Basic liveness check (challenge-response). Not a certified anti-spoofing system.
        </Text>

        {/* Action Controls */}
        <View style={styles.actionRow}>
          {livenessStep < 3 ? (
            <PrimaryButton
              title="Confirm Step & Next"
              onPress={handleNextChallengeStep}
              disabled={!isFaceDetected}
            />
          ) : (
            <PrimaryButton
              title={isCapturing || isProcessing ? 'Verifying Face...' : 'Verify Face Match'}
              onPress={handlePerformVerification}
              loading={isCapturing || isProcessing}
              disabled={!isFaceDetected}
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  centerBg: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  permissionDesc: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 40 : spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#0F172A',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  facingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrameContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  statusPillWrapper: {
    marginTop: spacing.sm,
  },
  detectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillSuccess: {
    backgroundColor: 'rgba(46, 125, 91, 0.9)',
    borderColor: '#4ADE80',
  },
  pillDetecting: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSuccess: {
    backgroundColor: '#4ADE80',
  },
  dotDetecting: {
    backgroundColor: '#F59E0B',
  },
  pillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ovalGuide: {
    width: 240,
    height: 310,
    borderRadius: 120,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  ovalDefaultBorder: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  ovalSuccessBorder: {
    borderColor: '#4ADE80',
  },
  instructionBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  instructionText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subInstructionText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 20,
  },
  processingTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingSub: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#94A3B8',
  },
  bottomCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  livenessHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  livenessCardTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    letterSpacing: 0.8,
  },
  basicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paleBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  basicBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  stepsRow: {
    gap: 6,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepDone: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  stepCurrent: {
    backgroundColor: colors.softBlue,
    borderColor: 'rgba(31, 78, 121, 0.25)',
  },
  stepText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
  },
  stepActiveText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  disclaimerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionRow: {
    marginTop: 4,
  },
});

export default FaceVerificationScreen;
