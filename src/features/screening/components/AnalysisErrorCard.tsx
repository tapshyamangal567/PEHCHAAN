import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw, Camera } from 'lucide-react-native';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { colors, typography, spacing, radius, shadows } from '../../../theme';

interface AnalysisErrorCardProps {
  onRetake: () => void;
  onRetry: () => void;
  title?: string;
  description?: string;
}

export const AnalysisErrorCard: React.FC<AnalysisErrorCardProps> = ({
  onRetake,
  onRetry,
  title = "Unable to process passport",
  description = "Please check your connection and try again."
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={32} color={colors.danger} />
      </View>

      <Text style={styles.titleText}>{title}</Text>
      <Text style={styles.descriptionText}>{description}</Text>

      <View style={styles.actionsContainer}>
        <PrimaryButton
          title="Try Again"
          onPress={onRetry}
          icon={<RefreshCw size={16} color={colors.white} />}
          accessibilityLabel="Try analysis again"
        />
        <SecondaryButton
          title="Retake Passport"
          onPress={onRetake}
          icon={<Camera size={18} color={colors.primaryNavy} />}
          accessibilityLabel="Retake passport photo"
          style={styles.retryBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.soft,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.15)',
  },
  titleText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryNavy,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  actionsContainer: {
    width: '100%',
    gap: spacing.md,
  },
  retryBtn: {
    marginTop: 0,
  },
});

export default AnalysisErrorCard;
