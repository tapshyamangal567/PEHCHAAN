import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { PrimaryButton } from './PrimaryButton';
import { ShieldAlert } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <ShieldAlert size={32} color={colors.primaryRose} />}
      </View>
      <Text style={[typography.h3, styles.title]}>{title}</Text>
      <Text style={[typography.body, styles.description]}>{description}</Text>
      {actionTitle && onAction && (
        <View style={styles.actionWrapper}>
          <PrimaryButton title={actionTitle} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    backgroundColor: colors.softRoseBg,
    borderWidth: 1,
    borderColor: colors.roseBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    textAlign: 'center',
    color: colors.secondaryText,
    marginBottom: spacing.xl,
  },
  actionWrapper: {
    marginTop: spacing.sm,
  },
});

export default EmptyState;
