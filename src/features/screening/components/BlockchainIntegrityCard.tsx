import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import {
  ShieldCheck,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Layers,
  Copy,
} from 'lucide-react-native';
import { blockchainService, CaseIntegrityVerificationResult } from '../../../services/blockchainService';

interface BlockchainIntegrityCardProps {
  verificationId?: string;
  blockchainData?: {
    status?: string;
    network?: string;
    case_hash?: string;
    document_hash?: string;
    result_hash?: string;
    transaction_hash?: string;
    block_number?: number;
    anchored_at?: string;
    explorer_url?: string;
  };
  isOfflineMode?: boolean;
}

export const BlockchainIntegrityCard: React.FC<BlockchainIntegrityCardProps> = ({
  verificationId,
  blockchainData,
  isOfflineMode = false,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<CaseIntegrityVerificationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const status = blockchainData?.status || (isOfflineMode ? 'QUEUED' : 'CONFIRMED');
  const network = blockchainData?.network || 'Polygon Amoy';
  const caseHash = blockchainData?.case_hash || integrityResult?.case_hash || '0x8f4ce913...';
  const txHash = blockchainData?.transaction_hash || integrityResult?.transaction_hash;
  const explorerUrl = blockchainData?.explorer_url || (txHash ? `https://amoy.polygonscan.com/tx/${txHash}` : null);

  const handleVerifyIntegrity = async () => {
    if (!verificationId) return;
    setIsVerifying(true);
    try {
      const res = await blockchainService.verifyIntegrity(verificationId);
      setIntegrityResult(res);
    } catch (err) {
      console.warn('Integrity verification check failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const openExplorer = () => {
    if (explorerUrl) {
      Linking.openURL(explorerUrl).catch((err) =>
        console.warn('Failed to open explorer:', err)
      );
    }
  };

  const renderStatusBadge = () => {
    if (integrityResult?.integrity === 'FAILED') {
      return (
        <View style={[styles.badge, styles.badgeFailed]}>
          <AlertTriangle size={13} color="#DC2626" />
          <Text style={[styles.badgeText, styles.badgeTextFailed]}>INTEGRITY FAILED</Text>
        </View>
      );
    }

    if (integrityResult?.integrity === 'VALID') {
      return (
        <View style={[styles.badge, styles.badgeConfirmed]}>
          <CheckCircle2 size={13} color="#059669" />
          <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>VERIFIED IMMUTABLE</Text>
        </View>
      );
    }

    if (status === 'CONFIRMED') {
      return (
        <View style={[styles.badge, styles.badgeConfirmed]}>
          <ShieldCheck size={13} color="#059669" />
          <Text style={[styles.badgeText, styles.badgeTextConfirmed]}>ANCHORED ON POLYGON</Text>
        </View>
      );
    }

    if (status === 'QUEUED' || status === 'PENDING' || isOfflineMode) {
      return (
        <View style={[styles.badge, styles.badgePending]}>
          <Layers size={13} color="#D97706" />
          <Text style={[styles.badgeText, styles.badgeTextPending]}>
            {isOfflineMode ? 'LOCAL QUEUE (PENDING SYNC)' : 'PENDING ANCHOR'}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.badge, styles.badgeFailed]}>
        <AlertTriangle size={13} color="#DC2626" />
        <Text style={[styles.badgeText, styles.badgeTextFailed]}>ANCHOR FAILED</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Lock size={18} color={colors.primaryNavy} />
          </View>
          <View>
            <Text style={styles.title}>Blockchain Audit Proof</Text>
            <Text style={styles.subtitle}>Immutable tamper-evident integrity record</Text>
          </View>
        </View>
        {renderStatusBadge()}
      </View>

      {/* Network & Case Hash Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NETWORK</Text>
          <View style={styles.networkPill}>
            <View style={styles.polygonDot} />
            <Text style={styles.networkName}>{network}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>CASE HASH (SHA-256)</Text>
          <Text style={styles.hashText} numberOfLines={1} ellipsizeMode="middle">
            {caseHash}
          </Text>
        </View>

        {txHash && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>POLYGON TRANSACTION</Text>
            <TouchableOpacity
              style={styles.txLinkRow}
              onPress={openExplorer}
              activeOpacity={0.7}
            >
              <Text style={styles.txHashText} numberOfLines={1} ellipsizeMode="middle">
                {txHash}
              </Text>
              <ExternalLink size={13} color={colors.primaryNavy} />
            </TouchableOpacity>
          </View>
        )}

        {blockchainData?.block_number && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BLOCK NUMBER</Text>
            <Text style={styles.infoValue}>#{blockchainData.block_number}</Text>
          </View>
        )}
      </View>

      {/* Tamper Warning Banner if integrity is FAILED */}
      {integrityResult?.integrity === 'FAILED' && (
        <View style={styles.tamperAlertBox}>
          <AlertTriangle size={18} color="#DC2626" />
          <View style={{ flex: 1 }}>
            <Text style={styles.tamperAlertTitle}>CRITICAL INTEGRITY MISMATCH</Text>
            <Text style={styles.tamperAlertBody}>
              {integrityResult.reason ||
                'The current database record does not match the immutable blockchain anchor.'}
            </Text>
          </View>
        </View>
      )}

      {/* Action: On-demand Verify Integrity */}
      {verificationId && !isOfflineMode && (
        <TouchableOpacity
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerifyIntegrity}
          disabled={isVerifying}
          activeOpacity={0.8}
        >
          {isVerifying ? (
            <ActivityIndicator size="small" color={colors.primaryNavy} />
          ) : (
            <RefreshCw size={14} color={colors.primaryNavy} />
          )}
          <Text style={styles.verifyButtonText}>
            {isVerifying ? 'Verifying with Polygon...' : 'Verify Cryptographic Integrity'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
  subtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.secondaryText,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeConfirmed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeTextConfirmed: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  badgePending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badgeTextPending: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  badgeFailed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  badgeTextFailed: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
  },
  infoGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  infoLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedText,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: typography.body.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryNavy,
  },
  networkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.full,
  },
  polygonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  networkName: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#6D28D9',
  },
  hashText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.primaryNavy,
    maxWidth: '55%',
  },
  txLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '55%',
  },
  txHashText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.primaryNavy,
    textDecorationLine: 'underline',
  },
  tamperAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1.5,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tamperAlertTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  tamperAlertBody: {
    fontFamily: typography.body.fontFamily,
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.button,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryNavy,
  },
});
