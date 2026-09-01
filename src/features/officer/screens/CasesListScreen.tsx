import React, { useState, useEffect, useCallback } from 'react';
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
import { CaseRowItem } from '../components/CaseRowItem';
import { CaseDetailModal } from '../components/CaseDetailModal';
import { OfficerCase } from '../data/mockOfficerData';
import { DashboardService } from '../../../services/dashboardService';
import { colors, typography, spacing, radius } from '../../../theme';
import { Search, Inbox, AlertCircle, RefreshCw } from 'lucide-react-native';

export const CasesListScreen = () => {
  const [cases, setCases] = useState<OfficerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<OfficerCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCases = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await DashboardService.getRecentCases(50);
      setCases(data);
    } catch (err: any) {
      console.warn('[CasesList] Error fetching cases:', err?.message || err);
      setError('Unable to load screening cases. Please try again.');
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

  const filteredCases = cases.filter(
    (c) =>
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.holderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passportNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        subtitle="Complete log of passport evaluations from PostgreSQL"
      />

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.mutedText} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Case ID, name, or passport..."
            placeholderTextColor={colors.mutedText}
            style={[typography.body, styles.searchInput]}
          />
        </View>
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
          <Text style={styles.loadingText}>Loading verification records...</Text>
        </View>
      ) : filteredCases.length === 0 ? (
        <View style={styles.emptyStateBox}>
          <Inbox size={32} color={colors.mutedText} />
          <Text style={styles.emptyTitle}>No verification records yet.</Text>
          <Text style={styles.emptySub}>
            {searchQuery
              ? 'No matching cases found for your search.'
              : 'Screen a passport to create your first database case.'}
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
    marginBottom: spacing.lg,
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

export default CasesListScreen;
