import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import {
  MOCK_OFFICER_METRICS,
  MOCK_PENDING_ALERTS,
  MOCK_RECENT_CASES,
  OfficerCase,
} from '../data/mockOfficerData';
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
  FileCheck2,
  Layers,
} from 'lucide-react-native';

export const OfficerDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { stats } = useSyncStore();

  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const handleStartScreening = () => {
    navigation.navigate('PassportUpload');
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container} style={styles.screenBg}>
      {/* Background Soft Blue Glow Effect behind Hero */}
      <View style={styles.ambientBlueGlow} />

      {/* 1. Header with AppLogo, Officer Info & Interactive Network Indicator */}
      <FadeInView delay={100} style={styles.headerRow}>
        <View style={styles.brandingBox}>
          <AppLogo size="sm" showTagline={false} align="flex-start" />
          <View style={styles.headerTitleBox}>
            <Text style={typography.h2}>Good Morning, {user?.name?.split(' ')[0] || 'Arjun'}</Text>
            <View style={styles.locationRow}>
              <Text style={typography.caption}>
                Checkpoint Alpha • {user?.badgeId || 'IND-SEC-8842'}
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
          <Avatar name={user?.name || 'Arjun Mehta'} size={44} showOnlineStatus />
        </TouchableOpacity>
      </FadeInView>

      {/* Offline Pending Banner (if cases are waiting to sync) */}
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

      {/* 2. Today's Screening Metrics (3 Harmonious Surfaces: Soft Blue, Soft Mint, Soft Warm) */}
      <SlideUpView delay={150} style={styles.metricsSection}>
        <SectionHeader title="Today's Activity" />

        <View style={styles.metricsGrid}>
          {/* Card 1: Screened (Soft Blue) */}
          <StaggeredEntrance index={0} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardScreened]}>
              <Text style={styles.metricLabel}>SCREENED</Text>
              <Text style={typography.metricValue}>
                {MOCK_OFFICER_METRICS.screenedToday}
              </Text>
            </View>
          </StaggeredEntrance>

          {/* Card 2: Cleared (Soft Mint) */}
          <StaggeredEntrance index={1} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardCleared]}>
              <Text style={[styles.metricLabel, { color: colors.success }]}>
                CLEARED
              </Text>
              <Text style={[typography.metricValue, { color: colors.success }]}>
                {MOCK_OFFICER_METRICS.clearedToday}
              </Text>
            </View>
          </StaggeredEntrance>

          {/* Card 3: Flagged (Soft Warm) */}
          <StaggeredEntrance index={2} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardFlagged]}>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>
                FLAGGED
              </Text>
              <Text style={[typography.metricValue, { color: colors.danger }]}>
                {MOCK_OFFICER_METRICS.flaggedToday}
              </Text>
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
          {/* Decorative faint background security geometry */}
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
                Perform facial or fingerprint verification against document
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedText} />
          </View>
        </ScalePressable>
      </SlideUpView>

      {/* 5. Pending Alerts */}
      <SlideUpView delay={350} style={styles.section}>
        <SectionHeader
          title="Pending Alerts"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          }
        />
        {MOCK_PENDING_ALERTS.slice(0, 2).map((alert) => (
          <AlertItemCard
            key={alert.id}
            alert={alert}
            onPress={() => {
              const matchedCase = MOCK_RECENT_CASES.find(
                (c) => c.caseId === alert.caseId
              );
              if (matchedCase) setSelectedCase(matchedCase);
            }}
          />
        ))}
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
        {MOCK_RECENT_CASES.map((caseData) => (
          <CaseRowItem
            key={caseData.id}
            caseData={caseData}
            onPress={() => setSelectedCase(caseData)}
          />
        ))}
      </SlideUpView>

      {/* 7. Footer Indicator */}
      <FadeInView delay={450} style={styles.systemStatusFooter}>
        <Shield size={14} color={colors.mutedText} />
        <Text style={styles.systemStatusText}>
          PEHCHAAN Security Engine • Encryption Active
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
              Biometric identity matching service is connected and ready for field verification.
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
  },
  ambientBlueGlow: {
    position: 'absolute',
    top: 100,
    right: -20,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(234, 242, 248, 0.7)',
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
    backgroundColor: colors.softBlue,
    borderColor: 'rgba(18, 52, 91, 0.12)',
  },
  metricCardCleared: {
    backgroundColor: colors.softMint,
    borderColor: 'rgba(46, 125, 91, 0.2)',
  },
  metricCardFlagged: {
    backgroundColor: colors.softWarm,
    borderColor: 'rgba(180, 35, 24, 0.2)',
  },
  metricLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  /* HERO CARD STYLES */
  heroSection: {
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.card,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.card,
  },
  heroSecurityPattern: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.softBlue,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  heroCtaWrapper: {
    width: '100%',
  },
  heroButtonOverride: {
    backgroundColor: colors.secondaryNavy,
  },

  /* SECONDARY ACTION CARD */
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
    gap: spacing.md,
  },
  iconCircleSecondary: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryTextColumn: {
    flex: 1,
  },
  secondaryTitle: {
    color: colors.primaryText,
    fontWeight: '600',
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
  systemStatusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  systemStatusText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.floating,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.softBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    color: colors.primaryNavy,
  },
  modalBody: {
    textAlign: 'center',
    color: colors.secondaryText,
    marginBottom: spacing.xl,
  },
  pendingSyncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
    ...shadows.soft,
  },
  pendingSyncLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  pendingSyncTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  pendingSyncSub: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
});

export default OfficerDashboardScreen;
