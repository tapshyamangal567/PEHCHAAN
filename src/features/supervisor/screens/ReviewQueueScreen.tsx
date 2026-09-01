import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { ReviewCaseCard } from '../components/ReviewCaseCard';
import { SupervisorReviewModal } from '../components/SupervisorReviewModal';
import { SupervisorReviewCase } from '../data/mockSupervisorData';
import { DashboardService } from '../../../services/dashboardService';
import { spacing, colors, radius, typography } from '../../../theme';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react-native';

export const ReviewQueueScreen = () => {
  const [cases, setCases] = useState<SupervisorReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await DashboardService.getReviewQueue(50);
      setCases(data);
    } catch (err: any) {
      console.warn('[ReviewQueue] Error loading review queue:', err?.message || err);
      setError('Unable to load review queue. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
    }, [loadQueue])
  );

  const handleDecision = (decision: string, caseId: string) => {
    loadQueue(true);
  };

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadQueue(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      <SectionHeader
        title="Review Queue"
        subtitle="Priority cases requiring supervisor decision from PostgreSQL"
      />

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadQueue(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && cases.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryNavy} />
          <Text style={styles.loadingText}>Loading review queue...</Text>
        </View>
      ) : cases.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No cases requiring approval.</Text>
          <Text style={styles.emptySub}>
            All high-risk and flagged cases have been reviewed.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {cases.map((caseData) => (
            <ReviewCaseCard
              key={caseData.id}
              caseData={caseData}
              onPress={() => setSelectedCase(caseData)}
            />
          ))}
        </View>
      )}

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
  centerContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: colors.mutedText,
    fontFamily: typography.caption.fontFamily,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.25)',
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    fontFamily: typography.caption.fontFamily,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  emptyStateBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: spacing.xs,
    fontFamily: typography.bodyMedium.fontFamily,
  },
  emptySub: {
    fontSize: 12,
    color: colors.mutedText,
    textAlign: 'center',
    fontFamily: typography.caption.fontFamily,
  },
});

export default ReviewQueueScreen;
