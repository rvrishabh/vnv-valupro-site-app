import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { GradientBackground } from '../../theme/GradientBackground';
import { darkColors } from '../../theme/colors';

export default function SplashScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/logo_full_light.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={darkColors.primary} style={styles.loader} />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 240,
    height: 113,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
