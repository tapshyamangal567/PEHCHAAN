import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ScalePressable } from '../../utils/animations';
import { colors, typography, radius, spacing } from '../../theme';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
  accessibilityLabel,
}) => {
  const isInteractable = !loading && !disabled;

  return (
    <ScalePressable
      onPress={isInteractable ? onPress : undefined}
      activeScale={isInteractable ? 0.98 : 1}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !isInteractable, busy: loading }}
      style={[
        styles.button,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primaryText} />
      ) : (
        <>
          {icon}
          <Text style={[typography.bodyMedium, styles.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
    opacity: 0.6,
  },
  text: {
    color: colors.primaryText,
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 15,
    fontWeight: '500',
  },
});

export default SecondaryButton;
