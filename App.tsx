import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToastManager from 'toastify-react-native';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';
import { warmBackend } from './src/services/api/client';
import { applyGlobalFont, darkColors, darkPaperTheme } from './src/theme';

applyGlobalFont();

// Kick the backend awake the instant the app opens — see warmBackend's own
// comment for why (the free-tier host sleeps when idle).
warmBackend();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A cold backend can outlast one retry; a second one (same backoff:
      // 1s, then 2s) covers most of what we've seen without piling up
      // requests for a server that's genuinely down.
      retry: 2,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={darkPaperTheme}>
          <View style={styles.appContainer}>
            <StatusBar barStyle="light-content" backgroundColor={darkColors.background} />
            <RootNavigator />
            <ToastManager theme="dark" />
          </View>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
});
