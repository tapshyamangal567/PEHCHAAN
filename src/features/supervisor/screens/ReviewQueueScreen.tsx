import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { ReviewCaseCard } from '../components/ReviewCaseCard';
import { SupervisorReviewModal } from '../components/SupervisorReviewModal';
import { MOCK_REVIEW_QUEUE, SupervisorReviewCase } from '../data/mockSupervisorData';
import { spacing } from '../../../theme';

export const ReviewQueueScreen = () => {
  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  const handleDecision = (decision: string, caseId: string) => {
    // Decision handled in mock state
  };

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Review Queue"
        subtitle="Priority cases requiring supervisor decision"
      />

      <View style={styles.listContainer}>
        {MOCK_REVIEW_QUEUE.map((caseData) => (
          <ReviewCaseCard
            key={caseData.id}
            caseData={caseData}
            onPress={() => setSelectedCase(caseData)}
          />
        ))}
      </View>

      <SupervisorReviewModal
        caseData={selectedCase}
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        onDecision={handleDecision}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: spacing.xxxl * 2,
  },
});

export default ReviewQueueScreen;
