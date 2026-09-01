import React from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SupervisorTabParamList } from './types';
import { SupervisorDashboardScreen } from '../features/supervisor/screens/SupervisorDashboardScreen';
import { ReviewQueueScreen } from '../features/supervisor/screens/ReviewQueueScreen';
import { SupervisorAlertsScreen } from '../features/supervisor/screens/SupervisorAlertsScreen';
import { OfficerActivityScreen } from '../features/supervisor/screens/OfficerActivityScreen';
import { SupervisorCasesScreen } from '../features/supervisor/screens/SupervisorCasesScreen';
import { colors, typography, shadows } from '../theme';
import {
  LayoutGrid,
  ClipboardList,
  Bell,
  Users,
  FileText,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator<SupervisorTabParamList>();

export const SupervisorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#64748B',
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
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeTopLine} />}
              <LayoutGrid size={22} color={focused ? '#1D4ED8' : color} />
            </View>
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
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeTopLine} />}
              <ClipboardList size={22} color={focused ? '#1D4ED8' : color} />
            </View>
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
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeTopLine} />}
              <Bell size={22} color={focused ? '#1D4ED8' : color} />
            </View>
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
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeTopLine} />}
              <Users size={22} color={focused ? '#1D4ED8' : color} />
            </View>
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
            <View style={styles.iconWrapper}>
              {focused && <View style={styles.activeTopLine} />}
              <FileText size={22} color={focused ? '#1D4ED8' : color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    ...shadows.soft,
  },
  tabBarLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 4,
  },
  activeTopLine: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1D4ED8',
  },
});

export default SupervisorTabNavigator;
