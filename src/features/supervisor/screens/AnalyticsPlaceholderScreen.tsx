import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { colors, spacing } from '../../../theme';
import { BarChart3 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export const AnalyticsPlaceholderScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Checkpoint Analytics"
        subtitle="Aggregated risk trends & operational throughput"
      />

      <View style={styles.centerContainer}>
        <EmptyState
          title="Security Analytics"
          description="Detailed checkpoint throughput metrics, officer activity reports, and historical risk trends will be active in the next module."
          icon={<BarChart3 size={36} color={colors.primaryRose} />}
          actionTitle="Back to Overview"
          onAction={() => navigation.navigate('Overview')}
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

export default AnalyticsPlaceholderScreen;
