import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, FileUp, Sparkles, CheckCircle2, FileText } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ScalePressable } from '../../../utils/animations';

interface PassportUploadZoneProps {
  onScanCamera: () => void;
  onPickImage: () => void;
  isLoading?: boolean;
}

export const PassportUploadZone: React.FC<PassportUploadZoneProps> = ({
  onScanCamera,
  onPickImage,
  isLoading = false,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Background Soft Security Decor Elements */}
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <FileText size={22} color={colors.primaryNavy} />
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.titleText}>Passport Intake</Text>
          <Text style={styles.descriptionText}>
            Select your preferred method to verify the passport data page.
          </Text>
        </View>
      </View>

      {/* PRIMARY OPTION: CAMERA SCANNING (RECOMMENDED) */}
      <ScalePressable onPress={onScanCamera} style={styles.primaryCameraCard}>
        {/* Recommended Badge */}
        <View style={styles.recommendedBadge}>
          <Sparkles size={10} color={colors.saffron} />
          <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
        </View>

        <View style={styles.primaryCardContent}>
          <View style={styles.cameraIconCircle}>
            <Camera size={26} color={colors.white} />
          </View>

          <View style={styles.primaryTextCol}>
            <Text style={styles.primaryTitle}>Scan Passport with Camera</Text>
            <Text style={styles.primarySubtitle}>Capture passport data page in real time</Text>
          </View>
        </View>
      </ScalePressable>

      {/* OR DIVIDER */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <View style={styles.orBadge}>
          <Text style={styles.orBadgeText}>OR</Text>
        </View>
        <View style={styles.dividerLine} />
      </View>

      {/* SECONDARY OPTION: UPLOAD FROM DEVICE */}
      <TouchableOpacity
        onPress={onPickImage}
        disabled={isLoading}
        style={styles.secondaryUploadCard}
        activeOpacity={0.75}
      >
        <View style={styles.uploadIconCircle}>
          <FileUp size={20} color={colors.primaryNavy} />
        </View>

        <View style={styles.secondaryTextCol}>
          <Text style={styles.secondaryTitle}>Upload Passport Image</Text>
          <Text style={styles.secondarySubtitle}>Choose from device gallery</Text>
        </View>
      </TouchableOpacity>

      {/* File Support & Size Guidelines */}
      <View style={styles.requirementsContainer}>
        <View style={styles.reqPill}>
          <CheckCircle2 size={12} color={colors.primaryNavy} />
          <Text style={styles.reqPillText}>Supported: JPG, JPEG, PNG</Text>
        </View>
        <View style={styles.reqPill}>
          <CheckCircle2 size={12} color={colors.primaryNavy} />
          <Text style={styles.reqPillText}>Maximum size: 10 MB</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card, // 16px radius
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.soft,
  },
  decorCircleLarge: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(234, 242, 248, 0.4)',
  },
  decorCircleSmall: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(244, 248, 252, 0.6)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
  },
  headerTextWrapper: {
    flex: 1,
  },
  titleText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  descriptionText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16,
  },
  // PRIMARY CAMERA CARD (RECOMMENDED)
  primaryCameraCard: {
    backgroundColor: colors.primaryNavy, // #0B192C
    borderRadius: radius.card,
    padding: spacing.md,
    paddingVertical: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.card,
  },
  recommendedBadge: {
    position: 'absolute',
    top: spacing.xs + 2,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderWidth: 1,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  recommendedBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '800',
    color: '#FF9F43',
    letterSpacing: 0.8,
  },
  primaryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cameraIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  primaryTextCol: {
    flex: 1,
  },
  primaryTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  primarySubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  // OR DIVIDER
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  orBadge: {
    backgroundColor: colors.paleBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  orBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondaryNavy,
    letterSpacing: 0.5,
  },
  // SECONDARY UPLOAD CARD
  secondaryUploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.primaryNavy,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTextCol: {
    flex: 1,
  },
  secondaryTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: 2,
  },
  secondarySubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
  },
  // REQUIREMENTS
  requirementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paleBlue,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 225, 234, 0.6)',
  },
  reqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reqPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.primaryText,
    fontWeight: '500',
  },
});

export default PassportUploadZone;
