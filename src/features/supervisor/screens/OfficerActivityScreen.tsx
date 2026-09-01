import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ActiveOfficerItem } from '../data/mockSupervisorData';
import { DashboardService } from '../../../services/dashboardService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { Search, Users, Inbox, AlertCircle, RefreshCw, Activity, CheckCircle2 } from 'lucide-react-native';

export const OfficerActivityScreen = () => {
  const [officers, setOfficers] = useState<ActiveOfficerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadOfficerData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await DashboardService.getOfficerActivity();
      setOfficers(data);
    } catch (err: any) {
      console.warn('[OfficerActivityScreen] Error loading officer activity:', err?.message || err);
      setError('Unable to load officer activity. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOfficerData();
    }, [loadOfficerData])
  );

  const filteredOfficers = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.badgeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = officers.filter((o) => o.status === 'ACTIVE').length;
  const totalToday = officers.reduce((acc, o) => acc + o.screeningsToday, 0);

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadOfficerData(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      <SectionHeader
        title="Officer Operations"
        subtitle="Live screening throughput by checkpoint field officers"
      />

      {/* Summary KPI Strip */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL OFFICERS</Text>
          <Text style={styles.kpiValue}>{officers.length}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVE TODAY</Text>
          <Text style={[styles.kpiValue, { color: colors.success }]}>{activeCount}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TODAY'S SCREENINGS</Text>
          <Text style={[styles.kpiValue, { color: colors.primaryNavy }]}>{totalToday}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.mutedText} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by officer name or badge..."
            placeholderTextColor={colors.mutedText}
            style={[typography.body, styles.searchInput]}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadOfficerData(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && officers.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryNavy} />
          <Text style={styles.loadingText}>Loading officer throughput...</Text>
        </View>
      ) : filteredOfficers.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No officer records found.</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'No matching officers found for your search query.'
              : 'Registered field officers will appear here with live screening throughput.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredOfficers.map((officer) => (
            <View key={officer.id} style={styles.officerCard}>
              <View style={styles.cardHeader}>
                <Avatar
                  name={officer.name}
                  size={44}
                  showOnlineStatus={officer.status === 'ACTIVE'}
                />
                <View style={styles.officerInfoColumn}>
                  <Text style={[typography.bodyMedium, styles.officerName]}>
                    {officer.name}
                  </Text>
                  <Text style={styles.officerBadgeText}>
                    Badge: {officer.badgeId}
                  </Text>
                  <Text style={styles.lastActiveText}>
                    Last Active: {officer.lastActive}
                  </Text>
                </View>
                <StatusBadge status={officer.status} size="sm" />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SCREENINGS TODAY</Text>
                  <Text style={styles.statValue}>{officer.screeningsToday}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>LIFETIME TOTAL</Text>
                  <Text style={styles.statValue}>{officer.totalVerifications}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  kpiLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 9,
    color: colors.mutedText,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  kpiValue: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  searchRow: {
    marginBottom: spacing.md,
  },
  searchBar: {
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.primaryText,
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
  listContainer: {
    paddingBottom: spacing.xxxl * 2,
    gap: spacing.sm,
  },
  officerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  officerInfoColumn: {
    flex: 1,
  },
  officerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
  },
  officerBadgeText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 1,
    fontFamily: typography.caption.fontFamily,
  },
  lastActiveText: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
    fontFamily: typography.caption.fontFamily,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
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

export default OfficerActivityScreen;
