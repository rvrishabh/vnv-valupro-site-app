import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ToastManager from 'toastify-react-native';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';
import { applyGlobalFont, darkColors, darkPaperTheme } from './src/theme';

applyGlobalFont();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
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
