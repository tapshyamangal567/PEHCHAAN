import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface RemoveConfirmationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const RemoveConfirmationModal: React.FC<RemoveConfirmationModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={24} color={colors.danger} />
            </View>
            <Pressable
              onPress={onCancel}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close confirmation modal"
            >
              <X size={20} color={colors.secondaryText} />
            </Pressable>
          </View>

          <Text style={styles.titleText}>Remove Document?</Text>
          <Text style={styles.bodyText}>
            Are you sure you want to remove the selected passport image? You will need to select a document again to continue.
          </Text>

          <View style={styles.actionButtonsRow}>
            <View style={styles.buttonHalf}>
              <SecondaryButton
                title="Cancel"
                onPress={onCancel}
                accessibilityLabel="Cancel removing document"
              />
            </View>
            <View style={styles.buttonHalf}>
              <PrimaryButton
                title="Remove"
                onPress={onConfirm}
                icon={<Trash2 size={16} color={colors.white} />}
                style={styles.dangerConfirmButton}
                accessibilityLabel="Confirm removing document"
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    ...shadows.floating,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.15)',
  },
  closeButton: {
    padding: spacing.xs,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  buttonHalf: {
    flex: 1,
  },
  dangerConfirmButton: {
    backgroundColor: colors.danger,
  },
});

export default RemoveConfirmationModal;
