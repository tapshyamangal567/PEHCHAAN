import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppLogo } from '../ui/AppLogo';
import { Avatar } from '../ui/Avatar';
import { NetworkStatusIndicator } from '../ui/NetworkStatusIndicator';
import { colors, typography, spacing, shadows, radius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { Menu, Shield, UserCheck, ChevronRight } from 'lucide-react-native';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  showLogo?: boolean;
  onOpenDrawer?: () => void;
  showDrawerButton?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  breadcrumb,
  showLogo = true,
  onOpenDrawer,
  showDrawerButton = false,
}) => {
  const navigation = useNavigation<any>();
  const { user, role } = useAuthStore();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const displayName = user?.name || user?.username || (role === 'SUPERVISOR' ? 'Supervisor' : 'Officer');
  const roleLabel = role === 'SUPERVISOR' ? 'SUPERVISOR' : 'OFFICER';
  const badgeId = user?.badgeId || user?.username || (role === 'SUPERVISOR' ? 'IND-SUP-1090' : 'IND-SEC-8842');
  const checkpoint = user?.checkpoint || 'Checkpoint Alpha';

  return (
    <View style={styles.headerRoot}>
      <View style={styles.headerInner}>
        {/* Left Section: Logo or Drawer Toggle + Breadcrumb/Title */}
        <View style={styles.leftSection}>
          {showDrawerButton && (
            <TouchableOpacity
              onPress={onOpenDrawer}
              style={styles.drawerButton}
              accessibilityRole="button"
              accessibilityLabel="Open Navigation Menu"
            >
              <Menu size={22} color={colors.primaryNavy} />
            </TouchableOpacity>
          )}

          {showLogo ? (
            <AppLogo size="sm" variant="horizontal" showTagline={!isMobile} />
          ) : (
            <View style={styles.titleColumn}>
              {breadcrumb && (
                <View style={styles.breadcrumbRow}>
                  <Text style={styles.breadcrumbText}>PEHCHAAN</Text>
                  <ChevronRight size={12} color={colors.mutedText} />
                  <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>
                    {breadcrumb}
                  </Text>
                </View>
              )}
              {title && (
                <Text style={styles.pageTitle} numberOfLines={1}>
                  {title}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Right Section: Status Pill + User Info + Avatar */}
        <View style={styles.rightSection}>
          {/* Network / Security Indicator (Cleanly embedded in flex row, zero overlap) */}
          <View style={styles.statusPillContainer}>
            <NetworkStatusIndicator showLabel={!isMobile} />
          </View>

          {/* User Details on Tablet & Desktop */}
          {!isMobile && (
            <View style={styles.userInfoColumn}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <View style={[styles.roleBadge, role === 'SUPERVISOR' ? styles.supBadge : styles.offBadge]}>
                  {role === 'SUPERVISOR' ? (
                    <UserCheck size={10} color={colors.primaryNavy} />
                  ) : (
                    <Shield size={10} color={colors.primaryNavy} />
                  )}
                  <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                </View>
              </View>
              <Text style={styles.userSubtitle} numberOfLines={1}>
                {checkpoint} • {badgeId}
              </Text>
            </View>
          )}

          {/* Profile Avatar Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            accessibilityRole="button"
            accessibilityLabel="View User Profile"
            style={styles.avatarButton}
            activeOpacity={0.8}
          >
            <Avatar name={displayName} size={isMobile ? 36 : 40} showOnlineStatus />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    width: '100%',
    zIndex: 10,
    ...shadows.soft,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
  },
  drawerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  breadcrumbText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    fontWeight: '600',
  },
  breadcrumbActive: {
    color: colors.secondaryNavy,
  },
  pageTitle: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 0,
  },
  statusPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    maxWidth: 160,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  offBadge: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  supBadge: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  roleBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryNavy,
    letterSpacing: 0.4,
  },
  userSubtitle: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
  },
  avatarButton: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
});

export default AppHeader;
