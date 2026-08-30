import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

interface DividerProps {
  style?: ViewStyle;
  marginVertical?: number;
}

export const Divider: React.FC<DividerProps> = ({
  style,
  marginVertical = spacing.lg,
}) => {
  return <View style={[styles.divider, { marginVertical }, style]} />;
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
});

export default Divider;
