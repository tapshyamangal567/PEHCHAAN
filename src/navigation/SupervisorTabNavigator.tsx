import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SupervisorTabParamList } from './types';
import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen';
import { ReviewQueueScreen } from '../features/supervisor/screens/ReviewQueueScreen';
import { AnalyticsPlaceholderScreen } from '../features/supervisor/screens/AnalyticsPlaceholderScreen';
import { SupervisorAlertsScreen } from '../features/supervisor/screens/SupervisorAlertsScreen';
import { SupervisorProfileScreen } from '../features/supervisor/screens/SupervisorProfileScreen';
import { colors, typography, shadows } from '../theme';
import { LayoutDashboard, ClipboardList, BarChart3, Bell, User } from 'lucide-react-native';

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
          tabBarLabel: 'Review Queue',
          tabBarIcon: ({ color, size, focused }) => (
            <ClipboardList size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 3. Analytics Tab */}
      <Tab.Screen
        name="Analytics"
        component={AnalyticsPlaceholderScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size, focused }) => (
            <BarChart3 size={size} color={focused ? colors.primaryNavy : color} />
          ),
        }}
      />

      {/* 4. Alerts Tab */}
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

      {/* 5. Profile Tab */}
      <Tab.Screen
        name="Profile"
        component={SupervisorProfileScreen}
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
});

export default SupervisorTabNavigator;
