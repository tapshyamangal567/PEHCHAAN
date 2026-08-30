import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { DocumentQualityPreCheck } from '../components/DocumentQualityPreCheck';
import { FullScreenImageModal } from '../components/FullScreenImageModal';
import { SecurityBadgeFooter } from '../components/SecurityBadgeFooter';
import { CapturedDocument } from '../types/passportTypes';
import { formatFileSize, validatePassportImage } from '../utils/passportValidation';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import { AppLogo } from '../../../components/ui/AppLogo';
import {
  ArrowLeft,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  FileText,
} from 'lucide-react-native';

export const PassportPreviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Initial document passed via navigation params
  const initialDoc: CapturedDocument = route.params?.document || {
    uri: route.params?.passportDoc?.uri || '',
    source: 'gallery',
    fileName: route.params?.passportDoc?.fileName || 'passport_2026.jpg',
    fileSize: route.params?.passportDoc?.fileSize || 2516582,
    fileSizeFormatted: route.params?.passportDoc?.fileSizeFormatted || '2.4 MB',
    mimeType: 'image/jpeg',
    capturedAt: new Date().toISOString(),
  };

  const [document, setDocument] = useState<CapturedDocument>(initialDoc);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);

  const handleBackToScanner = () => {
    navigation.goBack();
  };

  const handleRetake = () => {
    // Return to Passport Upload / Scanner screen
    navigation.navigate('PassportUpload');
  };

  const handleChooseAnotherImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const validation = validatePassportImage(asset.uri, asset.mimeType, asset.fileSize);

        if (validation.valid) {
          const updatedDoc: CapturedDocument = {
            uri: asset.uri,
            source: 'gallery',
            fileName: asset.fileName || asset.uri.split('/').pop() || `passport_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 0,
            fileSizeFormatted: formatFileSize(asset.fileSize),
            mimeType: asset.mimeType || 'image/jpeg',
            width: asset.width,
            height: asset.height,
            capturedAt: new Date().toISOString(),
          };
          setDocument(updatedDoc);
        }
      }
    } catch (err) {
      // Handle error gracefully if any
    }
  };

  const handleContinueVerification = () => {
    navigation.navigate('DocumentAnalysis', { document });
  };

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Background Soft Blue Glow Effects */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      {/* Header Bar */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={handleBackToScanner}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back to scanner"
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color={colors.primaryNavy} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.logoWrapper}>
            <AppLogo size="sm" showTagline={false} align="flex-start" />
          </View>
        </View>

        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>Review Passport</Text>
          <Text style={styles.subtitleText}>
            Make sure the passport data page is clear and fully visible.
          </Text>
        </View>
      </View>

      {/* Main Passport Image Preview Surface */}
      <SlideUpView delay={100} style={styles.previewCard}>
        <View style={styles.imageFrame}>
          {document.uri ? (
            <Image
              source={{ uri: document.uri }}
              style={styles.passportImage}
              resizeMode="contain"
              accessibilityLabel="Passport captured image preview"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FileText size={48} color={colors.mutedText} />
              <Text style={styles.placeholderText}>Passport Image</Text>
            </View>
          )}

          {/* Fullscreen Overlay Button */}
          {document.uri ? (
            <TouchableOpacity
              onPress={() => setShowFullscreenModal(true)}
              style={styles.fullscreenBtn}
              accessibilityRole="button"
              accessibilityLabel="View passport image in full screen"
              activeOpacity={0.8}
            >
              <Maximize2 size={14} color={colors.white} />
              <Text style={styles.fullscreenBtnText}>View Fullscreen</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Document Status */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <CheckCircle2 size={14} color={colors.success} />
            <Text style={styles.statusBadgeText}>Passport image captured</Text>
          </View>

          <View style={styles.readyIndicator}>
            <ShieldCheck size={14} color={colors.secondaryNavy} />
            <Text style={styles.readyIndicatorText}>Ready for verification</Text>
          </View>
        </View>

        {/* Compact Image Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Source</Text>
            <View style={styles.infoValueRow}>
              {document.source === 'camera' ? (
                <Camera size={12} color={colors.primaryNavy} />
              ) : (
                <ImageIcon size={12} color={colors.primaryNavy} />
              )}
              <Text style={styles.infoValue}>
                {document.source === 'camera' ? 'Camera' : 'Gallery'}
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItemFlex}>
            <Text style={styles.infoLabel}>File</Text>
            <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
              {document.fileName}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Size</Text>
            <Text style={styles.infoValue}>{document.fileSizeFormatted}</Text>
          </View>
        </View>
      </SlideUpView>

      {/* Quality Pre-Check Component */}
      <SlideUpView delay={150}>
        <DocumentQualityPreCheck />
      </SlideUpView>

      {/* Action Buttons */}
      <SlideUpView delay={200} style={styles.actionsSection}>
        <PrimaryButton
          title="Continue Verification"
          onPress={handleContinueVerification}
          icon={<ArrowRight size={18} color={colors.white} />}
          accessibilityLabel="Continue to document analysis"
          style={styles.primaryActionBtn}
        />

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            onPress={handleRetake}
            style={styles.secondaryActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Retake passport photo"
            activeOpacity={0.7}
          >
            <Camera size={16} color={colors.primaryNavy} />
            <Text style={styles.secondaryActionText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChooseAnotherImage}
            style={styles.secondaryActionBtn}
            accessibilityRole="button"
            accessibilityLabel="Choose another image from gallery"
            activeOpacity={0.7}
          >
            <ImageIcon size={16} color={colors.primaryNavy} />
            <Text style={styles.secondaryActionText}>Choose Another</Text>
          </TouchableOpacity>
        </View>
      </SlideUpView>

      {/* Security Message */}
      <SecurityBadgeFooter />

      {/* Fullscreen Image View Modal */}
      <FullScreenImageModal
        visible={showFullscreenModal}
        imageUri={document.uri}
        fileName={document.fileName}
        onClose={() => setShowFullscreenModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.background, // #F5F7FA
  },
  container: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(234, 242, 248, 0.7)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(244, 248, 252, 0.8)',
  },
  headerContainer: {
    paddingBottom: spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    minHeight: 44,
  },
  backBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  logoWrapper: {
    minHeight: 44,
    justifyContent: 'center',
  },
  titleWrapper: {
    marginTop: 2,
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
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card, // 16px radius
    borderWidth: 1,
    borderColor: colors.border, // #D9E1EA
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  imageFrame: {
    width: '100%',
    height: 230,
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  passportImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.mutedText,
  },
  fullscreenBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 52, 91, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  fullscreenBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softMint,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  statusBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  readyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyIndicatorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  infoItem: {
    alignItems: 'flex-start',
  },
  infoItemFlex: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  infoLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  infoDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  actionsSection: {
    gap: spacing.md,
  },
  primaryActionBtn: {
    backgroundColor: colors.primaryNavy,
    height: 52,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.softBlue,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.12)',
  },
  secondaryActionText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
});

export default PassportPreviewScreen;
