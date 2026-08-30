import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  MOCK_SUPERVISOR_METRICS,
  MOCK_REVIEW_QUEUE,
  MOCK_RISK_DISTRIBUTION,
  MOCK_OFFICER_ACTIVITY,
  MOCK_ESCALATED_ALERTS,
  SupervisorReviewCase,
} from '../data/mockSupervisorData';
import {
  FadeInView,
  SlideUpView,
  StaggeredEntrance,
} from '../../../utils/animations';

export const SupervisorDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();

  const [selectedCase, setSelectedCase] = useState<SupervisorReviewCase | null>(null);

  const handleDecision = (decision: string, caseId: string) => {
    // Decision handled cleanly in mock state
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container} style={styles.screenBg}>
      {/* 1. Header with PEHCHAAN Brand & Supervisor Profile */}
      <FadeInView delay={100} style={styles.headerRow}>
        <View style={styles.brandingBox}>
          <AppLogo size="sm" showTagline={false} align="flex-start" />
          <View style={styles.headerTitleBox}>
            <Text style={typography.h2}>Checkpoint Overview</Text>
            <View style={styles.locationRow}>
              <Text style={typography.caption}>
                Checkpoint Alpha • Supervisor Ops
              </Text>
              <OnlineIndicator label="Command Active" size="sm" />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Supervisor Profile"
        >
          <Avatar name={user?.name || 'Priya Sharma'} size={44} showOnlineStatus />
        </TouchableOpacity>
      </FadeInView>

      {/* 2. PRIORITY REVIEW QUEUE (VISUAL PRIORITY FOR SUPERVISOR) */}
      <SlideUpView delay={150} style={styles.section}>
        <SectionHeader
          title="Cases Requiring Approval"
          subtitle="High-risk and flagged cases escalated for supervisor review"
          rightAction={
            <TouchableOpacity onPress={() => navigation.navigate('Review Queue')}>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>
                  {MOCK_SUPERVISOR_METRICS.pendingReviewCount} PENDING
                </Text>
              </View>
            </TouchableOpacity>
          }
        />
        {MOCK_REVIEW_QUEUE.slice(0, 3).map((caseData) => (
          <ReviewCaseCard
            key={caseData.id}
            caseData={caseData}
            onPress={() => setSelectedCase(caseData)}
          />
        ))}
      </SlideUpView>

      {/* 3. CHECKPOINT SUMMARY (4 METRIC CARDS) */}
      <SlideUpView delay={250} style={styles.metricsSection}>
        <SectionHeader title="Checkpoint Statistics" />

        <View style={styles.metricsGrid}>
          {/* Total Screened */}
          <StaggeredEntrance index={0} style={styles.metricCardWrapper}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>TOTAL SCREENED</Text>
              <Text style={[typography.h2, styles.metricValue]}>
                {MOCK_SUPERVISOR_METRICS.totalScreenedToday.toLocaleString()}
              </Text>
            </View>
          </StaggeredEntrance>

          {/* Flagged */}
          <StaggeredEntrance index={1} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardFlagged]}>
              <Text style={[styles.metricLabel, { color: colors.danger }]}>
                FLAGGED
              </Text>
              <Text style={[typography.h2, { color: colors.danger }]}>
                {MOCK_SUPERVISOR_METRICS.flaggedToday}
              </Text>
            </View>
          </StaggeredEntrance>

          {/* Medium Risk */}
          <StaggeredEntrance index={2} style={styles.metricCardWrapper}>
            <View style={[styles.metricCard, styles.metricCardWarning]}>
              <Text style={[styles.metricLabel, { color: colors.warning }]}>
                UNDER REVIEW
              </Text>
              <Text style={[typography.h2, { color: colors.warning }]}>
                {MOCK_SUPERVISOR_METRICS.mediumRiskToday}
              </Text>
            </View>
          </StaggeredEntrance>

          {/* Officers Active */}
          <StaggeredEntrance index={3} style={styles.metricCardWrapper}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>OFFICERS ACTIVE</Text>
              <Text style={[typography.h2, styles.metricValue]}>
                {MOCK_SUPERVISOR_METRICS.activeOfficersCount}
              </Text>
            </View>
          </StaggeredEntrance>
        </View>
      </SlideUpView>

      {/* 4. RISK DISTRIBUTION BAR */}
      <SlideUpView delay={300} style={styles.section}>
        <RiskDistributionCard
          low={MOCK_RISK_DISTRIBUTION.lowPercentage}
          medium={MOCK_RISK_DISTRIBUTION.mediumPercentage}
          high={MOCK_RISK_DISTRIBUTION.highPercentage}
        />
      </SlideUpView>

      {/* 5. TEAM ACTIVITY */}
      <SlideUpView delay={350} style={styles.section}>
        <SectionHeader
          title="Officer Operations"
          subtitle="Live screening throughput by assigned officers"
        />
        {MOCK_OFFICER_ACTIVITY.map((officer) => (
          <OfficerActivityRow key={officer.id} officer={officer} />
        ))}
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
              const matched = MOCK_REVIEW_QUEUE.find(
                (c) => c.caseId === alert.caseId
              );
              if (matched) setSelectedCase(matched);
            }}
          />
        ))}
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
  viewAllText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondaryNavy,
  },
});

export default SupervisorDashboardScreen;
