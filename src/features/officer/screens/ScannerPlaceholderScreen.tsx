import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { colors, typography, spacing } from '../../../theme';
import { ScanLine } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const ScannerPlaceholderScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Passport Scanner"
        subtitle="Live OCR & document verification mode"
      />

      <View style={styles.centerContainer}>
        <EmptyState
          title="Passport Scanner"
          description="Coming in the next screening module. Live MRZ reading, document verification, and forgery detection will be enabled."
          icon={<ScanLine size={36} color={colors.primaryRose} />}
          actionTitle="Back to Dashboard"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: spacing.xxxl,
  },
});

export default ScannerPlaceholderScreen;
