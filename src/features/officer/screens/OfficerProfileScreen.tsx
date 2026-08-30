import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/navigation/ScreenContainer';
import { SectionHeader } from '../../../components/navigation/SectionHeader';
import { PremiumCard } from '../../../components/cards/PremiumCard';
import { Avatar } from '../../../components/ui/Avatar';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { Divider } from '../../../components/ui/Divider';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors, typography, spacing, radius } from '../../../theme';
import { useAuthStore } from '../../../store/useAuthStore';
import { LogOut, Shield, MapPin, BadgeCheck, Mail } from 'lucide-react-native';

export const OfficerProfileScreen = () => {
  const { user, logout } = useAuthStore();

  return (
    <ScreenContainer scrollable>
      <SectionHeader title="Officer Profile" subtitle="Field Security Credentials" />

      <PremiumCard style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <Avatar name={user?.name || 'Arjun Mehta'} size={64} />
          <View style={styles.userMetaColumn}>
            <Text style={typography.h2}>{user?.name || 'Arjun Mehta'}</Text>
            <Text style={typography.subtitle}>{user?.role || 'OFFICER'}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge status="ACTIVE" size="sm" />
            </View>
          </View>
        </View>

        <Divider marginVertical={spacing.lg} />

        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <BadgeCheck size={18} color={colors.primaryRose} />
          </View>
          <View style={styles.detailTextColumn}>
            <Text style={typography.caption}>BADGE ID</Text>
            <Text style={[typography.bodyMedium, styles.detailValue]}>
              {user?.badgeId || 'IND-SEC-8842'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <MapPin size={18} color={colors.primaryRose} />
          </View>
          <View style={styles.detailTextColumn}>
            <Text style={typography.caption}>CHECKPOINT</Text>
            <Text style={[typography.bodyMedium, styles.detailValue]}>
              {user?.checkpoint || 'Checkpoint Alpha'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconBox}>
            <Mail size={18} color={colors.primaryRose} />
          </View>
          <View style={styles.detailTextColumn}>
            <Text style={typography.caption}>GOVERNMENT EMAIL</Text>
            <Text style={[typography.bodyMedium, styles.detailValue]}>
              {user?.email || 'arjun.mehta@border.pehchaan.gov.in'}
            </Text>
          </View>
        </View>

        <Divider marginVertical={spacing.xl} />

        <PrimaryButton
          title="Sign Out"
          onPress={logout}
          icon={<LogOut size={18} color={colors.white} />}
        />
      </PremiumCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxxl * 2,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  userMetaColumn: {
    flex: 1,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.softRoseBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTextColumn: {
    flex: 1,
  },
  detailValue: {
    color: colors.primaryText,
    marginTop: 1,
  },
});

export default OfficerProfileScreen;
