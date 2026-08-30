import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ScalePressable } from '../../../utils/animations';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { colors, typography, spacing, radius } from '../../../theme';
import { PendingAlert } from '../data/mockOfficerData';
import { ChevronRight, AlertTriangle } from 'lucide-react-native';

interface AlertItemCardProps {
  alert: PendingAlert;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AlertItemCard: React.FC<AlertItemCardProps> = ({
  alert,
  onPress,
  style,
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      activeScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`Alert ${alert.caseId}: ${alert.title}`}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <RiskBadge level={alert.riskLevel} showDot={false} />
        <Text style={[typography.caption, styles.timeText]}>{alert.timestamp}</Text>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.iconBox}>
          <AlertTriangle
            size={18}
            color={alert.riskLevel === 'HIGH' ? colors.danger : colors.warning}
          />
        </View>
        <View style={styles.contentColumn}>
          <Text style={[typography.bodyMedium, styles.titleText]} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={[typography.caption, styles.caseText]}>
            {alert.caseId} • {alert.passportNumber || 'N/A'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.mutedText} />
      </View>
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  timeText: {
    color: colors.mutedText,
    fontSize: 11,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
  },
  titleText: {
    color: colors.primaryText,
    fontSize: 14,
  },
  caseText: {
    color: colors.secondaryText,
    marginTop: 1,
  },
});

export default AlertItemCard;
