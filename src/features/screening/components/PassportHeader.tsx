import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { AppLogo } from '../../../components/ui/AppLogo';
import { colors, typography, spacing, radius } from '../../../theme';

interface PassportHeaderProps {
  onBack: () => void;
}

export const PassportHeader: React.FC<PassportHeaderProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back to Officer Dashboard"
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.primaryNavy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Small PEHCHAAN Identity Mark on right */}
        <View style={styles.identityMarkWrapper}>
          <AppLogo size="sm" showTagline={false} align="flex-start" />
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={[typography.h2, styles.titleText]}>New Screening</Text>
        <Text style={[typography.caption, styles.subtitleText]}>
          Passport Verification
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
    minHeight: 44,
  },
  backText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  identityMarkWrapper: {
    minHeight: 44,
    justifyContent: 'center',
  },
  titleContainer: {
    marginTop: spacing.xs,
  },
  titleText: {
    color: colors.primaryNavy,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: colors.secondaryText,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default PassportHeader;
