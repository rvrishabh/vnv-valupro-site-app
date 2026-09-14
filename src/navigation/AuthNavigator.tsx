import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import LoginScreen from '../screens/LoginScreen';
import { GradientBackground } from '../theme/GradientBackground';
import { transparentStackScreenOptions } from './screenOptions';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <GradientBackground>
      <Stack.Navigator screenOptions={transparentStackScreenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    </GradientBackground>
  );
}
