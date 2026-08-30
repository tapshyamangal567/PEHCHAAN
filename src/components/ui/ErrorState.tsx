import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { SecondaryButton } from './SecondaryButton';
import { AlertCircle } from 'lucide-react-native';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryTitle?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'System Alert',
  message,
  onRetry,
  retryTitle = 'Try Again',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <AlertCircle size={28} color={colors.danger} />
      </View>
      <View style={styles.textColumn}>
        <Text style={[typography.bodyMedium, styles.titleText]}>{title}</Text>
        <Text style={[typography.caption, styles.messageText]}>{message}</Text>
      </View>
      {onRetry && (
        <View style={styles.buttonWrapper}>
          <SecondaryButton title={retryTitle} onPress={onRetry} fullWidth={false} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(217, 122, 108, 0.3)',
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    padding: spacing.xs,
  },
  textColumn: {
    flex: 1,
  },
  titleText: {
    color: colors.danger,
    fontWeight: '600',
  },
  messageText: {
    color: colors.secondaryText,
    marginTop: 2,
  },
  buttonWrapper: {
    marginLeft: spacing.xs,
  },
});

export default ErrorState;
