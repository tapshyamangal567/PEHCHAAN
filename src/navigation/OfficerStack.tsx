import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OfficerStackParamList } from './types';
import { OfficerTabNavigator } from './OfficerTabNavigator';
import { PassportUploadScreen } from '../features/screening/screens/PassportUploadScreen';
import { PassportCameraScreen } from '../features/screening/screens/PassportCameraScreen';
import { PassportPreparationScreen } from '../features/screening/screens/PassportPreparationScreen';
import { PassportPreviewScreen } from '../features/screening/screens/PassportPreviewScreen';
import { DocumentAnalysisScreen } from '../features/screening/screens/DocumentAnalysisScreen';
import { VerificationResultsScreen } from '../features/screening/screens/VerificationResultsScreen';
import { IdentityVerificationScreen } from '../features/screening/screens/IdentityVerificationScreen';

const Stack = createNativeStackNavigator<OfficerStackParamList>();

export const OfficerStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F5F7FA' },
      }}
    >
      <Stack.Screen name="OfficerMainTabs" component={OfficerTabNavigator} />
      <Stack.Screen name="PassportUpload" component={PassportUploadScreen} />
      <Stack.Screen name="PassportCamera" component={PassportCameraScreen} />
      <Stack.Screen name="PassportPreparation" component={PassportPreparationScreen} />
      <Stack.Screen name="PassportPreview" component={PassportPreviewScreen} />
      <Stack.Screen name="DocumentAnalysis" component={DocumentAnalysisScreen} />
      <Stack.Screen name="VerificationResults" component={VerificationResultsScreen} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerificationScreen} />
    </Stack.Navigator>
  );
};

export default OfficerStack;
