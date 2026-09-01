import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle, CheckCircle2, UserCheck } from 'lucide-react-native';
import { FaceMatchResult } from '../../../services/faceVerificationService';
import { colors, typography, radius, shadows } from '../../../theme';

interface FaceVerificationCardProps {
  result: FaceMatchResult;
}

export const FaceVerificationCard: React.FC<FaceVerificationCardProps> = ({ result }) => {
  const isStrong = result.status === 'STRONG_MATCH';
  const isPossible = result.status === 'POSSIBLE_MATCH';
  const isLow = result.status === 'LOW_SIMILARITY';

  const badgeConfig = isStrong
    ? {
        label: 'STRONG MATCH',
        icon: <ShieldCheck size={16} color="#059669" />,
        bgColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        textColor: '#065F46',
        scoreColor: '#059669',
      }
    : isPossible
    ? {
        label: 'POSSIBLE MATCH',
        icon: <AlertTriangle size={16} color="#D97706" />,
        bgColor: '#FFFBEB',
        borderColor: '#FDE68A',
        textColor: '#92400E',
        scoreColor: '#D97706',
      }
    : isLow
    ? {
        label: 'LOW SIMILARITY',
        icon: <XCircle size={16} color="#DC2626" />,
        bgColor: '#FEF2F2',
        borderColor: '#FECACA',
        textColor: '#991B1B',
        scoreColor: '#DC2626',
      }
    : {
        label: 'NOT VERIFIED',
        icon: <HelpCircle size={16} color="#64748B" />,
        bgColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        textColor: '#475569',
        scoreColor: '#64748B',
      };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <UserCheck size={18} color={colors.primaryNavy} />
          <Text style={styles.sectionTitle}>IDENTITY VERIFICATION</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: badgeConfig.bgColor, borderColor: badgeConfig.borderColor },
          ]}
        >
          {badgeConfig.icon}
          <Text style={[styles.statusBadgeText, { color: badgeConfig.textColor }]}>
            {badgeConfig.label}
          </Text>
        </View>
      </View>

      {/* Similarity Score Display */}
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: badgeConfig.scoreColor }]}>
          {Math.round(result.similarity_score)}%
        </Text>
        <Text style={styles.scoreSubtitle}>Similarity Score (Decision Support)</Text>
      </View>

      {/* Diagnostic Details */}
      <View style={styles.diagnosticsContainer}>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Reference Source</Text>
          <Text style={styles.diagValue}>Passport Portrait</Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Live Capture</Text>
          <View style={styles.checkBadge}>
            <CheckCircle2 size={13} color="#059669" />
            <Text style={styles.checkText}>Accepted</Text>
          </View>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Face Detection</Text>
          <Text style={styles.diagValue}>
            {result.live_face_detected ? '1 Face Detected' : 'No Face Detected'}
          </Text>
        </View>
        <View style={styles.diagRow}>
          <Text style={styles.diagLabel}>Image Quality</Text>
          <Text style={styles.diagValue}>{result.quality || 'Good'}</Text>
        </View>
      </View>

      {/* Reason / Recommendation Banner */}
      <View
        style={[
          styles.recommendationBox,
          { backgroundColor: badgeConfig.bgColor, borderColor: badgeConfig.borderColor },
        ]}
      >
        <Text style={[styles.recommendationTitle, { color: badgeConfig.textColor }]}>
          Officer Recommendation:
        </Text>
        <Text style={[styles.recommendationText, { color: badgeConfig.textColor }]}>
          {result.recommendation || result.reason}
        </Text>
      </View>

      {/* Model Version Tag */}
      <View style={styles.footerRow}>
        <Text style={styles.modelVersionText}>Model: {result.model_version}</Text>
        <Text style={styles.timestampText}>
          {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
    ...shadows.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.h2.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryNavy,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  scoreValue: {
    fontFamily: typography.h1.fontFamily,
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  diagnosticsContainer: {
    gap: 8,
    marginBottom: 14,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diagLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    color: '#64748B',
  },
  diagValue: {
    fontFamily: typography.label.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  checkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  recommendationBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontFamily: typography.label.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  recommendationText: {
    fontFamily: typography.body.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  modelVersionText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
  },
  timestampText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: '#94A3B8',
  },
});

export default FaceVerificationCard;
