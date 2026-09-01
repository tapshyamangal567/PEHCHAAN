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
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { RiskOverviewCard } from '../components/RiskOverviewCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { CaseRowItem } from '../../officer/components/CaseRowItem';
import { CaseDetailModal } from '../../officer/components/CaseDetailModal';
import { OfficerCase } from '../../officer/data/mockOfficerData';
import { DashboardService, DashboardSummary } from '../../../services/dashboardService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  FadeInView,
  SlideUpView,
  StaggeredEntrance,
} from '../../../utils/animations';
import {
  ClipboardList,
  Bell,
  Users,
  FileCheck2,
  AlertCircle,
  Inbox,
  RefreshCw,
  Shield,
} from 'lucide-react-native';

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
  const [recentCases, setRecentCases] = useState<OfficerCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [sumData, casesData] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getRecentCases(4),
      ]);

      setSummary(sumData);
      setRecentCases(casesData);
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
      loadDashboard();
    }, [loadDashboard])
  );

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      style={styles.screenBg}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboard(true)}
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
            <Text style={typography.h2}>
              Welcome, {user?.name?.split(' ')[0] || user?.username || 'Supervisor'}
            </Text>
            <View style={styles.locationRow}>
              <Text style={typography.caption}>
                {user?.checkpoint || 'Checkpoint Alpha'} • Command Center ({user?.badgeId || user?.username || 'SUP-1090'})
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
          <TouchableOpacity onPress={() => loadDashboard(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SlideUpView>
      )}

      {/* 2. TODAY'S KEY METRICS (4 COMPACT CARDS) */}
      <SlideUpView delay={150} style={styles.section}>
        <SectionHeader title="Today's Checkpoint Summary" />

        <View style={styles.metricsGrid}>
          {/* 1. Total Screened */}
          <StaggeredEntrance index={0} style={styles.metricWrapper}>
            <SupervisorMetricCard
              label="TOTAL SCREENED"
              value={summary.screenedToday}
              loading={loading}
              variant="default"
            />
          </StaggeredEntrance>

          {/* 2. Cleared */}
          <StaggeredEntrance index={1} style={styles.metricWrapper}>
            <SupervisorMetricCard
              label="CLEARED"
              value={summary.clearedToday}
              loading={loading}
              variant="success"
            />
          </StaggeredEntrance>

          {/* 3. Flagged */}
          <StaggeredEntrance index={2} style={styles.metricWrapper}>
            <SupervisorMetricCard
              label="FLAGGED"
              value={summary.flaggedToday}
              loading={loading}
              variant="danger"
            />
          </StaggeredEntrance>

          {/* 4. Under Review */}
          <StaggeredEntrance index={3} style={styles.metricWrapper}>
            <SupervisorMetricCard
              label="UNDER REVIEW"
              value={summary.underReviewToday}
              loading={loading}
              variant="warning"
            />
          </StaggeredEntrance>
        </View>
      </SlideUpView>

      {/* 3. COMPACT RISK OVERVIEW */}
      <SlideUpView delay={220} style={styles.section}>
        <RiskOverviewCard
          low={summary.riskDistribution.lowPercentage}
          medium={summary.riskDistribution.mediumPercentage}
          high={summary.riskDistribution.highPercentage}
          onPress={() => navigation.navigate('Cases')}
        />
      </SlideUpView>

      {/* 4. QUICK ACTION CARDS (4 DEDICATED SECTIONS) */}
      <SlideUpView delay={280} style={styles.section}>
        <SectionHeader title="Control Center Sections" />

        <View style={styles.quickActionGrid}>
          {/* Card 1: Review Queue */}
          <View style={styles.quickActionWrapper}>
            <QuickActionCard
              title="Review Queue"
              subtitle="Evaluate flagged passports"
              icon={<ClipboardList size={20} color={colors.danger} />}
              badgeCount={summary.pendingReviewCount}
              badgeVariant="danger"
              onPress={() => navigation.navigate('Review Queue')}
            />
          </View>

          {/* Card 2: Security Alerts */}
          <View style={styles.quickActionWrapper}>
            <QuickActionCard
              title="Security Alerts"
              subtitle="High risk anomaly alerts"
              icon={<Bell size={20} color={colors.warning} />}
              badgeCount={summary.flaggedToday}
              badgeVariant="warning"
              onPress={() => navigation.navigate('Alerts')}
            />
          </View>

          {/* Card 3: Officer Activity */}
          <View style={styles.quickActionWrapper}>
            <QuickActionCard
              title="Officer Activity"
              subtitle="Field team throughput"
              icon={<Users size={20} color={colors.primaryNavy} />}
              badgeLabel={`${summary.activeOfficersCount} ACTIVE`}
              badgeVariant="success"
              onPress={() => navigation.navigate('OfficerActivity')}
            />
          </View>

          {/* Card 4: Cases */}
          <View style={styles.quickActionWrapper}>
            <QuickActionCard
              title="Screening Cases"
              subtitle="Audit log & search"
              icon={<FileCheck2 size={20} color={colors.primaryNavy} />}
              badgeLabel={`${summary.totalVerifications} TOTAL`}
              badgeVariant="default"
              onPress={() => navigation.navigate('Cases')}
            />
          </View>
        </View>
      </SlideUpView>

      {/* 5. COMPACT RECENT ACTIVITY (LATEST 3-4 RECORDS) */}
      <SlideUpView delay={350} style={styles.section}>
        <SectionHeader
          title="Recent Activity"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Cases')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          }
        />
        {loading && recentCases.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
        ) : recentCases.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Inbox size={22} color={colors.mutedText} />
            <Text style={styles.emptyStateText}>No verification records yet.</Text>
          </View>
        ) : (
          recentCases.map((caseData) => (
            <CaseRowItem
              key={caseData.id}
              caseData={caseData}
              onPress={() => setSelectedCase(caseData)}
            />
          ))
        )}
      </SlideUpView>

      {/* 6. Footer System Status */}
      <FadeInView delay={420} style={styles.systemStatusFooter}>
        <Shield size={14} color={colors.mutedText} />
        <Text style={styles.systemStatusText}>
          PEHCHAAN Security Engine • PostgreSQL Connected
        </Text>
      </FadeInView>

      {/* CASE DETAILS MODAL */}
      <CaseDetailModal
        caseData={selectedCase}
        visible={!!selectedCase}
        onClose={() => setSelectedCase(null)}
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
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricWrapper: {
    width: '48%',
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionWrapper: {
    width: '48%',
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
  systemStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  systemStatusText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
  },
});

export default SupervisorDashboardScreen;
