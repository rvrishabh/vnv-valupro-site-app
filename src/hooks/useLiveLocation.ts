import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import { useEffect, useRef, useState } from 'react';
import { reverseGeocode, StampAddress } from '../services/geo/reverseGeocode';
import { distanceMetres } from '../utils/geo.utils';

export interface LiveLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
}

const REGEOCODE_AFTER_METRES = 40;

/**
 * Watches the GPS while the camera is open and keeps a human-readable address
 * for the stamp. The address lags the fix (network lookup) and may stay null
 * offline — the stamp still carries the coordinates in that case.
 */
export const useLiveLocation = (enabled: boolean) => {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [address, setAddress] = useState<StampAddress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const geocodedAt = useRef<LiveLocation | null>(null);
  const lookup = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onPosition = ({ coords }: GeolocationResponse) => {
      const next: LiveLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude ?? null,
      };
      setLocation(next);
      setError(null);

      if (!geocodedAt.current || distanceMetres(geocodedAt.current, next) > REGEOCODE_AFTER_METRES) {
        geocodedAt.current = next;
        lookup.current?.abort();
        const controller = new AbortController();
        lookup.current = controller;
        reverseGeocode(next.latitude, next.longitude, controller.signal)
          .then(result => {
            if (result) {
              setAddress(result);
            }
          })
          .catch(() => {
            // Offline or rate-limited: retry on the next significant move.
            geocodedAt.current = null;
          });
      }
    };

    const watchId = Geolocation.watchPosition(
      onPosition,
      watchError =>
        setError(
          watchError.code === 1
            ? 'Location permission denied'
            : 'Waiting for GPS — move to an open area',
        ),
      { enableHighAccuracy: true, distanceFilter: 2, interval: 3000, fastestInterval: 1000 },
    );

    return () => {
      Geolocation.clearWatch(watchId);
      lookup.current?.abort();
    };
  }, [enabled]);

  return { location, address, error };
};
