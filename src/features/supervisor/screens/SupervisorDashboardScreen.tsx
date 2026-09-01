import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SupervisorMetricCard } from '../components/SupervisorMetricCard';
import { RiskOverviewCard } from '../components/RiskOverviewCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { DashboardService, DashboardSummary } from '../../../services/dashboardService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  ClipboardList,
  Bell,
  Users,
  FileSearch,
  AlertCircle,
  RefreshCw,
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

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const sumData = await DashboardService.getSummary();
      setSummary(sumData);
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

  // Avatar text helper (e.g. '45' from '4545' or first 2 chars)
  const username = user?.name || user?.username || '4545';
  const avatarInitials = username.length >= 2 ? username.slice(0, 2) : '45';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            colors={['#1D4ED8']}
            tintColor="#1D4ED8"
          />
        }
      >
        {/* 1. Top Header Bar: PEHCHAAN GOV + Bell + User Avatar */}
        <View style={styles.topHeaderBar}>
          <View style={styles.brandRow}>
            {/* Shield Logo */}
            <View style={styles.shieldBox}>
              <Svg width="30" height="34" viewBox="0 0 100 110" fill="none">
                <Path
                  d="M50 6L88 20V54C88 80 70 98 50 104C30 98 12 80 12 54V20L50 6Z"
                  fill="#0F2B48"
                />
                <Circle cx="50" cy="42" r="13" fill="#FFFFFF" />
                <Path d="M28 76C28 62 38 56 50 56C62 56 72 62 72 76 Z" fill="#FFFFFF" />
                <Rect x="34" y="86" width="14" height="3" rx="1.5" fill="#F28C28" />
                <Rect x="52" y="86" width="14" height="3" rx="1.5" fill="#138A4B" />
              </Svg>
            </View>

            <Text style={styles.brandTitle}>PEHCHAAN</Text>

            {/* GOV Badge */}
            <View style={styles.govBadge}>
              <Text style={styles.govBadgeText}>GOV</Text>
            </View>
          </View>

          {/* Right Header Controls */}
          <View style={styles.headerRightControls}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Alerts')}
              style={styles.bellButton}
              activeOpacity={0.7}
              accessibilityLabel="View Alerts"
            >
              <Bell size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              style={styles.avatarButton}
              activeOpacity={0.8}
              accessibilityLabel="Supervisor Profile"
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{avatarInitials}</Text>
              </View>
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Welcome Title & Gate / PostgreSQL Status */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome, {username}</Text>
          <View style={styles.subTitleRow}>
            <Text style={styles.gateSubtitle}>
              at {user?.checkpoint || 'gate 1'} • Command Center ({user?.badgeId || username})
            </Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>PostgreSQL Active</Text>
            </View>
          </View>
        </View>

        {/* Error state */}
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => loadDashboard(true)} style={styles.retryBtn}>
              <RefreshCw size={14} color={colors.danger} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. Today's Checkpoint Summary (2x2 Grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Checkpoint Summary</Text>
          <View style={styles.metricsGrid}>
            {/* Total Screened */}
            <View style={styles.metricWrapper}>
              <SupervisorMetricCard
                label="TOTAL SCREENED"
                value={summary.screenedToday}
                loading={loading}
                variant="default"
              />
            </View>

            {/* Cleared */}
            <View style={styles.metricWrapper}>
              <SupervisorMetricCard
                label="CLEARED"
                value={summary.clearedToday}
                loading={loading}
                variant="success"
              />
            </View>

            {/* Flagged */}
            <View style={styles.metricWrapper}>
              <SupervisorMetricCard
                label="FLAGGED"
                value={summary.flaggedToday}
                loading={loading}
                variant="danger"
              />
            </View>

            {/* Under Review */}
            <View style={styles.metricWrapper}>
              <SupervisorMetricCard
                label="UNDER REVIEW"
                value={summary.underReviewToday}
                loading={loading}
                variant="warning"
              />
            </View>
          </View>
        </View>

        {/* 4. Risk Distribution Bar Card */}
        <View style={styles.section}>
          <RiskOverviewCard
            low={summary.riskDistribution.lowPercentage}
            medium={summary.riskDistribution.mediumPercentage}
            high={summary.riskDistribution.highPercentage}
            onPress={() => navigation.navigate('Cases')}
          />
        </View>

        {/* 5. Control Center Sections (2x2 Grid) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Control Center Sections</Text>
          <View style={styles.controlGrid}>
            {/* Card 1: Review Queue */}
            <View style={styles.controlWrapper}>
              <QuickActionCard
                title="Review Queue"
                subtitle="Evaluate flagged passports"
                icon={<ClipboardList size={18} color="#DC2626" />}
                badgeCount={summary.pendingReviewCount || summary.underReviewToday}
                badgeVariant="danger"
                iconBg="#FEF2F2"
                arrowColor="#DC2626"
                onPress={() => navigation.navigate('Review Queue')}
              />
            </View>

            {/* Card 2: Security Alerts */}
            <View style={styles.controlWrapper}>
              <QuickActionCard
                title="Security Alerts"
                subtitle="High risk anomaly alerts"
                icon={<Bell size={18} color="#D97706" />}
                badgeCount={summary.flaggedToday}
                badgeVariant="warning"
                iconBg="#FFFBEB"
                arrowColor="#D97706"
                onPress={() => navigation.navigate('Alerts')}
              />
            </View>

            {/* Card 3: Officer Activity */}
            <View style={styles.controlWrapper}>
              <QuickActionCard
                title="Officer Activity"
                subtitle="Field team throughput and status"
                icon={<Users size={18} color="#2563EB" />}
                badgeLabel={`${summary.activeOfficersCount} ACTIVE`}
                badgeVariant="success"
                iconBg="#F0F7FF"
                arrowColor="#2563EB"
                onPress={() => navigation.navigate('OfficerActivity')}
              />
            </View>

            {/* Card 4: Screening Cases */}
            <View style={styles.controlWrapper}>
              <QuickActionCard
                title="Screening Cases"
                subtitle="Audit log & search screens"
                icon={<FileSearch size={18} color="#7E22CE" />}
                badgeLabel={`${summary.totalVerifications} TOTAL`}
                badgeVariant="purple"
                iconBg="#FAF5FF"
                arrowColor="#7E22CE"
                onPress={() => navigation.navigate('Cases')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* 1. Top Header Bar */
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shieldBox: {
    width: 30,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2B48',
    letterSpacing: 1,
  },
  govBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  govBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellButton: {
    padding: 4,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* 2. Welcome Section */
  welcomeSection: {
    marginBottom: 18,
  },
  welcomeTitle: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  gateSubtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Error Banner */
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
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

  /* Section Styling */
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricWrapper: {
    width: '48%',
  },

  /* Control Center Grid */
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  controlWrapper: {
    width: '48%',
  },
});

export default SupervisorDashboardScreen;
