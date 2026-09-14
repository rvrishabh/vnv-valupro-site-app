import {
  DarkTheme as NavigationDarkTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useAuthBootstrap } from '../queries/auth/useAuthBootstrap';
import SplashScreen from '../screens/SplashScreen';
import { setOnAuthFailure } from '../services/api/client';
import { authStore, useAuthStore } from '../stores/authStore';
import { darkColors } from '../theme/colors';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';

const Stack = createNativeStackNavigator();
const navigationDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: darkColors.background,
    card: 'transparent',
    text: darkColors.onBackground,
    border: darkColors.border,
    primary: darkColors.primary,
  },
};

/** Top-level screens are driven entirely by `authStore.status`. */
export default function RootNavigator() {
  const status = useAuthStore(s => s.status);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  useAuthBootstrap();

  useEffect(() => {
    setOnAuthFailure(() => {
      authStore.setUnauthenticated();
    });

    return () => setOnAuthFailure(null);
  }, []);

  return (
    <NavigationContainer ref={navigationRef} theme={navigationDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {(status === 'idle' || status === 'bootstrapping') && (
          <Stack.Screen name="Splash" component={SplashScreen} />
        )}
        {status === 'unauthenticated' && <Stack.Screen name="Auth" component={AuthNavigator} />}
        {status === 'authenticated' && <Stack.Screen name="App" component={AppNavigator} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
