import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Wifi, WifiOff, AlertCircle, CheckCircle2, RefreshCw, Layers, X } from 'lucide-react-native';
import { useNetworkStore, ConnectivityStatus } from '../../services/networkService';
import { useSyncStore } from '../../services/offline/syncService';
import { colors, typography, radius, shadows, spacing } from '../../theme';

interface NetworkStatusIndicatorProps {
  showLabel?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ showLabel = true }) => {
  const navigation = useNavigation<any>();
  const { status, isBackendReachable, checkConnectivity, lastChecked } = useNetworkStore();
  const { stats, syncAllPending, isSyncing } = useSyncStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  const isOnline = status === 'ONLINE';
  const isLimited = status === 'LIMITED';
  const isOffline = status === 'OFFLINE';

  const config = isOnline
    ? {
        label: 'Online',
        dotColor: '#10B981',
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        textColor: '#065F46',
        icon: <Wifi size={13} color="#059669" />,
      }
    : isLimited
    ? {
        label: 'Limited Connectivity',
        dotColor: '#F59E0B',
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        textColor: '#92400E',
        icon: <AlertCircle size={13} color="#D97706" />,
      }
    : {
        label: 'Offline',
        dotColor: '#EF4444',
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        textColor: '#991B1B',
        icon: <WifiOff size={13} color="#DC2626" />,
      };

  const handleTestConnection = async () => {
    setChecking(true);
    await checkConnectivity();
    if (status === 'ONLINE') {
      await syncAllPending();
    }
    setChecking(false);
  };

  const handleOpenOfflineQueue = () => {
    setModalVisible(false);
    navigation.navigate('OfflineSync');
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.statusPill,
          { backgroundColor: config.bgColor, borderColor: config.borderColor },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Network Status: ${config.label}`}
      >
        <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
        {showLabel && (
          <Text style={[styles.statusText, { color: config.textColor }]}>
            {config.label}
          </Text>
        )}
      </TouchableOpacity>

      {/* Connection Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleRow}>
                    {config.icon}
                    <Text style={styles.modalTitle}>Connection Status</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeBtn}
                  >
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* Status Banner */}
                <View
                  style={[
                    styles.statusBanner,
                    { backgroundColor: config.bgColor, borderColor: config.borderColor },
                  ]}
                >
                  <Text style={[styles.bannerStatus, { color: config.textColor }]}>
                    Status: {config.label}
                  </Text>
                  <Text style={[styles.bannerSubtext, { color: config.textColor }]}>
                    Server: {isBackendReachable ? 'Available' : 'Unavailable'}
                  </Text>
                </View>

                {/* Capabilities Checklist */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeading}>Offline capabilities:</Text>
                  <View style={styles.capItem}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.capText}>Document capture</Text>
                  </View>
                  <View style={styles.capItem}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.capText}>Local MRZ validation</Text>
                  </View>
                  <View style={styles.capItem}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.capText}>Temporary encrypted case storage</Text>
                  </View>
                </View>

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeading}>Requires connection:</Text>
                  <View style={styles.reqItem}>
                    <Text style={styles.reqBullet}>•</Text>
                    <Text style={styles.reqText}>Server deep-learning verification</Text>
                  </View>
                  <View style={styles.reqItem}>
                    <Text style={styles.reqBullet}>•</Text>
                    <Text style={styles.reqText}>Database synchronization</Text>
                  </View>
                  <View style={styles.reqItem}>
                    <Text style={styles.reqBullet}>•</Text>
                    <Text style={styles.reqText}>Supervisor audit trail</Text>
                  </View>
                </View>

                {/* Pending Cases Badge */}
                {stats.pending > 0 && (
                  <View style={styles.pendingQueueNotice}>
                    <Layers size={15} color="#D97706" />
                    <Text style={styles.pendingQueueText}>
                      {stats.pending} {stats.pending === 1 ? 'case' : 'cases'} waiting to synchronize
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.testBtn}
                    onPress={handleTestConnection}
                    disabled={checking}
                  >
                    {checking ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <RefreshCw size={15} color="#FFFFFF" />
                        <Text style={styles.testBtnText}>Test Connection</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.queueBtn}
                    onPress={handleOpenOfflineQueue}
                  >
                    <Text style={styles.queueBtnText}>View Offline Cases</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    padding: 20,
    ...shadows.soft,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  closeBtn: {
    padding: 4,
  },
  statusBanner: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  bannerStatus: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerSubtext: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
  },
  sectionContainer: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  capItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  capText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#1E293B',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  reqBullet: {
    fontSize: 14,
    color: '#94A3B8',
    width: 14,
  },
  reqText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
  },
  pendingQueueNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  pendingQueueText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  modalActions: {
    gap: 8,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: colors.primaryNavy,
    borderRadius: radius.md,
  },
  testBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  queueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.md,
  },
  queueBtnText: {
    fontFamily: typography.button.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
});

export default NetworkStatusIndicator;
