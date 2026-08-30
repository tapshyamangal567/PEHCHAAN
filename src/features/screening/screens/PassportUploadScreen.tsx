import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { PassportHeader } from '../components/PassportHeader';
import { PassportUploadZone } from '../components/PassportUploadZone';
import { PassportPreviewCard } from '../components/PassportPreviewCard';
import { RemoveConfirmationModal } from '../components/RemoveConfirmationModal';
import { SecurityBadgeFooter } from '../components/SecurityBadgeFooter';
import { SelectedPassportDocument, CapturedDocument } from '../types/passportTypes';
import { validatePassportImage, formatFileSize } from '../utils/passportValidation';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { FadeInView, SlideUpView } from '../../../utils/animations';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react-native';

export const PassportUploadScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [selectedDoc, setSelectedDoc] = useState<SelectedPassportDocument | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  // Open Expo Image Picker
  const handlePickImage = async () => {
    try {
      setValidationError(null);
      setIsPicking(true);

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setValidationError('Permission to access media library was denied.');
        setIsPicking(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      setIsPicking(false);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileSize = asset.fileSize;

      // 1. Validate image format & size
      const validation = validatePassportImage(uri, mimeType, fileSize);
      if (!validation.valid && validation.errorMessage) {
        setValidationError(validation.errorMessage);
        return;
      }

      // 2. Derive file name
      const fileName =
        asset.fileName ||
        uri.split('/').pop() ||
        `passport_${Date.now()}.jpg`;

      const formattedDoc: SelectedPassportDocument = {
        uri,
        fileName,
        fileSize: fileSize || 0,
        fileSizeFormatted: formatFileSize(fileSize),
        mimeType,
        width: asset.width,
        height: asset.height,
        selectedAt: new Date().toISOString(),
      };

      setSelectedDoc(formattedDoc);
      setValidationError(null);
    } catch (err) {
      setIsPicking(false);
      setValidationError('An error occurred while selecting the image. Please try again.');
    }
  };

  const handleConfirmRemove = () => {
    setShowRemoveModal(false);
    setSelectedDoc(null);
    setValidationError(null);
  };

  const handleContinue = () => {
    if (!selectedDoc) {
      setValidationError('Please select a passport image to continue.');
      return;
    }

    const capturedDoc: CapturedDocument = {
      uri: selectedDoc.uri,
      source: 'gallery',
      fileName: selectedDoc.fileName,
      fileSize: selectedDoc.fileSize,
      fileSizeFormatted: selectedDoc.fileSizeFormatted,
      mimeType: selectedDoc.mimeType,
      width: selectedDoc.width,
      height: selectedDoc.height,
      capturedAt: selectedDoc.selectedAt,
    };

    setValidationError(null);
    navigation.navigate('PassportPreview', { document: capturedDoc, passportDoc: selectedDoc });
  };

  return (
    <ScreenContainer scrollable style={styles.screenBg} contentContainerStyle={styles.container}>
      {/* Soft Pale Blue Ambient Shapes */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      {/* Header */}
      <PassportHeader onBack={() => navigation.goBack()} />

      {/* Inline Validation Banner */}
      {validationError ? (
        <FadeInView duration={200} style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorBannerText}>{validationError}</Text>
        </FadeInView>
      ) : null}

      {/* Main Upload Area / Preview Card */}
      <SlideUpView delay={100} style={styles.mainContentArea}>
        {!selectedDoc ? (
          <PassportUploadZone
            onScanCamera={() => navigation.navigate('PassportCamera')}
            onPickImage={handlePickImage}
            isLoading={isPicking}
          />
        ) : (
          <PassportPreviewCard
            document={selectedDoc}
            onChangeImage={handlePickImage}
            onRemoveImage={() => setShowRemoveModal(true)}
          />
        )}
      </SlideUpView>

      {/* Security Message */}
      <SecurityBadgeFooter />

      {/* Sticky Bottom Action Area */}
      <View style={styles.bottomBarWrapper}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedDoc}
          icon={<ArrowRight size={18} color={colors.white} />}
          accessibilityLabel="Continue to passport preparation"
          style={styles.continueButton}
        />
      </View>

      {/* Remove Confirmation Sheet */}
      <RemoveConfirmationModal
        visible={showRemoveModal}
        onConfirm={handleConfirmRemove}
        onCancel={() => setShowRemoveModal(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.background, // #F5F7FA
  },
  container: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(234, 242, 248, 0.7)',
  },
  ambientGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(244, 248, 252, 0.8)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.2)',
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
    flex: 1,
  },
  mainContentArea: {
    marginBottom: spacing.md,
  },
  bottomBarWrapper: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  continueButton: {
    backgroundColor: colors.primaryNavy,
    height: 52,
  },
});

export default PassportUploadScreen;
