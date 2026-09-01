import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppLogo } from '../ui/AppLogo';
import { colors, typography, spacing, radius } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  ScanLine,
  FileCheck2,
  FileText,
  ClipboardList,
  Bell,
  Users,
  BarChart3,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  Shield,
  Layers,
  Settings,
} from 'lucide-react-native';

interface AppSidebarProps {
  currentRoute?: string;
  onNavigate?: (screen: string) => void;
  isMobileDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentRoute = 'Dashboard',
  onNavigate,
  isMobileDrawer = false,
  onCloseDrawer,
}) => {
  const navigation = useNavigation<any>();
  const { role, user, logout } = useAuthStore();

  // Collapsible dropdown state for navigation groups
  const [verificationExpanded, setVerificationExpanded] = useState(true);
  const [casesExpanded, setCasesExpanded] = useState(true);

  const handleNav = (screenName: string) => {
    if (onNavigate) {
      onNavigate(screenName);
    } else {
      navigation.navigate(screenName);
    }
    if (onCloseDrawer) {
      onCloseDrawer();
    }
  };

  const isOfficer = role === 'OFFICER';

  return (
    <View style={[styles.sidebarRoot, isMobileDrawer && styles.mobileDrawer]}>
      {/* 1. Header with PEHCHAAN Branding */}
      <View style={styles.brandingSection}>
        <AppLogo size="sm" variant="horizontal" showTagline={true} />
      </View>

      <ScrollView
        style={styles.navScrollView}
        contentContainerStyle={styles.navScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Group 1: Core Overview */}
        <View style={styles.navGroup}>
          <Text style={styles.groupHeaderLabel}>MAIN</Text>

          {/* Dashboard Item */}
          <TouchableOpacity
            style={[
              styles.navItem,
              (currentRoute === 'Dashboard' || currentRoute === 'Home' || currentRoute === 'Overview') &&
                styles.navItemActive,
            ]}
            onPress={() => handleNav(isOfficer ? 'Home' : 'Overview')}
            activeOpacity={0.75}
          >
            <LayoutDashboard
              size={18}
              color={
                currentRoute === 'Dashboard' || currentRoute === 'Home' || currentRoute === 'Overview'
                  ? colors.primaryNavy
                  : '#64748B'
              }
            />
            <Text
              style={[
                styles.navItemText,
                (currentRoute === 'Dashboard' || currentRoute === 'Home' || currentRoute === 'Overview') &&
                  styles.navItemTextActive,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Group 2: Verification Dropdown */}
        <View style={styles.navGroup}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setVerificationExpanded(!verificationExpanded)}
            activeOpacity={0.75}
          >
            <Text style={styles.groupHeaderLabel}>VERIFICATION</Text>
            {verificationExpanded ? (
              <ChevronDown size={14} color={colors.mutedText} />
            ) : (
              <ChevronRight size={14} color={colors.mutedText} />
            )}
          </TouchableOpacity>

          {verificationExpanded && (
            <View style={styles.subItemsContainer}>
              {/* Officer: New Verification */}
              {isOfficer && (
                <TouchableOpacity
                  style={[
                    styles.subNavItem,
                    currentRoute === 'PassportUpload' && styles.subNavItemActive,
                  ]}
                  onPress={() => handleNav('PassportUpload')}
                  activeOpacity={0.75}
                >
                  <ScanLine
                    size={16}
                    color={currentRoute === 'PassportUpload' ? colors.primaryNavy : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      currentRoute === 'PassportUpload' && styles.navItemTextActive,
                    ]}
                  >
                    New Verification
                  </Text>
                </TouchableOpacity>
              )}

              {/* Supervisor: Review Queue */}
              {!isOfficer && (
                <TouchableOpacity
                  style={[
                    styles.subNavItem,
                    currentRoute === 'Review Queue' && styles.subNavItemActive,
                  ]}
                  onPress={() => handleNav('Review Queue')}
                  activeOpacity={0.75}
                >
                  <ClipboardList
                    size={16}
                    color={currentRoute === 'Review Queue' ? colors.primaryNavy : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      currentRoute === 'Review Queue' && styles.navItemTextActive,
                    ]}
                  >
                    Review Queue
                  </Text>
                </TouchableOpacity>
              )}

              {/* Security Alerts */}
              <TouchableOpacity
                style={[
                  styles.subNavItem,
                  currentRoute === 'Alerts' && styles.subNavItemActive,
                ]}
                onPress={() => handleNav('Alerts')}
                activeOpacity={0.75}
              >
                <Bell
                  size={16}
                  color={currentRoute === 'Alerts' ? colors.danger : '#64748B'}
                />
                <Text
                  style={[
                    styles.navItemText,
                    currentRoute === 'Alerts' && styles.navItemTextActive,
                  ]}
                >
                  Security Alerts
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Navigation Group 3: Cases & Reports Dropdown */}
        <View style={styles.navGroup}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setCasesExpanded(!casesExpanded)}
            activeOpacity={0.75}
          >
            <Text style={styles.groupHeaderLabel}>CASES & REPORTS</Text>
            {casesExpanded ? (
              <ChevronDown size={14} color={colors.mutedText} />
            ) : (
              <ChevronRight size={14} color={colors.mutedText} />
            )}
          </TouchableOpacity>

          {casesExpanded && (
            <View style={styles.subItemsContainer}>
              {/* Screening Cases */}
              <TouchableOpacity
                style={[
                  styles.subNavItem,
                  currentRoute === 'Cases' && styles.subNavItemActive,
                ]}
                onPress={() => handleNav('Cases')}
                activeOpacity={0.75}
              >
                <FileCheck2
                  size={16}
                  color={currentRoute === 'Cases' ? colors.primaryNavy : '#64748B'}
                />
                <Text
                  style={[
                    styles.navItemText,
                    currentRoute === 'Cases' && styles.navItemTextActive,
                  ]}
                >
                  Screening Cases
                </Text>
              </TouchableOpacity>

              {/* Supervisor: Officer Activity */}
              {!isOfficer && (
                <TouchableOpacity
                  style={[
                    styles.subNavItem,
                    currentRoute === 'OfficerActivity' && styles.subNavItemActive,
                  ]}
                  onPress={() => handleNav('OfficerActivity')}
                  activeOpacity={0.75}
                >
                  <Users
                    size={16}
                    color={currentRoute === 'OfficerActivity' ? colors.primaryNavy : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.navItemText,
                      currentRoute === 'OfficerActivity' && styles.navItemTextActive,
                    ]}
                  >
                    Officer Operations
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Navigation Group 4: Account & Settings */}
        <View style={styles.navGroup}>
          <Text style={styles.groupHeaderLabel}>SYSTEM</Text>

          {/* User Profile */}
          <TouchableOpacity
            style={[
              styles.navItem,
              currentRoute === 'Profile' && styles.navItemActive,
            ]}
            onPress={() => handleNav('Profile')}
            activeOpacity={0.75}
          >
            <User
              size={18}
              color={currentRoute === 'Profile' ? colors.primaryNavy : '#64748B'}
            />
            <Text
              style={[
                styles.navItemText,
                currentRoute === 'Profile' && styles.navItemTextActive,
              ]}
            >
              Account & Profile
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer: User Badge & Logout */}
      <View style={styles.footerSection}>
        <View style={styles.userFootprint}>
          <View style={styles.userFootprintLeft}>
            <Shield size={16} color={colors.primaryNavy} />
            <View>
              <Text style={styles.footprintName} numberOfLines={1}>
                {user?.name || user?.username || 'Officer'}
              </Text>
              <Text style={styles.footprintRole}>
                {role} • {user?.checkpoint || 'Alpha'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.75}
        >
          <LogOut size={16} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarRoot: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
    flexDirection: 'column',
  },
  mobileDrawer: {
    width: 280,
  },
  brandingSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navScrollView: {
    flex: 1,
  },
  navScrollContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  navGroup: {
    gap: 4,
  },
  groupHeaderLabel: {
    fontFamily: typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navItemText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  navItemTextActive: {
    color: colors.primaryNavy,
    fontWeight: '700',
  },
  subItemsContainer: {
    marginLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 8,
    gap: 2,
    marginTop: 2,
  },
  subNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  },
  subNavItemActive: {
    backgroundColor: '#EFF6FF',
  },
  footerSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
    gap: spacing.sm,
  },
  userFootprint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userFootprintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  footprintName: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
  footprintRole: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 10,
    color: colors.mutedText,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingVertical: 8,
  },
  logoutBtnText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
});

export default AppSidebar;
