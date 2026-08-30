import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Verifying security parameters...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primaryRose} />
      <Text style={[typography.caption, styles.messageText]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    marginTop: spacing.md,
    color: colors.mutedText,
    textAlign: 'center',
  },
});

export default LoadingState;
