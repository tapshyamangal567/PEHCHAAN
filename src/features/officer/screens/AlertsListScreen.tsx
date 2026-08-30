import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { AlertItemCard } from '../components/AlertItemCard';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { MOCK_PENDING_ALERTS, MOCK_RECENT_CASES, OfficerCase } from '../data/mockOfficerData';
import { spacing } from '../../../theme';

export const AlertsListScreen = () => {
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Security Alerts"
        subtitle="Flagged document anomaly notifications"
      />

      <View style={styles.listContainer}>
        {MOCK_PENDING_ALERTS.map((alert) => (
          <AlertItemCard
            key={alert.id}
            alert={alert}
            onPress={() => {
              const matchedCase = MOCK_RECENT_CASES.find((c) => c.caseId === alert.caseId);
              if (matchedCase) setSelectedCase(matchedCase);
            }}
          />
        ))}
      </View>

      <CaseDetailModal
        caseData={selectedCase}
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: spacing.xxxl * 2,
  },
});

export default AlertsListScreen;
