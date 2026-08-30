import React, { ReactNode } from 'react';
import { StyleSheet, StyleProp, ViewStyle, View } from 'react-native';
import { ScalePressable } from '../../utils/animations';
import { colors, radius, spacing, shadows } from '../../theme';

interface PremiumCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  variant?: 'flat' | 'elevated' | 'highlighted';
  noPadding?: boolean;
  accessibilityLabel?: string;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  style,
  onPress,
  variant = 'elevated',
  noPadding = false,
  accessibilityLabel,
}) => {
  const cardStyle = [
    styles.card,
    variant === 'elevated' && shadows.card,
    variant === 'highlighted' && styles.highlighted,
    noPadding ? styles.noPadding : styles.padding,
    style,
  ];

  if (onPress) {
    return (
      <ScalePressable
        onPress={onPress}
        activeScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={cardStyle}
      >
        {children}
      </ScalePressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padding: {
    padding: spacing.xl,
  },
  noPadding: {
    padding: 0,
  },
  highlighted: {
    borderColor: colors.roseBorder,
    backgroundColor: colors.softRoseBg,
  },
});

export default PremiumCard;
