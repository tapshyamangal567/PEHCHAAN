import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Lock } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../theme';

export const SecurityBadgeFooter: React.FC = () => {
  return (
    <View style={styles.container}>
      <Lock size={13} color={colors.secondaryNavy} />
      <Text style={styles.securityText}>Documents are processed securely.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.lg,
    paddingVertical: spacing.xs,
  },
  securityText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondaryText,
    letterSpacing: 0.2,
  },
});

export default SecurityBadgeFooter;
