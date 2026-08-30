import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Alert } from 'react-native';
import { SupervisorReviewCase } from '../data/mockSupervisorData';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { Divider } from '../../../components/ui/Divider';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { CheckCircle2, XCircle, AlertTriangle, RotateCcw, X } from 'lucide-react-native';

interface SupervisorReviewModalProps {
  caseData: SupervisorReviewCase | null;
  visible: boolean;
  onClose: () => void;
  onDecision: (decision: string, caseId: string) => void;
}

export const SupervisorReviewModal: React.FC<SupervisorReviewModalProps> = ({
  caseData,
  visible,
  onClose,
  onDecision,
}) => {
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  if (!caseData) return null;

  const handleAction = (actionTitle: string) => {
    setDecisionFeedback(`Case ${caseData.caseId} has been marked as ${actionTitle}.`);
    setTimeout(() => {
      setDecisionFeedback(null);
      onDecision(actionTitle, caseData.caseId);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.contentCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <Text style={typography.label}>SUPERVISOR REVIEW</Text>
              <Text style={[typography.h3, styles.caseIdText]}>{caseData.caseId}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.primaryText} />
            </Pressable>
          </View>

          {decisionFeedback ? (
            <View style={styles.feedbackContainer}>
              <CheckCircle2 size={40} color={colors.success} />
              <Text style={[typography.h3, styles.feedbackText]}>
                {decisionFeedback}
              </Text>
            </View>
          ) : (
            <>
              <Divider marginVertical={spacing.md} />

              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Text style={typography.caption}>HOLDER NAME</Text>
                  <Text style={[typography.bodyMedium, styles.infoValue]}>
                    {caseData.holderName}
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={typography.caption}>SUBMITTED BY</Text>
                  <Text style={[typography.bodyMedium, styles.infoValue]}>
                    Officer {caseData.officerName}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <Text style={typography.caption}>DOCUMENT</Text>
                  <Text style={[typography.bodyMedium, styles.infoValue]}>
                    {caseData.documentType} ({caseData.passportNumber})
                  </Text>
                </View>
                <View style={styles.infoBox}>
                  <Text style={typography.caption}>RISK SCORE</Text>
                  <RiskBadge level={caseData.riskLevel} score={caseData.riskScore} />
                </View>
              </View>

              <View style={styles.reasonBox}>
                <Text style={typography.caption}>FLAGGED REASON</Text>
                <Text style={[typography.body, styles.reasonText]}>
                  {caseData.reason}
                </Text>
              </View>

              <Divider marginVertical={spacing.lg} />

              <Text style={[typography.label, styles.actionHeaderLabel]}>
                SUPERVISOR DECISION
              </Text>

              {/* 4 Decision Actions Grid */}
              <View style={styles.actionGrid}>
                {/* 1. Approve */}
                <SecondaryButton
                  title="Approve"
                  onPress={() => handleAction('Approved')}
                  icon={<CheckCircle2 size={16} color={colors.success} />}
                  style={styles.approveBtn}
                  textStyle={{ color: colors.success, fontWeight: '600' }}
                />

                {/* 2. Reject */}
                <SecondaryButton
                  title="Reject"
                  onPress={() => handleAction('Rejected')}
                  icon={<XCircle size={16} color={colors.danger} />}
                  style={styles.rejectBtn}
                  textStyle={{ color: colors.danger, fontWeight: '600' }}
                />
              </View>

              <View style={styles.actionGrid}>
                {/* 3. Escalate */}
                <SecondaryButton
                  title="Escalate"
                  onPress={() => handleAction('Escalated')}
                  icon={<AlertTriangle size={16} color={colors.warning} />}
                  style={styles.escalateBtn}
                  textStyle={{ color: colors.secondaryText, fontWeight: '600' }}
                />

                {/* 4. Send Back */}
                <SecondaryButton
                  title="Send Back"
                  onPress={() => handleAction('Sent Back')}
                  icon={<RotateCcw size={16} color={colors.primaryRose} />}
                  textStyle={{ color: colors.primaryRose, fontWeight: '600' }}
                />
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    ...shadows.floating,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleColumn: {
    flex: 1,
  },
  caseIdText: {
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  infoBox: {
    flex: 1,
  },
  infoValue: {
    marginTop: 2,
    color: colors.primaryText,
  },
  reasonBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.input,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  reasonText: {
    marginTop: 4,
    color: colors.primaryText,
    fontSize: 13,
  },
  actionHeaderLabel: {
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  approveBtn: {
    backgroundColor: colors.successBg,
    borderColor: 'rgba(143, 174, 155, 0.4)',
  },
  rejectBtn: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(217, 122, 108, 0.4)',
  },
  escalateBtn: {
    backgroundColor: colors.warningBg,
    borderColor: 'rgba(224, 185, 106, 0.4)',
  },
  feedbackContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primaryText,
  },
});

export default SupervisorReviewModal;
