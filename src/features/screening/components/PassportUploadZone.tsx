import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileUp, FileText, CheckCircle2 } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ScalePressable } from '../../../utils/animations';

interface PassportUploadZoneProps {
  onPickImage: () => void;
  isLoading?: boolean;
}

export const PassportUploadZone: React.FC<PassportUploadZoneProps> = ({
  onPickImage,
  isLoading = false,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* Background soft decorative security elements */}
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />

      {/* Sophisticated Document Verification Drop Zone Surface */}
      <View style={styles.iconOuterRing}>
        <View style={styles.iconInnerRing}>
          <FileText size={32} color={colors.primaryNavy} />
        </View>
        <View style={styles.scanLineBadge}>
          <FileUp size={14} color={colors.white} />
        </View>
      </View>

      <Text style={styles.titleText}>Upload Passport</Text>
      <Text style={styles.descriptionText}>
        Select a clear image of the passport data page.
      </Text>

      {/* Requirements Pills */}
      <View style={styles.requirementsContainer}>
        <View style={styles.reqPill}>
          <CheckCircle2 size={12} color={colors.primaryNavy} />
          <Text style={styles.reqPillText}>Supported format: JPG, JPEG, PNG</Text>
        </View>
        <View style={styles.reqPill}>
          <CheckCircle2 size={12} color={colors.primaryNavy} />
          <Text style={styles.reqPillText}>Maximum size: 10 MB</Text>
        </View>
      </View>

      {/* Prominent Upload Button */}
      <View style={styles.buttonWrapper}>
        <PrimaryButton
          title="Choose Passport Image"
          onPress={onPickImage}
          loading={isLoading}
          icon={<FileUp size={18} color={colors.white} />}
          style={styles.uploadButton}
          accessibilityLabel="Choose Passport Image from device library"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card, // 16px radius
    borderWidth: 1,
    borderColor: colors.border, // #D9E1EA
    padding: spacing.xxl,
    alignItems: 'center',
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
  iconOuterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },
  iconInnerRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
  },
  scanLineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  titleText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  requirementsContainer: {
    width: '100%',
    gap: spacing.xs,
    marginBottom: spacing.xl,
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 225, 234, 0.6)',
  },
  reqPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  reqPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '500',
  },
  buttonWrapper: {
    width: '100%',
  },
  uploadButton: {
    backgroundColor: colors.primaryNavy,
    height: 48,
  },
});

export default PassportUploadZone;
