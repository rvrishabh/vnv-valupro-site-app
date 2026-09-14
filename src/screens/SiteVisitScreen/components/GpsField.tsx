import Geolocation from '@react-native-community/geolocation';
import React, { useState } from 'react';
import { Control, Controller } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { glassFieldStyles } from '../../../components/form/glassFieldStyles';
import { SiteVisitFormValues } from '../../../schemas/site-visit.schema';
import { glassPanel } from '../../../theme/glassSurface';
import { darkColors } from '../../../theme/colors';
import { requestLocationPermission } from '../../../utils/permissions';

type GpsFieldProps = {
  control: Control<SiteVisitFormValues>;
  readOnly?: boolean;
};

/**
 * Stored as "lat, lng" to 6 decimals — the same string format the valuation
 * report prints for GPS coordinates (and what the admin editor expects).
 */
export function GpsField({ control, readOnly }: GpsFieldProps) {
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  return (
    <Controller
      control={control}
      name="gpsCoordinates"
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const capture = async () => {
          const granted = await requestLocationPermission();
          if (!granted) {
            Alert.alert('Location needed', 'Allow location access in Settings to capture GPS.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]);
            return;
          }
          setLocating(true);
          Geolocation.getCurrentPosition(
            position => {
              const { latitude, longitude } = position.coords;
              onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              setAccuracy(Math.round(position.coords.accuracy));
              setLocating(false);
            },
            locationError => {
              setLocating(false);
              Alert.alert(
                'Could not get location',
                locationError.code === 3
                  ? 'Timed out waiting for GPS. Move to an open area and try again.'
                  : locationError.message,
              );
            },
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
          );
        };

        return (
          <View style={glassFieldStyles.field}>
            <Text style={glassFieldStyles.label}>
              GPS co-ordinates<Text style={glassFieldStyles.required}> *</Text>
            </Text>
            <View style={[styles.row, error ? glassFieldStyles.inputRowError : null]}>
              <MaterialCommunityIcons
                name={value ? 'map-marker-check' : 'map-marker-outline'}
                size={22}
                color={value ? darkColors.success : darkColors.mutedForeground}
              />
              <View style={styles.body}>
                <Text style={value ? styles.value : styles.placeholder}>
                  {value || 'Not captured yet'}
                </Text>
                {accuracy !== null ? (
                  <Text style={styles.accuracy}>Accuracy ±{accuracy} m</Text>
                ) : null}
              </View>
              {!readOnly ? (
                <Pressable
                  onPress={capture}
                  disabled={locating}
                  style={styles.button}
                  accessibilityRole="button"
                  accessibilityLabel="Capture current location"
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={darkColors.ctaForeground} />
                  ) : (
                    <Text style={styles.buttonText}>{value ? 'Recapture' : 'Capture'}</Text>
                  )}
                </Pressable>
              ) : null}
            </View>
            {error ? (
              <Text style={glassFieldStyles.error}>{error.message}</Text>
            ) : (
              <Text style={glassFieldStyles.helper}>Capture while standing at the property.</Text>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    ...glassPanel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  body: {
    flex: 1,
  },
  value: {
    color: darkColors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  placeholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
  accuracy: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    backgroundColor: darkColors.cta,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 92,
    alignItems: 'center',
  },
  buttonText: {
    color: darkColors.ctaForeground,
    fontSize: 14,
    fontWeight: '700',
  },
});
