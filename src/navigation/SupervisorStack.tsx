import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SupervisorStackParamList } from './types';
import { SupervisorTabNavigator } from './SupervisorTabNavigator';

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
    </Stack.Navigator>
  );
};

export default SupervisorStack;
