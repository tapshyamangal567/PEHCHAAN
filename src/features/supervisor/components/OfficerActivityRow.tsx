import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../../../components/ui/Avatar';
import { ActiveOfficerItem } from '../data/mockSupervisorData';
import { colors, typography, spacing, radius } from '../../../theme';

interface OfficerActivityRowProps {
  officer: ActiveOfficerItem;
}

export const OfficerActivityRow: React.FC<OfficerActivityRowProps> = ({ officer }) => {
  return (
    <View style={styles.row}>
      <Avatar
        name={officer.name}
        size={38}
        showOnlineStatus={officer.status === 'ACTIVE'}
      />

      <View style={styles.contentColumn}>
        <Text style={[typography.bodyMedium, styles.nameText]}>{officer.name}</Text>
        <Text style={[typography.caption, styles.subText]}>
          Badge: {officer.badgeId} • Active {officer.lastActive}
        </Text>
      </View>

      <View style={styles.countBadge}>
        <Text style={[typography.caption, styles.countText]}>
          {officer.screeningsToday} screenings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  contentColumn: {
    flex: 1,
  },
  nameText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  subText: {
    color: colors.mutedText,
    marginTop: 1,
  },
  countBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    color: colors.secondaryText,
    fontWeight: '600',
    fontSize: 12,
  },
});

export default OfficerActivityRow;
