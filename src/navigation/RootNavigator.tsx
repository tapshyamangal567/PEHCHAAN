import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/useAuthStore';
import { AuthStack } from './AuthStack';
import { OfficerStack } from './OfficerStack';
import { SupervisorStack } from './SupervisorStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { isLoggedIn, role } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isLoggedIn ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : role === 'OFFICER' ? (
          <Stack.Screen name="OfficerApp" component={OfficerStack} />
        ) : (
          <Stack.Screen name="SupervisorApp" component={SupervisorStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
