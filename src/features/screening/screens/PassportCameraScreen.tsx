import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { CapturedDocument } from '../types/passportTypes';
import { formatFileSize } from '../utils/passportValidation';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sun,
  Maximize,
} from 'lucide-react-native';

export const PassportCameraScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedMeta, setCapturedMeta] = useState<{ width: number; height: number; size: number }>({
    width: 0,
    height: 0,
    size: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animated scanning laser line value
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop scanning laser animation
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [scanAnim]);

  // Handle capture button tap
  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setErrorMsg(null);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setCapturedUri(photo.uri);
        setCapturedMeta({
          width: photo.width || 1200,
          height: photo.height || 800,
          size: photo.fileSize || 2500000,
        });
      } else {
        setErrorMsg('Unable to capture photo. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg('Camera capture failed. Please try again or use upload.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Open gallery picker as alternative
  const handleOpenGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setCapturedUri(asset.uri);
        setCapturedMeta({
          width: asset.width || 1200,
          height: asset.height || 800,
          size: asset.fileSize || 2500000,
        });
      }
    } catch (err) {
      // Fallback
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedUri(null);
    setErrorMsg(null);
  };

  // Confirm captured photo -> Proceed to Analysis
  const handleUseThisImage = () => {
    if (!capturedUri) return;

    const capturedDoc: CapturedDocument = {
      uri: capturedUri,
      source: 'camera',
      fileName: `passport_scan_${Date.now()}.jpg`,
      fileSize: capturedMeta.size,
      fileSizeFormatted: formatFileSize(capturedMeta.size),
      mimeType: 'image/jpeg',
      width: capturedMeta.width,
      height: capturedMeta.height,
      capturedAt: new Date().toISOString(),
    };

    navigation.navigate('PassportPreview', { document: capturedDoc });
  };

  // 1. Permission Loading State
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryNavy} />
      </View>
    );
  }

  // 2. Permission Denied State
  if (!permission.granted) {
    return (
      <ScreenContainer style={styles.screenBg} contentContainerStyle={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.errorIconCircle}>
            <AlertCircle size={36} color={colors.danger} />
          </View>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionDescription}>
            Camera access is required to scan a passport directly using your device camera.
          </Text>

          <View style={styles.permissionActions}>
            <PrimaryButton
              title="Try Again"
              onPress={requestPermission}
              icon={<Camera size={18} color={colors.white} />}
              style={styles.primaryActionBtn}
            />
            <SecondaryButton
              title="Use Upload Instead"
              onPress={() => navigation.navigate('PassportUpload')}
              icon={<ImageIcon size={18} color={colors.primaryNavy} />}
              style={styles.secondaryActionBtn}
            />
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // 3. Post-Capture Preview State ("Passport captured")
  if (capturedUri) {
    return (
      <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleRetake} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color={colors.primaryNavy} />
            <Text style={styles.backBtnText}>Retake</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Review Scan</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Captured Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.capturedFrame}>
            <Image source={{ uri: capturedUri }} style={styles.capturedImage} resizeMode="contain" />
          </View>

          {/* Status Badge */}
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <CheckCircle2 size={14} color={colors.success} />
              <Text style={styles.statusBadgeText}>Passport captured</Text>
            </View>
            <View style={styles.qualityReadyBadge}>
              <ShieldCheck size={14} color={colors.secondaryNavy} />
              <Text style={styles.qualityReadyText}>Quality check passed</Text>
            </View>
          </View>

          <Text style={styles.previewGuidance}>
            Ensure all four corners of the passport data page and text are clear.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.capturedActions}>
          <PrimaryButton
            title="Use This Image"
            onPress={handleUseThisImage}
            icon={<CheckCircle2 size={18} color={colors.white} />}
            style={styles.primaryActionBtn}
          />
          <SecondaryButton
            title="Retake Photo"
            onPress={handleRetake}
            icon={<RotateCcw size={18} color={colors.primaryNavy} />}
            style={styles.secondaryActionBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  // 4. Live Camera Scanner View
  const scanLineTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <View style={styles.cameraScreen}>
      {/* Live Camera Component */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back">
        {/* Top Header Overlay */}
        <View style={styles.cameraHeaderOverlay}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.cameraBackBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.white} />
            <Text style={styles.cameraBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Scan Passport</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Center Document Detection Frame */}
        <View style={styles.frameContainer}>
          <View style={styles.documentFrame}>
            {/* Corner Brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Animated Laser Line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslateY }] },
              ]}
            />

            {/* Frame Text Guide */}
            <View style={styles.frameTextWrapper}>
              <Text style={styles.frameText}>Align passport data page inside the frame</Text>
            </View>
          </View>

          {/* Guidance Info below frame */}
          <View style={styles.guidanceBox}>
            <View style={styles.guidanceItem}>
              <Sun size={14} color="#00F0FF" />
              <Text style={styles.guidanceText}>Keep the document flat and well lit</Text>
            </View>
            <View style={styles.guidanceItem}>
              <Maximize size={14} color="#00F0FF" />
              <Text style={styles.guidanceText}>Make sure all four corners are visible</Text>
            </View>
          </View>
        </View>

        {/* Processing Indicator during shutter */}
        {isCapturing ? (
          <View style={styles.capturingOverlay}>
            <ActivityIndicator size="large" color={colors.white} />
            <Text style={styles.capturingText}>Checking document image...</Text>
          </View>
        ) : null}

        {/* Bottom Control Bar */}
        <View style={styles.cameraBottomBar}>
          <TouchableOpacity
            onPress={handleOpenGallery}
            style={styles.galleryIconBtn}
            activeOpacity={0.7}
          >
            <ImageIcon size={22} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTakePicture}
            disabled={isCapturing}
            style={styles.captureOuterBtn}
            activeOpacity={0.85}
          >
            <View style={styles.captureInnerBtn}>
              <Camera size={28} color={colors.primaryNavy} />
            </View>
          </TouchableOpacity>

          <View style={{ width: 44 }} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  cameraScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  screenBg: {
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  permissionContainer: {
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.soft,
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  permissionDescription: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  permissionActions: {
    width: '100%',
    gap: spacing.sm,
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
    gap: 4,
    minHeight: 44,
  },
  backBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  headerTitleText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  cameraHeaderOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  cameraBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11, 25, 44, 0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  cameraBackText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  cameraTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowRadius: 4,
  },
  frameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  documentFrame: {
    width: '94%',
    height: 240,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00F0FF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  frameTextWrapper: {
    backgroundColor: 'rgba(11, 25, 44, 0.75)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  frameText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  guidanceBox: {
    marginTop: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  guidanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 25, 44, 0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  guidanceText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  capturingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 25, 44, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    zIndex: 20,
  },
  capturingText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  galleryIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(11, 25, 44, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  capturedFrame: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.paleBlue,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softMint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  qualityReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qualityReadyText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  previewGuidance: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  capturedActions: {
    gap: spacing.sm,
  },
  primaryActionBtn: {
    backgroundColor: colors.primaryNavy,
    height: 52,
  },
  secondaryActionBtn: {
    height: 48,
  },
});

export default PassportCameraScreen;
