import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { AppLogo } from '../../../components/ui/AppLogo';
import { Avatar } from '../../../components/ui/Avatar';
import { NetworkStatusIndicator } from '../../../components/ui/NetworkStatusIndicator';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { AlertItemCard } from '../components/AlertItemCard';
import { CaseRowItem } from '../components/CaseRowItem';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { useSyncStore } from '../../../services/offline/syncService';
import { OfficerCase, PendingAlert } from '../data/mockOfficerData';
import { DashboardService, DashboardSummary } from '../../../services/dashboardService';
import {
  FadeInView,
  SlideUpView,
  StaggeredEntrance,
  ScalePressable,
} from '../../../utils/animations';
import {
  ScanLine,
  UserCheck,
  ChevronRight,
  Camera,
  ArrowRight,
  Shield,
  Layers,
  AlertCircle,
  Inbox,
  RefreshCw,
} from 'lucide-react-native';

export const OfficerDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { stats } = useSyncStore();

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
  const [pendingAlerts, setPendingAlerts] = useState<PendingAlert[]>([]);

  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [sumData, casesData, alertsData] = await Promise.all([
        DashboardService.getSummary(),
        DashboardService.getRecentCases(5),
        DashboardService.getAlerts(2),
      ]);

      setSummary(sumData);
      setRecentCases(casesData);
      setPendingAlerts(alertsData);
    } catch (err: any) {
      console.warn('[Officer Dashboard] Error loading dashboard:', err?.message || err);
      setError('Unable to load dashboard data. Please check connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleStartScreening = () => {
    navigation.navigate('PassportUpload');
  };

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={styles.container}
      style={styles.screenBg}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboardData(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      {/* Background Soft Blue Glow Effect behind Hero */}
      <View style={styles.ambientBlueGlow} />

      {/* 1. Header with AppLogo, Officer Info & Interactive Network Indicator */}
      <FadeInView delay={100} style={styles.headerRow}>
        <View style={styles.brandingBox}>
          <AppLogo size="sm" showTagline={false} align="flex-start" />
          <View style={styles.headerTitleBox}>
            <Text style={typography.h2}>
              Good Day, {user?.name?.split(' ')[0] || user?.username || 'Officer'}
            </Text>
            <View style={styles.locationRow}>
              <Text style={typography.caption}>
                {user?.checkpoint || 'Checkpoint Alpha'} • {user?.badgeId || user?.username || 'IND-SEC'}
              </Text>
              <NetworkStatusIndicator />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="View Profile"
        >
          <Avatar name={user?.name || user?.username || 'Officer'} size={44} showOnlineStatus />
        </TouchableOpacity>
      </FadeInView>

      {/* Error state */}
      {error && (
        <SlideUpView delay={110} style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadDashboardData(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </SlideUpView>
      )}

      {/* Offline Pending Banner */}
      {stats.pending > 0 && (
        <SlideUpView delay={120}>
          <TouchableOpacity
            style={styles.pendingSyncCard}
            onPress={() => navigation.navigate('OfflineSync')}
            activeOpacity={0.85}
          >
            <View style={styles.pendingSyncLeft}>
              <Layers size={18} color="#D97706" />
              <View>
                <Text style={styles.pendingSyncTitle}>
                  {stats.pending} Offline {stats.pending === 1 ? 'Case' : 'Cases'} Pending Sync
                </Text>
                <Text style={styles.pendingSyncSub}>
                  Tap to view offline queue and synchronize with server
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#D97706" />
          </TouchableOpacity>
        </SlideUpView>
      )}

      {/* 2. Today's Screening Metrics */}
      <SlideUpView delay={150} style={styles.metricsSection}>
        <SectionHeader title="Today's Activity" />

        <View style={styles.metricsGrid}>
          {/* Card 1: Screened */}
          <StaggeredEntrance index={0} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardScreened]}>
              <Text style={styles.metricLabel}>SCREENED</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.loader} />
              ) : (
                <Text style={typography.metricValue}>{summary.screenedToday}</Text>
              )}
            </View>
          </StaggeredEntrance>

          {/* Card 2: Cleared */}
          <StaggeredEntrance index={1} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardCleared]}>
              <Text style={[styles.metricLabel, { color: colors.success }]}>CLEARED</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.success} style={styles.loader} />
              ) : (
                <Text style={[typography.metricValue, { color: colors.success }]}>
                  {summary.clearedToday}
                </Text>
              )}
            </View>
          </StaggeredEntrance>

          {/* Card 3: Flagged */}
          <StaggeredEntrance index={2} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardFlagged]}>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>FLAGGED</Text>
              {loading ? (
                <ActivityIndicator size="small" color={colors.danger} style={styles.loader} />
              ) : (
                <Text style={[typography.metricValue, { color: colors.danger }]}>
                  {summary.flaggedToday}
                </Text>
              )}
            </View>
          </StaggeredEntrance>
        </View>
      </SlideUpView>

      {/* 3. HERO ACTION CARD: "START NEW SCREENING" */}
      <SlideUpView delay={250} style={styles.heroSection}>
        <ScalePressable
          onPress={handleStartScreening}
          activeScale={0.98}
          accessibilityRole="button"
          accessibilityLabel="Start New Passport Screening"
          style={styles.heroCard}
        >
          <View style={styles.heroSecurityPattern} />

          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <ScanLine size={24} color={colors.white} />
            </View>
            <View style={styles.heroArrowBox}>
              <ArrowRight size={18} color={colors.white} />
            </View>
          </View>

          <Text style={styles.heroTitle}>START NEW SCREENING</Text>
          <Text style={styles.heroSubtitle}>
            Scan official passport or identity document for instant AI verification
          </Text>

          <View style={styles.heroCtaWrapper}>
            <PrimaryButton
              title="Launch Scanner"
              onPress={handleStartScreening}
              icon={<Camera size={18} color={colors.white} />}
              style={styles.heroButtonOverride}
            />
          </View>
        </ScalePressable>
      </SlideUpView>

      {/* 4. Secondary Quick Action */}
      <SlideUpView delay={300} style={styles.secondaryActionSection}>
        <ScalePressable
          onPress={() => setShowIdentityModal(true)}
          activeScale={0.98}
          accessibilityRole="button"
          accessibilityLabel="Verify Identity Match"
          style={styles.secondaryCard}
        >
          <View style={styles.secondaryCardRow}>
            <View style={styles.iconCircleSecondary}>
              <UserCheck size={20} color={colors.primaryNavy} />
            </View>
            <View style={styles.secondaryTextColumn}>
              <Text style={[typography.bodyMedium, styles.secondaryTitle]}>
                Biometric Identity Match
              </Text>
              <Text style={typography.caption}>
                Perform facial verification against document portrait
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedText} />
          </View>
        </ScalePressable>
      </SlideUpView>

      {/* 5. Pending Alerts */}
      <SlideUpView delay={350} style={styles.section}>
        <SectionHeader
          title="Security Alerts"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          }
        />
        {loading && pendingAlerts.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.sectionLoader} />
        ) : pendingAlerts.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Inbox size={22} color={colors.mutedText} />
            <Text style={styles.emptyStateText}>No active security alerts.</Text>
          </View>
        ) : (
          pendingAlerts.map((alert) => (
            <AlertItemCard
              key={alert.id}
              alert={alert}
              onPress={() => {
                const matchedCase = recentCases.find((c) => c.caseId === alert.caseId);
                if (matchedCase) setSelectedCase(matchedCase);
              }}
            />
          ))
        )}
      </SlideUpView>

      {/* 6. Recent Cases */}
      <SlideUpView delay={400} style={styles.section}>
        <SectionHeader
          title="Recent Cases"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Cases')}>
              <Text style={styles.viewAllText}>See all</Text>
            </TouchableOpacity>
          }
        />
        {loading && recentCases.length === 0 ? (
          <ActivityIndicator size="small" color={colors.primaryNavy} style={styles.sectionLoader} />
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

      {/* 7. Footer Indicator */}
      <FadeInView delay={450} style={styles.systemStatusFooter}>
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

      {/* IDENTITY MODAL */}
      <Modal
        visible={showIdentityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIdentityModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowIdentityModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalIconBox}>
              <UserCheck size={32} color={colors.primaryNavy} />
            </View>
            <Text style={[typography.h3, styles.modalTitle]}>Identity Verification</Text>
            <Text style={[typography.body, styles.modalBody]}>
              Biometric facial recognition pipeline is connected to Supabase and ready for live verification.
            </Text>
            <PrimaryButton title="Got it" onPress={() => setShowIdentityModal(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenBg: {
    backgroundColor: colors.warmBackground,
  },
  container: {
    paddingBottom: spacing.xxxl * 2,
    position: 'relative',
  },
  ambientBlueGlow: {
    position: 'absolute',
    top: 60,
    left: '10%',
    right: '10%',
    height: 180,
    backgroundColor: 'rgba(29, 91, 142, 0.08)',
    borderRadius: 100,
    zIndex: -1,
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
  pendingSyncCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  pendingSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  pendingSyncTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    fontFamily: typography.bodyMedium.fontFamily,
  },
  pendingSyncSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
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
  metricsSection: {
    marginBottom: spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.soft,
  },
  metricCardScreened: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  metricCardCleared: {
    backgroundColor: colors.successBg,
    borderColor: 'rgba(18, 183, 106, 0.25)',
  },
  metricCardFlagged: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(180, 35, 24, 0.25)',
  },
  metricLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  loader: {
    marginVertical: 4,
  },
  sectionLoader: {
    marginVertical: spacing.md,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.card,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  heroSecurityPattern: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    color: colors.white,
    lineHeight: 24,
    marginBottom: spacing.lg,
    maxWidth: '85%',
  },
  heroCtaWrapper: {
    marginTop: spacing.xs,
  },
  heroButtonOverride: {
    backgroundColor: colors.primaryRose,
    borderColor: colors.primaryRose,
  },
  secondaryActionSection: {
    marginBottom: spacing.lg,
  },
  secondaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  secondaryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleSecondary: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  secondaryTextColumn: {
    flex: 1,
  },
  secondaryTitle: {
    color: colors.primaryText,
    marginBottom: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  viewAllText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.floating,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalBody: {
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
});

export default OfficerDashboardScreen;
