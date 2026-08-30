import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { OfficerTabParamList } from './types';
import { OfficerDashboardScreen } from '../features/officer/screens/OfficerDashboardScreen';
import { PassportUploadScreen } from '../features/screening/screens/PassportUploadScreen';
import { CasesListScreen } from '../features/officer/screens/CasesListScreen';
import { AlertsListScreen } from '../features/officer/screens/AlertsListScreen';
import { OfficerProfileScreen } from '../features/officer/screens/OfficerProfileScreen';
import { colors, typography, shadows, radius } from '../theme';
import { Shield, ScanLine, FileText, Bell, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator<OfficerTabParamList>();

export const OfficerTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryNavy,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      {/* 1. Home Tab */}
      <Tab.Screen
        name="Home"
        component={OfficerDashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Shield size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 2. Scan Tab (Primary Highlighted Action) */}
      <Tab.Screen
        name="Scan"
        component={PassportUploadScreen}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.scanIconWrapper, focused && styles.scanIconWrapperActive]}>
              <ScanLine size={22} color={colors.white} />
            </View>
          ),
        }}
      />

      {/* 3. Cases Tab */}
      <Tab.Screen
        name="Cases"
        component={CasesListScreen}
        options={{
          tabBarLabel: 'Cases',
          tabBarIcon: ({ color, size, focused }) => (
            <FileText size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 4. Alerts Tab */}
      <Tab.Screen
        name="Alerts"
        component={AlertsListScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size, focused }) => (
            <Bell size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 5. Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={OfficerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <User size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    ...shadows.soft,
  },
  tabBarLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  scanIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryNavy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
    ...shadows.soft,
  },
  scanIconWrapperActive: {
    backgroundColor: colors.secondaryNavy,
    transform: [{ scale: 1.05 }],
  },
});

export default OfficerTabNavigator;
