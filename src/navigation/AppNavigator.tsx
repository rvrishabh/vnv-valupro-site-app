import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import CasesScreen from '../screens/CasesScreen';
import GeoCameraScreen from '../screens/GeoCameraScreen';
import SiteVisitScreen from '../screens/SiteVisitScreen';
import { GradientBackground } from '../theme/GradientBackground';
import { transparentStackScreenOptions } from './screenOptions';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <GradientBackground>
      <Stack.Navigator initialRouteName="Cases" screenOptions={transparentStackScreenOptions}>
        <Stack.Screen name="Cases" component={CasesScreen} />
        <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
        <Stack.Screen name="SiteVisit" component={SiteVisitScreen} />
        <Stack.Screen
          name="GeoCamera"
          component={GeoCameraScreen}
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            orientation: 'portrait',
            statusBarStyle: 'light',
            contentStyle: { backgroundColor: '#000000' },
          }}
        />
      </Stack.Navigator>
    </GradientBackground>
  );
}
