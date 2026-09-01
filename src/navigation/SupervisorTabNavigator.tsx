import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SupervisorTabParamList } from './types';
import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen';
import { ReviewQueueScreen } from '../features/supervisor/screens/ReviewQueueScreen';
import { SupervisorAlertsScreen } from '../features/supervisor/screens/SupervisorAlertsScreen';
import { OfficerActivityScreen } from '../features/supervisor/screens/OfficerActivityScreen';
import { SupervisorCasesScreen } from '../features/supervisor/screens/SupervisorCasesScreen';
import { SupervisorProfileScreen } from '../features/supervisor/screens/SupervisorProfileScreen';
import { colors, typography, shadows } from '../theme';
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  Users,
  FileCheck2,
  User,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

export const SupervisorTabNavigator = () => {
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
      {/* 1. Overview Tab */}
      <Tab.Screen
        name="Overview"
        component={SupervisorDashboardScreen}
        options={{
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutDashboard size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 2. Review Queue Tab */}
      <Tab.Screen
        name="Review Queue"
        component={ReviewQueueScreen}
        options={{
          tabBarLabel: 'Review',
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardList size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 3. Alerts Tab */}
      <Tab.Screen
        name="Alerts"
        component={SupervisorAlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size, focused }) => (
            <Bell size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 4. Officer Activity Tab */}
      <Tab.Screen
        name="OfficerActivity"
        component={OfficerActivityScreen}
        options={{
          tabBarLabel: 'Officers',
          tabBarIcon: ({ color, size, focused }) => (
            <Users size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 5. Cases Tab */}
      <Tab.Screen
        name="Cases"
        component={SupervisorCasesScreen}
        options={{
          tabBarLabel: 'Cases',
          tabBarIcon: ({ color, size, focused }) => (
            <FileCheck2 size={size} color={focused ? colors.primaryNavy : color} />
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
});

export default SupervisorTabNavigator;
