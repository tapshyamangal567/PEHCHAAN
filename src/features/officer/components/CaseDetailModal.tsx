import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { OfficerCase } from '../data/mockOfficerData';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { Divider } from '../../../components/ui/Divider';
import { colors, typography, spacing, radius, shadows } from '../../../theme';
import { ShieldCheck, ShieldAlert, UserCheck, X } from 'lucide-react-native';

interface CaseDetailModalProps {
  caseData: OfficerCase | null;
  visible: boolean;
  onClose: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseData,
  visible,
  onClose,
}) => {
  if (!caseData) return null;

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
              <Text style={typography.label}>CASE RECORD</Text>
              <Text style={[typography.h3, styles.caseIdText]}>{caseData.caseId}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={colors.primaryText} />
            </Pressable>
          </View>

          <Divider marginVertical={spacing.md} />

          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <Text style={typography.caption}>HOLDER NAME</Text>
              <Text style={[typography.bodyMedium, styles.infoValue]}>{caseData.holderName}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={typography.caption}>NATIONALITY</Text>
              <Text style={[typography.bodyMedium, styles.infoValue]}>{caseData.nationality}</Text>
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
              <Text style={typography.caption}>TIMESTAMP</Text>
              <Text style={[typography.bodyMedium, styles.infoValue]}>{caseData.timestamp}</Text>
            </View>
          </View>

          <Divider marginVertical={spacing.md} />

          <View style={styles.scoreRow}>
            <View style={styles.badgeColumn}>
              <Text style={[typography.caption, styles.badgeLabel]}>RISK SCORE</Text>
              <RiskBadge level={caseData.riskLevel} score={caseData.riskScore} />
            </View>
            <View style={styles.badgeColumn}>
              <Text style={[typography.caption, styles.badgeLabel]}>SYSTEM STATUS</Text>
              <StatusBadge status={caseData.status} />
            </View>
          </View>

          <Divider marginVertical={spacing.lg} />

          <PrimaryButton title="Close Record" onPress={onClose} />
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
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeColumn: {
    gap: spacing.xs,
  },
  badgeLabel: {
    marginBottom: 2,
  },
});

export default CaseDetailModal;
