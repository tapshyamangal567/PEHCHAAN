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
import { AlertItemCard } from '../components/AlertItemCard';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { PendingAlert, OfficerCase } from '../data/mockOfficerData';
import { DashboardService } from '../../../services/dashboardService';
import { spacing, colors, radius, typography } from '../../../theme';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react-native';

export const AlertsListScreen = () => {
  const [alerts, setAlerts] = useState<PendingAlert[]>([]);
  const [cases, setCases] = useState<OfficerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [alertsData, casesData] = await Promise.all([
        DashboardService.getAlerts(30),
        DashboardService.getRecentCases(30),
      ]);
      setAlerts(alertsData);
      setCases(casesData);
    } catch (err: any) {
      console.warn('[AlertsList] Error fetching alerts:', err?.message || err);
      setError('Unable to load security alerts. Please try again.');
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
        title="Security Alerts"
        subtitle="Real-time flagged document anomaly notifications from PostgreSQL"
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
          <Text style={styles.loadingText}>Loading security alerts...</Text>
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No active security alerts.</Text>
          <Text style={styles.emptySub}>
            Documents flagged with high risk or anomalies will appear here in real time.
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {alerts.map((alert) => (
            <AlertItemCard
              key={alert.id}
              alert={alert}
              onPress={() => {
                const matchedCase = cases.find((c) => c.caseId === alert.caseId);
                if (matchedCase) setSelectedCase(matchedCase);
              }}
            />
          ))}
        </View>
      )}

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

export default AlertsListScreen;
