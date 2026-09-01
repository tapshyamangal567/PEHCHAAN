import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { CaseRowItem } from '../../officer/components/CaseRowItem';
import { CaseDetailModal } from '../../officer/components/CaseDetailModal';
import { OfficerCase } from '../../officer/data/mockOfficerData';
import { DashboardService } from '../../../services/dashboardService';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { Search, Inbox, AlertCircle, RefreshCw, Filter } from 'lucide-react-native';

type FilterTab = 'ALL' | 'VERIFIED' | 'FLAGGED' | 'PENDING';

export const SupervisorCasesScreen = () => {
  const [cases, setCases] = useState<OfficerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  const loadCases = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await DashboardService.getRecentCases(100);
      setCases(data);
    } catch (err: any) {
      console.warn('[SupervisorCases] Error fetching cases:', err?.message || err);
      setError('Unable to load checkpoint cases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [loadCases])
  );

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.officerName && c.officerName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'VERIFIED') return c.status === 'VERIFIED';
    if (activeFilter === 'FLAGGED') return c.status === 'FLAGGED';
    if (activeFilter === 'PENDING') return c.status === 'PENDING';
    return true;
  });

  const getFilterCount = (filter: FilterTab) => {
    if (filter === 'ALL') return cases.length;
    return cases.filter((c) => c.status === filter).length;
  };

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadCases(true)}
          colors={[colors.primaryNavy]}
          tintColor={colors.primaryNavy}
        />
      }
    >
      <SectionHeader
        title="Screening Cases"
        subtitle="Complete checkpoint audit log from Supabase PostgreSQL"
      />

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.mutedText} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Case ID, name, passport, or officer..."
            placeholderTextColor={colors.mutedText}
            style={[typography.body, styles.searchInput]}
          />
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterChipsRow}>
        {(['ALL', 'VERIFIED', 'FLAGGED', 'PENDING'] as FilterTab[]).map((tab) => {
          const isSelected = activeFilter === tab;
          const count = getFilterCount(tab);
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {tab === 'ALL'
                  ? 'All'
                  : tab === 'VERIFIED'
                  ? 'Cleared'
                  : tab === 'FLAGGED'
                  ? 'Flagged'
                  : 'Pending'}
              </Text>
              <View
                style={[
                  styles.chipCountBadge,
                  isSelected && styles.chipCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipCountText,
                    isSelected && styles.chipCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadCases(true)} style={styles.retryBtn}>
            <RefreshCw size={14} color={colors.danger} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && cases.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryNavy} />
          <Text style={styles.loadingText}>Loading checkpoint records...</Text>
        </View>
      ) : filteredCases.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No verification records found.</Text>
          <Text style={styles.emptySub}>
            {searchQuery || activeFilter !== 'ALL'
              ? 'No cases match your active filters and search query.'
              : 'Evaluated passports and identity screenings will appear here.'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredCases.map((caseData) => (
            <CaseRowItem
              key={caseData.id}
              caseData={caseData}
              onPress={() => setSelectedCase(caseData)}
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
  searchRow: {
    marginBottom: spacing.sm,
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs + 2,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: colors.primaryNavy,
    borderColor: colors.primaryNavy,
  },
  filterChipText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondaryText,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  chipCountBadge: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipCountText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.mutedText,
  },
  chipCountTextActive: {
    color: colors.white,
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

export default SupervisorCasesScreen;
