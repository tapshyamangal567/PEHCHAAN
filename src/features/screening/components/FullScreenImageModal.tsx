import React from 'react';
import { View, Image, Modal, TouchableOpacity, StyleSheet, Text, SafeAreaView } from 'react-native';
import { X, ZoomIn } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../../theme';

interface FullScreenImageModalProps {
  visible: boolean;
  imageUri: string;
  fileName?: string;
  onClose: () => void;
}

export const FullScreenImageModal: React.FC<FullScreenImageModalProps> = ({
  visible,
  imageUri,
  fileName,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.headerBar}>
          <View style={styles.titleWrapper}>
            <ZoomIn size={18} color={colors.white} />
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="middle">
              {fileName || 'Passport Fullscreen View'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close full screen view"
          >
            <X size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.fullImage}
              resizeMode="contain"
              accessibilityLabel="Full screen passport image"
            />
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 52, 91, 0.95)',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});

export default FullScreenImageModal;
