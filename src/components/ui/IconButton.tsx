import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from '../../utils/animations';
import { colors, radius } from '../../theme';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'ghost' | 'surface' | 'rose';
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 44,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  return (
    <ScalePressable
      onPress={disabled ? undefined : onPress}
      activeScale={disabled ? 1 : 0.94}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        { width: Math.max(size, 44), height: Math.max(size, 44) },
        variant === 'surface' && styles.surface,
        variant === 'rose' && styles.rose,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: 'transparent',
  },
  surface: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rose: {
    backgroundColor: colors.softRoseBg,
    borderWidth: 1,
    borderColor: colors.roseBorder,
  },
  disabled: {
    opacity: 0.4,
  },
});

export default IconButton;
