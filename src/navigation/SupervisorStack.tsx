import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupervisorStackParamList } from './types';
import { SupervisorTabNavigator } from './SupervisorTabNavigator';
import { SupervisorProfileScreen } from '../features/supervisor/screens/SupervisorProfileScreen';
import { SupervisorCasesScreen } from '../features/supervisor/screens/SupervisorCasesScreen';
import { OfficerActivityScreen } from '../features/supervisor/screens/OfficerActivityScreen';
import { SupervisorAlertsScreen } from '../features/supervisor/screens/SupervisorAlertsScreen';
import { ReviewQueueScreen } from '../features/supervisor/screens/ReviewQueueScreen';

const Stack = createNativeStackNavigator<SupervisorStackParamList>();

export const SupervisorStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#FDFBF7' },
      }}
    >
      <Stack.Screen name="SupervisorMainTabs" component={SupervisorTabNavigator} />
      <Stack.Screen name="Profile" component={SupervisorProfileScreen} />
      <Stack.Screen name="Cases" component={SupervisorCasesScreen} />
      <Stack.Screen name="OfficerActivity" component={OfficerActivityScreen} />
      <Stack.Screen name="Alerts" component={SupervisorAlertsScreen} />
      <Stack.Screen name="Review Queue" component={ReviewQueueScreen} />
    </Stack.Navigator>
  );
};

export default SupervisorStack;
