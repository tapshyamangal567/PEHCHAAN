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
import { colors, typography, radius, spacing, shadows } from '../../theme';

interface PrimaryButtonProps {
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

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        shadows.soft,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <>
          {icon}
          <Text style={[typography.button, styles.text, textStyle]}>
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
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.button,
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
    backgroundColor: colors.navyBorder,
    opacity: 0.6,
  },
  text: {
    color: colors.white,
    fontFamily: typography.button.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default PrimaryButton;
