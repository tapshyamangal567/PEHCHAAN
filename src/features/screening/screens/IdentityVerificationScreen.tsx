import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FaceVerificationService, FaceMatchResult } from '../../../services/faceVerificationService';

export const IdentityVerificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const passportUri: string | undefined = route.params?.passportUri;
  const verificationId: string | undefined = route.params?.verificationId;
  const currentScreeningResponse: any = route.params?.currentScreeningResponse;
  const document: any = route.params?.document;

  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const cameraRef = useRef<any>(null);

  // Fallback photo capture for web / emulator or gallery upload
  const handleFallbackImagePicker = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processLiveFace(result.assets[0].uri);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to open camera.');
    }
  };

  const handleCapture = async () => {
    if (loading) return;
    setErrorMessage('');

    if (Platform.OS === 'web' || !cameraRef.current) {
      await handleFallbackImagePicker();
      return;
    }

    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        await processLiveFace(photo.uri);
      } else {
        setErrorMessage('Failed to capture photo. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Camera capture error.');
      setLoading(false);
    }
  };

  const processLiveFace = async (liveUri: string) => {
    try {
      setLoading(true);
      setErrorMessage('');

      const result: FaceMatchResult = await FaceVerificationService.verifyFace({
        liveFaceUri: liveUri,
        passportUri: passportUri || document?.uri,
        verificationId: verificationId || currentScreeningResponse?.verification_id,
      });

      // Navigate back to VerificationResults with the face result
      navigation.navigate('VerificationResults', {
        document,
        screeningResponse: {
          ...currentScreeningResponse,
          face_verification_result: result,
          updated_risk_score: result.updated_risk_score,
          updated_risk_level: result.updated_risk_level,
        },
        faceMatchResult: result,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Face verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Permission Loading State
  if (!permission) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </SafeAreaView>
    );
  }

  // 2. Permission Denied State
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.primaryNavy} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Identity Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.permissionIconCircle}>
            <Camera size={36} color={colors.primaryNavy} />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionBody}>
            PEHCHAAN needs camera access to perform live identity verification.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleFallbackImagePicker}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Select from Photos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Live Front Camera View
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Top Navigation Bar */}
      <View style={styles.overlayHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.overlayBackBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.overlayTitle}>Identity Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Camera Live View */}
      <View style={styles.cameraContainer}>
        {Platform.OS !== 'web' ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          />
        ) : (
          <View style={[styles.camera, styles.webCameraPlaceholder]}>
            <Text style={{ color: '#FFFFFF' }}>Web Camera Preview</Text>
          </View>
        )}

        {/* Face Oval Frame Guide */}
        <View style={styles.faceGuideOverlay} pointerEvents="none">
          <View style={styles.faceOvalFrame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.faceInstructionText}>
            Position your face inside the frame
          </Text>
          <Text style={styles.faceSubInstructionText}>
            Keep your face centered
          </Text>
        </View>
      </View>

      {/* Error Message Toast */}
      {!!errorMessage && (
        <View style={styles.errorToast}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorToastText}>{errorMessage}</Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Analyzing face...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Capture live face"
          >
            <View style={styles.captureButtonInner}>
              <ShieldCheck size={28} color={colors.primaryNavy} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Overlay Header */
  overlayHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  overlayBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Camera */
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  webCameraPlaceholder: {
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Face Oval Guide */
  faceGuideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOvalFrame: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 2.5,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    position: 'relative',
    marginBottom: 20,
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: 40,
    width: 30,
    height: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: 40,
    width: 30,
    height: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: 40,
    width: 30,
    height: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: 40,
    width: 30,
    height: 6,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  faceInstructionText: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  faceSubInstructionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* Error Toast */
  errorToast: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 12,
    zIndex: 20,
  },
  errorToastText: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },

  /* Bottom Controls */
  bottomControls: {
    height: 120,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.soft,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* Permission Denied UI */
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryNavy,
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionBody: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  permissionButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
});

export default IdentityVerificationScreen;
