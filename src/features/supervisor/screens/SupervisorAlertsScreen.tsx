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
import { AlertItemCard } from '../../officer/components/AlertItemCard';
import { SupervisorReviewModal } from '../components/SupervisorReviewModal';
import { EscalatedAlertItem, SupervisorReviewCase } from '../data/mockSupervisorData';
import { DashboardService } from '../../../services/dashboardService';
import { spacing, colors, radius, typography } from '../../../theme';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react-native';

export const SupervisorAlertsScreen = () => {
  const [alerts, setAlerts] = useState<EscalatedAlertItem[]>([]);
  const [reviewCases, setReviewCases] = useState<SupervisorReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [alertsData, casesData] = await Promise.all([
        DashboardService.getEscalatedAlerts(30),
        DashboardService.getReviewQueue(30),
      ]);
      setAlerts(alertsData);
      setReviewCases(casesData);
    } catch (err: any) {
      console.warn('[SupervisorAlerts] Error fetching alerts:', err?.message || err);
      setError('Unable to load checkpoint alerts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [loadAlerts])
  );

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAlerts(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      <SectionHeader
        title="Checkpoint Alerts"
        subtitle="Escalated notifications requiring supervisor intervention from PostgreSQL"
      />

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadAlerts(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && alerts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryNavy} />
          <Text style={styles.loadingText}>Loading checkpoint alerts...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No active security alerts.</Text>
          <Text style={styles.emptySub}>
            Flagged cases requiring supervisor escalation will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {alerts.map((alert) => (
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
                const matched = reviewCases.find((c) => c.caseId === alert.caseId);
                if (matched) setSelectedCase(matched);
              }}
            />
          ))}
        </View>
      )}

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

export default SupervisorAlertsScreen;
