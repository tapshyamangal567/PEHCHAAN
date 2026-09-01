import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { AppLogo } from '../../../components/ui/AppLogo';
import { Avatar } from '../../../components/ui/Avatar';
import { OnlineIndicator } from '../../../components/ui/OnlineIndicator';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { ReviewCaseCard } from '../components/ReviewCaseCard';
import { SupervisorReviewModal } from '../components/SupervisorReviewModal';
import { RiskDistributionCard } from '../components/RiskDistributionCard';
import { OfficerActivityRow } from '../components/OfficerActivityRow';
import { AlertItemCard } from '../../officer/components/AlertItemCard';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  SupervisorReviewCase,
  ActiveOfficerItem,
  EscalatedAlertItem,
} from '../data/mockSupervisorData';
import { DashboardService, DashboardSummary } from '../../../services/dashboardService';
import {
  FadeInView,
  SlideUpView,
  StaggeredEntrance,
} from '../../../utils/animations';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react-native';

export const SupervisorDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<DashboardSummary>({
    screenedToday: 0,
    clearedToday: 0,
    flaggedToday: 0,
    underReviewToday: 0,
    totalVerifications: 0,
    pendingReviewCount: 0,
    activeOfficersCount: 0,
    riskDistribution: { lowPercentage: 0, mediumPercentage: 0, highPercentage: 0 },
  });
  const [reviewQueue, setReviewQueue] = useState<SupervisorReviewCase[]>([]);
  const [officerActivity, setOfficerActivity] = useState<ActiveOfficerItem[]>([]);
  const [escalatedAlerts, setEscalatedAlerts] = useState<EscalatedAlertItem[]>([]);

  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  const loadSupervisorDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [sumData, queueData, actData, alertsData] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getReviewQueue(5),
        DashboardService.getOfficerActivity(),
        DashboardService.getEscalatedAlerts(4),
      ]);

      setSummary(sumData);
      setReviewQueue(queueData);
      setOfficerActivity(actData);
      setEscalatedAlerts(alertsData);
    } catch (err: any) {
      console.warn('[Supervisor Dashboard] Error loading dashboard:', err?.message || err);
      setError('Unable to load checkpoint dashboard. Please check connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSupervisorDashboard();
    }, [loadSupervisorDashboard])
  );

  const handleDecision = (decision: string, caseId: string) => {
    // Refresh queue after decision
    loadSupervisorDashboard(true);
  };

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      style={styles.screenBg}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadSupervisorDashboard(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      {/* 1. Header with PEHCHAAN Brand & Supervisor Profile */}
      <FadeInView delay={100} style={styles.headerRow}>
        <View style={styles.brandingBox}>
          <AppLogo size="sm" showTagline={false} align="flex-start" />
          <View style={styles.headerTitleBox}>
            <Text style={typography.h2}>Checkpoint Command</Text>
            <View style={styles.locationRow}>
              <Text style={typography.caption}>
                {user?.checkpoint || 'Checkpoint Alpha'} • Supervisor Ops ({user?.badgeId || user?.username || 'SUP-1090'})
              </Text>
              <OnlineIndicator label="PostgreSQL Active" size="sm" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Supervisor Profile"
        >
          <Avatar name={user?.name || user?.username || 'Supervisor'} size={44} showOnlineStatus />
        </TouchableOpacity>
      </FadeInView>

      {/* Error state */}
      {error && (
        <SlideUpView delay={110} style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadSupervisorDashboard(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SlideUpView>
      )}

      {/* 2. PRIORITY REVIEW QUEUE (VISUAL PRIORITY FOR SUPERVISOR) */}
      <SlideUpView delay={150} style={styles.section}>
        <SectionHeader
          title="Cases Requiring Approval"
          subtitle="High-risk and flagged cases escalated from PostgreSQL"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Review Queue')}>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>
                  {summary.pendingReviewCount} PENDING
                </Text>
              </View>
            </TouchableOpacity>
          }
        />
        {loading && reviewQueue.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
        ) : reviewQueue.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Inbox size={22} color={colors.mutedText} />
            <Text style={styles.emptyStateText}>No verification records yet.</Text>
          </View>
        ) : (
          reviewQueue.slice(0, 3).map((caseData) => (
            <ReviewCaseCard
              key={caseData.id}
              caseData={caseData}
              onPress={() => setSelectedCase(caseData)}
            />
          ))
        )}
      </SlideUpView>

      {/* 3. CHECKPOINT SUMMARY (4 METRIC CARDS) */}
      <SlideUpView delay={250} style={styles.metricsSection}>
        <SectionHeader title="Checkpoint Statistics" />

        <View style={styles.metricsGrid}>
          {/* Total Screened */}
          <StaggeredEntrance index={0} style={styles.metricCardWrapper}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL SCREENED</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
              ) : (
                <Text style={[typography.h2, styles.metricValue]}>
                  {summary.screenedToday.toLocaleString()}
                </Text>
              )}
            </View>
          </StaggeredEntrance>

          {/* Flagged */}
          <StaggeredEntrance index={1} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardFlagged]}>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>
                FLAGGED
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.danger} style={styles.loader} />
              ) : (
                <Text style={[typography.h2, { color: colors.danger }]}>
                  {summary.flaggedToday}
                </Text>
              )}
            </View>
          </StaggeredEntrance>

          {/* Medium Risk */}
          <StaggeredEntrance index={2} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardWarning]}>
              <Text style={[styles.metricLabel, { color: colors.warning }]}>
                UNDER REVIEW
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.warning} style={styles.loader} />
              ) : (
                <Text style={[typography.h2, { color: colors.warning }]}>
                  {summary.underReviewToday}
                </Text>
              )}
            </View>
          </StaggeredEntrance>

          {/* Officers Active */}
          <StaggeredEntrance index={3} style={styles.metricCardWrapper}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>OFFICERS ACTIVE</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
              ) : (
                <Text style={[typography.h2, styles.metricValue]}>
                  {summary.activeOfficersCount}
                </Text>
              )}
            </View>
          </StaggeredEntrance>
        </View>
      </SlideUpView>

      {/* 4. RISK DISTRIBUTION BAR */}
      <SlideUpView delay={300} style={styles.section}>
        <RiskDistributionCard
          low={summary.riskDistribution.lowPercentage}
          medium={summary.riskDistribution.mediumPercentage}
          high={summary.riskDistribution.highPercentage}
        />
      </SlideUpView>

      {/* 5. TEAM ACTIVITY */}
      <SlideUpView delay={350} style={styles.section}>
        <SectionHeader
          title="Officer Operations"
          subtitle="Live screening throughput by registered checkpoint officers"
        />
        {loading && officerActivity.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
        ) : officerActivity.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Inbox size={22} color={colors.mutedText} />
            <Text style={styles.emptyStateText}>No officer operations recorded today.</Text>
          </View>
        ) : (
          officerActivity.map((officer) => (
            <OfficerActivityRow key={officer.id} officer={officer} />
          ))
        )}
      </SlideUpView>

      {/* 6. ESCALATED ALERTS */}
      <SlideUpView delay={400} style={styles.section}>
        <SectionHeader
          title="Escalated Alerts"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          }
        />
        {loading && escalatedAlerts.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
        ) : escalatedAlerts.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Inbox size={22} color={colors.mutedText} />
            <Text style={styles.emptyStateText}>No active security alerts.</Text>
          </View>
        ) : (
          escalatedAlerts.map((alert) => (
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
                const matched = reviewQueue.find((c) => c.caseId === alert.caseId);
                if (matched) setSelectedCase(matched);
              }}
            />
          ))
        )}
      </SlideUpView>

      {/* SUPERVISOR REVIEW DECISION MODAL */}
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
  screenBg: {
    backgroundColor: colors.paleBlue,
  },
  container: {
    paddingBottom: spacing.xxxl * 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  brandingBox: {
    flex: 1,
  },
  headerTitleBox: {
    marginTop: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
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
  section: {
    marginBottom: spacing.lg,
  },
  reviewBadge: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  reviewBadgeText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.danger,
    fontWeight: '700',
  },
  metricsSection: {
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricCardWrapper: {
    width: '48%',
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  metricCardFlagged: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.25)',
  },
  metricCardWarning: {
    backgroundColor: colors.warningBg,
    borderColor: 'rgba(183, 121, 31, 0.25)',
  },
  metricLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    color: colors.primaryText,
    fontWeight: '700',
  },
  loader: {
    marginVertical: spacing.md,
  },
  emptyStateBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emptyStateText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.mutedText,
  },
  viewAllText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
});

export default SupervisorDashboardScreen;
