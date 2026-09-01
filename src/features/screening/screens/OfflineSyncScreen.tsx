import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
  ShieldCheck,
  FileText,
} from 'lucide-react-native';
import { useNetworkStore } from '../../../services/networkService';
import { useSyncStore } from '../../../services/offline/syncService';
import { OfflineStorageService, OfflineCase } from '../../../services/offline/offlineStorageService';
import { colors, typography, radius, shadows, spacing } from '../../../theme';

export const OfflineSyncScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { status, checkConnectivity } = useNetworkStore();
  const { isSyncing, stats, syncAllPending, refreshStats, lastSyncTime } = useSyncStore();

  const [cases, setCases] = useState<OfflineCase[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    await refreshStats();
    const allCases = await OfflineStorageService.getAllCases();
    setCases(allCases);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkConnectivity();
    await loadData();
    setRefreshing(false);
  };

  const handleSyncNow = async () => {
    await checkConnectivity();
    await syncAllPending();
    await loadData();
  };

  const renderCaseCard = ({ item }: { item: OfflineCase }) => {
    const isPending = item.sync_status === 'PENDING';
    const isSyncingCase = item.sync_status === 'SYNCING';
    const isSynced = item.sync_status === 'SYNCED';
    const isFailed = item.sync_status === 'FAILED';

    return (
      <View style={styles.caseCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.caseIdRow}>
            <Layers size={16} color={colors.primaryNavy} />
            <Text style={styles.caseIdText}>{item.local_case_id}</Text>
          </View>
          <View
            style={[
              styles.syncBadge,
              isSynced
                ? styles.syncBadgeSuccess
                : isPending
                ? styles.syncBadgePending
                : isSyncingCase
                ? styles.syncBadgeSyncing
                : styles.syncBadgeFailed,
            ]}
          >
            {isSynced ? (
              <CheckCircle2 size={12} color="#059669" />
            ) : isPending ? (
              <Clock size={12} color="#D97706" />
            ) : isSyncingCase ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <AlertCircle size={12} color="#DC2626" />
            )}
            <Text
              style={[
                styles.syncBadgeText,
                isSynced
                  ? styles.syncTextSuccess
                  : isPending
                  ? styles.syncTextPending
                  : isSyncingCase
                  ? styles.syncTextSyncing
                  : styles.syncTextFailed,
              ]}
            >
              {isSynced
                ? 'SYNCED'
                : isPending
                ? 'WAITING FOR SYNC'
                : isSyncingCase
                ? 'SYNCING...'
                : 'SYNC FAILED'}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <Text style={styles.caseDateText}>
          Captured: {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
          {new Date(item.created_at).toLocaleDateString()}
        </Text>

        {/* Offline Checks Breakdown */}
        <View style={styles.checksContainer}>
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>MRZ Status</Text>
            <View style={styles.checkValueRow}>
              {item.mrz_result?.checksum_valid ? (
                <>
                  <CheckCircle2 size={13} color="#059669" />
                  <Text style={styles.checkPassText}>Verified Locally</Text>
                </>
              ) : (
                <>
                  <AlertCircle size={13} color="#D97706" />
                  <Text style={styles.checkWarnText}>Local Check Inconclusive</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>OCR Extraction</Text>
            <Text style={styles.checkQueuedText}>
              {isSynced ? 'Server OCR Complete' : 'Queued for Server OCR'}
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Identity Verification</Text>
            <Text style={styles.checkQueuedText}>
              {isSynced ? 'Evaluated by Server' : 'Pending Server Sync'}
            </Text>
          </View>
        </View>

        {/* Failure reason if any */}
        {isFailed && item.last_sync_error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={13} color="#DC2626" />
            <Text style={styles.errorText}>
              {item.last_sync_error} (Retries: {item.retry_count})
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.primaryNavy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline & Synchronization</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={cases}
        keyExtractor={(item) => item.local_case_id}
        renderItem={renderCaseCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          <>
            {/* Network Status Card */}
            <View style={styles.networkStatusCard}>
              <View style={styles.statusRow}>
                {status === 'ONLINE' ? (
                  <Wifi size={20} color="#059669" />
                ) : (
                  <WifiOff size={20} color="#D97706" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>
                    {status === 'ONLINE'
                      ? 'Online Mode'
                      : status === 'LIMITED'
                      ? 'Limited Connectivity'
                      : 'Offline Mode'}
                  </Text>
                  <Text style={styles.statusSub}>
                    {status === 'ONLINE'
                      ? 'Backend reachable. Ready to synchronize cases.'
                      : 'Cases will be stored securely on-device until network returns.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Queue Stats Summary */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending Sync</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.syncing}</Text>
                <Text style={styles.statLabel}>Syncing</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: '#059669' }]}>{stats.synced}</Text>
                <Text style={styles.statLabel}>Synced</Text>
              </View>
            </View>

            {/* Sync Now Button */}
            <TouchableOpacity
              style={[
                styles.syncNowBtn,
                (isSyncing || status === 'OFFLINE') && styles.syncNowBtnDisabled,
              ]}
              onPress={handleSyncNow}
              disabled={isSyncing || status === 'OFFLINE'}
              activeOpacity={0.85}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.syncNowBtnText}>
                    {status === 'OFFLINE' ? 'Waiting for Network' : 'Sync Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>QUEUED CASES</Text>
              <Text style={styles.sectionHeaderCount}>{cases.length} Total</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShieldCheck size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Offline Cases</Text>
            <Text style={styles.emptySub}>
              Documents captured while offline will appear here in the secure queue.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  networkStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    ...shadows.soft,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  statusSub: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.soft,
  },
  statValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
    marginBottom: 20,
    ...shadows.soft,
  },
  syncNowBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  syncNowBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  sectionHeaderCount: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#94A3B8',
  },
  caseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  caseIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseIdText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  syncBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  syncTextPending: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeSyncing: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  syncTextSyncing: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  syncTextSuccess: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  syncTextFailed: {
    color: '#991B1B',
    fontSize: 11,
    fontWeight: '700',
  },
  caseDateText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  checksContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: 10,
    gap: 6,
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
  },
  checkValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkPassText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  checkWarnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  checkQueuedText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.sm,
    padding: 8,
    marginTop: 10,
  },
  errorText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#DC2626',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  emptySub: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 260,
  },
});

export default OfflineSyncScreen;
