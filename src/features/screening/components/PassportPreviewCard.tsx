import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SelectedPassportDocument } from '../types/passportTypes';
import { CheckCircle2, RefreshCw, Trash2, ShieldCheck, FileText } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface PassportPreviewCardProps {
  document: SelectedPassportDocument;
  onChangeImage: () => void;
  onRemoveImage: () => void;
}

export const PassportPreviewCard: React.FC<PassportPreviewCardProps> = ({
  document,
  onChangeImage,
  onRemoveImage,
}) => {
  return (
    <View style={styles.cardContainer}>
      {/* 1. Header Status Bar */}
      <View style={styles.statusBarRow}>
        <View style={styles.statusBadge}>
          <CheckCircle2 size={14} color={colors.success} />
          <Text style={styles.statusBadgeText}>Image selected</Text>
        </View>

        <View style={styles.readyIndicator}>
          <ShieldCheck size={14} color={colors.secondaryNavy} />
          <Text style={styles.readyText}>Ready for verification</Text>
        </View>
      </View>

      {/* 2. Image Frame Container */}
      <View style={styles.imageFrame}>
        <Image
          source={{ uri: document.uri }}
          style={styles.previewImage}
          resizeMode="contain"
          accessibilityLabel="Selected passport preview image"
        />
      </View>

      {/* 3. Document Details Section */}
      <View style={styles.detailsContainer}>
        <View style={styles.fileTitleRow}>
          <FileText size={16} color={colors.primaryNavy} />
          <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
            {document.fileName}
          </Text>
        </View>

        <View style={styles.metadataRow}>
          <Text style={styles.metadataText}>Passport Image</Text>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.metadataText}>{document.fileSizeFormatted}</Text>
          {document.width && document.height ? (
            <>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.metadataText}>
                {document.width} × {document.height} px
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {/* 4. Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={onChangeImage}
          style={styles.changeButton}
          accessibilityRole="button"
          accessibilityLabel="Change selected passport image"
          activeOpacity={0.7}
        >
          <RefreshCw size={15} color={colors.primaryNavy} />
          <Text style={styles.changeButtonText}>Change Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRemoveImage}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel="Remove passport image"
          activeOpacity={0.7}
        >
          <Trash2 size={15} color={colors.danger} />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.soft,
  },
  statusBarRow: {
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
  readyText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryNavy,
  },
  imageFrame: {
    width: '100%',
    height: 220,
    backgroundColor: colors.paleBlue,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(18, 52, 91, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    backgroundColor: colors.paleBlue,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  fileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  fileNameText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    flex: 1,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metadataText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: colors.secondaryText,
  },
  bulletDot: {
    fontSize: 12,
    color: colors.mutedText,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  changeButton: {
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
  changeButtonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  removeButton: {
    height: 44,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.15)',
  },
  removeButtonText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
});

export default PassportPreviewCard;
