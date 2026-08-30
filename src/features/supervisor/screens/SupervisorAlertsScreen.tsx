import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { AlertItemCard } from '../../officer/components/AlertItemCard';
import { SupervisorReviewModal } from '../components/SupervisorReviewModal';
import { MOCK_ESCALATED_ALERTS, MOCK_REVIEW_QUEUE, SupervisorReviewCase } from '../data/mockSupervisorData';
import { spacing } from '../../../theme';

export const SupervisorAlertsScreen = () => {
  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Checkpoint Alerts"
        subtitle="Escalated notifications requiring supervisor intervention"
      />

      <View style={styles.listContainer}>
        {MOCK_ESCALATED_ALERTS.map((alert) => (
          <AlertItemCard
            key={alert.id}
            alert={{
              id: alert.id,
              caseId: alert.caseId,
              title: alert.title,
              description: 'Escalated to supervisor review queue.',
              riskLevel: alert.riskLevel,
              timestamp: alert.timestamp,
            }}
            onPress={() => {
              const matched = MOCK_REVIEW_QUEUE.find((c) => c.caseId === alert.caseId);
              if (matched) setSelectedCase(matched);
            }}
          />
        ))}
      </View>

      <SupervisorReviewModal
        caseData={selectedCase}
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        onDecision={() => {}}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: spacing.xxxl * 2,
  },
});

export default SupervisorAlertsScreen;
