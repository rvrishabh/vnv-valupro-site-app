import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Camera, CameraApi } from 'react-native-camera-kit';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { captureRef } from 'react-native-view-shot';
import { AppButton } from '../../components/AppButton';
import { GeoStamp, GeoStampOverlay } from '../../components/geo-camera/GeoStampOverlay';
import { useCompassHeading } from '../../hooks/useCompassHeading';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { AppStackParamList } from '../../navigation/types';
import { capturedPhotoStore } from '../../stores/capturedPhotoStore';
import { darkColors } from '../../theme/colors';
import { requestCameraPermission, requestLocationPermission } from '../../utils/permissions';

type Props = NativeStackScreenProps<AppStackParamList, 'GeoCamera'>;

type FlashMode = 'auto' | 'on' | 'off';
const FLASH_ORDER: FlashMode[] = ['auto', 'on', 'off'];
const FLASH_ICON: Record<FlashMode, string> = {
  auto: 'flash-auto',
  on: 'flash',
  off: 'flash-off',
};

/** Zoom presets, like the stock camera. Devices without an ultra-wide lens clamp 0.5x to their widest view. */
const ZOOM_PRESETS = [0.5, 1, 2];

/** Longest edge of the stamped JPEG; the backend re-encodes to ≤2000 px anyway. */
const OUTPUT_MAX_WIDTH = 1600;
/** Imagery is best-effort — never hold a photo back longer than this for map tiles. */
const MAP_WAIT_MS = 2500;
/** Refuse to stamp a fix worse than this; the stamp is the proof of presence. */
const MAX_ACCURACY_METRES = 100;

type PendingShot = {
  uri: string;
  aspect: number;
  stamp: GeoStamp;
};

const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/**
 * In-app geo-tagging camera. Site photos can only come from here: each shot is
 * composed with the location stamp (compass, facing direction, address,
 * lat/long, time, altitude, satellite thumbnail) and flattened into a single
 * JPEG before it is handed to the visit form for upload.
 *
 * Composition renders the photo + stamp into an off-screen-sized view placed
 * behind the live preview and snapshots it with view-shot — the same component
 * the engineer sees over the viewfinder, so the result matches the preview.
 */
export default function GeoCameraScreen(props: Props) {
  // fullScreenModal presentation opens its own native view controller, which
  // the root SafeAreaProvider doesn't track — re-measure insets locally so
  // the top bar clears the notch/dynamic island instead of sitting under it.
  return (
    <SafeAreaProvider>
      <GeoCameraScreenContent {...props} />
    </SafeAreaProvider>
  );
}

function GeoCameraScreenContent({ route, navigation }: Props) {
  const { valuationId, remaining } = route.params;
  const { width: screenWidth } = useWindowDimensions();

  const [permission, setPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [flash, setFlash] = useState<FlashMode>('auto');
  const [busy, setBusy] = useState(false);
  const [taken, setTaken] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pending, setPending] = useState<PendingShot | null>(null);

  const cameraRef = useRef<CameraApi>(null);
  const compositeRef = useRef<View>(null);
  const photoLoaded = useRef<(() => void) | null>(null);
  const mapLoaded = useRef<(() => void) | null>(null);

  const granted = permission === 'granted';
  const { location, address, error: locationError } = useLiveLocation(granted);
  const heading = useCompassHeading(granted);

  useEffect(() => {
    (async () => {
      const [camera, gps] = await Promise.all([
        requestCameraPermission(),
        requestLocationPermission(),
      ]);
      setPermission(camera && gps ? 'granted' : 'denied');
    })();
  }, []);

  const left = remaining - taken.length;
  const gpsReady = !!location && location.accuracy <= MAX_ACCURACY_METRES;

  const shoot = useCallback(async () => {
    if (busy || !cameraRef.current) {
      return;
    }
    if (!location || !gpsReady) {
      Alert.alert('Waiting for GPS', 'Photos are stamped with the site location. Hold on until the GPS fix is ready.');
      return;
    }

    setBusy(true);
    try {
      const stamp: GeoStamp = { location, address, heading, takenAt: new Date() };
      const shot = await cameraRef.current.capture();

      const photoReady = new Promise<void>(resolve => {
        photoLoaded.current = resolve;
      });
      const mapReady = Promise.race([
        new Promise<void>(resolve => {
          mapLoaded.current = resolve;
        }),
        new Promise<void>(resolve => setTimeout(resolve, MAP_WAIT_MS)),
      ]);

      setPending({
        uri: shot.uri,
        aspect: shot.width && shot.height ? shot.width / shot.height : 3 / 4,
        stamp,
      });

      await Promise.all([photoReady, mapReady]);
      // Let the aspect ratio measured on load lay out before snapshotting.
      await nextFrame();
      await nextFrame();

      const outputWidth = Math.min(OUTPUT_MAX_WIDTH, shot.width || OUTPUT_MAX_WIDTH);
      const uri = await captureRef(compositeRef, {
        format: 'jpg',
        quality: 0.85,
        result: 'tmpfile',
        width: outputWidth,
      });

      capturedPhotoStore.emit(valuationId, {
        uri,
        type: 'image/jpeg',
        fileName: `site-${stamp.takenAt.getTime()}.jpg`,
      });

      const count = taken.length + 1;
      setTaken(list => [...list, uri]);
      if (count >= remaining) {
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Could not take photo', (error as Error).message);
    } finally {
      setPending(null);
      photoLoaded.current = null;
      mapLoaded.current = null;
      setBusy(false);
    }
  }, [busy, location, gpsReady, address, heading, valuationId, taken.length, remaining, navigation]);

  if (permission !== 'granted') {
    return (
      <SafeAreaView style={styles.permission}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel="Close camera"
          style={[styles.roundButton, styles.permissionClose]}
        >
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        {permission === 'pending' ? (
          <ActivityIndicator color={darkColors.primary} />
        ) : (
          <>
            <MaterialCommunityIcons name="camera-off-outline" size={48} color={darkColors.mutedForeground} />
            <Text style={styles.permissionTitle}>Camera and location needed</Text>
            <Text style={styles.permissionText}>
              Site photos are taken in the app and stamped with the GPS location, so both permissions are required.
            </Text>
            <AppButton label="Open Settings" onPress={() => Linking.openSettings()} style={styles.permissionButton} />
            <AppButton label="Go back" variant="secondary" onPress={() => navigation.goBack()} style={styles.permissionButton} />
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Composition surface — sits behind the viewfinder, snapshotted per shot. */}
      {pending ? (
        <View
          ref={compositeRef}
          collapsable={false}
          style={[styles.composite, { width: screenWidth, height: screenWidth / pending.aspect }]}
        >
          <Image
            source={{ uri: pending.uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            onLoad={event => {
              const { width, height } = event.nativeEvent.source;
              if (width && height && Math.abs(width / height - pending.aspect) > 0.01) {
                setPending(current => (current ? { ...current, aspect: width / height } : current));
              }
              photoLoaded.current?.();
            }}
            onError={() => photoLoaded.current?.()}
          />
          <GeoStampOverlay
            width={screenWidth}
            {...pending.stamp}
            onMapLoaded={() => mapLoaded.current?.()}
          />
        </View>
      ) : null}

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Close camera" style={styles.roundButton}>
          <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.gpsChip}>
          <MaterialCommunityIcons
            name={gpsReady ? 'crosshairs-gps' : 'crosshairs-question'}
            size={16}
            color={gpsReady ? darkColors.success : darkColors.warning}
          />
          <Text style={styles.gpsText}>
            {gpsReady
              ? `GPS ±${Math.round(location!.accuracy)} m`
              : locationError ?? 'Getting GPS fix…'}
          </Text>
        </View>
        <Pressable
          onPress={() => setFlash(FLASH_ORDER[(FLASH_ORDER.indexOf(flash) + 1) % FLASH_ORDER.length])}
          hitSlop={12}
          accessibilityLabel={`Flash ${flash}`}
          style={styles.roundButton}
        >
          <MaterialCommunityIcons name={FLASH_ICON[flash]} size={22} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>

      <View style={styles.preview}>
        <Suspense fallback={<ActivityIndicator color={darkColors.primary} style={styles.flex} />}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            flashMode={flash}
            focusMode="on"
            zoomMode="on"
            zoom={zoom}
            // Fully controlled, per the library's own documented pattern: pinch
            // reports its desired zoom here and we feed it straight back as the
            // `zoom` prop. Releasing `zoom` to `undefined` between taps (the
            // previous approach) is what let the iOS Simulator's fake camera —
            // which treats a nil zoom as "reset to its 2x default" — snap the
            // preset back to 2x after every tap; a real device doesn't do that,
            // but staying controlled avoids the footgun entirely either way.
            onZoom={event => setZoom(event.nativeEvent.zoom)}
            resizeMode="cover"
            shutterPhotoSound
            onError={event => Alert.alert('Camera error', event.nativeEvent.errorMessage)}
          />
        </Suspense>
        <View style={styles.zoomBar} pointerEvents="box-none">
          {ZOOM_PRESETS.map(preset => {
            const active = Math.abs(zoom - preset) < 0.25;
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => setZoom(preset)}
                accessibilityRole="button"
                accessibilityLabel={`Zoom ${preset}x`}
                style={[styles.zoomChip, active && styles.zoomChipActive]}
              >
                <Text style={[styles.zoomText, active && styles.zoomTextActive]}>
                  {active && Math.abs(zoom - preset) > 0.02 ? `${zoom.toFixed(1)}x` : `${preset}x`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {location ? (
          <GeoStampOverlay width={screenWidth} location={location} address={address} heading={heading} takenAt={new Date()} />
        ) : (
          <View style={styles.waiting} pointerEvents="none">
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.waitingText}>{locationError ?? 'Getting your location…'}</Text>
          </View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.sideSlot}>
          {taken.length ? (
            <View>
              <Image source={{ uri: taken[taken.length - 1] }} style={styles.thumb} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{taken.length}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={shoot}
          disabled={busy || !gpsReady || left <= 0}
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          style={({ pressed }) => [
            styles.shutter,
            (!gpsReady || left <= 0) && styles.shutterDisabled,
            pressed && styles.shutterPressed,
          ]}
        >
          {busy ? <ActivityIndicator color={darkColors.ctaForeground} /> : <View style={styles.shutterInner} />}
        </Pressable>

        <View style={styles.sideSlot}>
          <Text style={styles.remaining}>{left} left</Text>
          {taken.length ? (
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  composite: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: '#000000',
    zIndex: 10,
    elevation: 10,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  gpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  gpsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  preview: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  // Sits above the stamp panel (~170 px tall at phone width).
  zoomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 190,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  zoomChip: {
    minWidth: 44,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  zoomChipActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  zoomText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  zoomTextActive: {
    color: '#000000',
  },
  waiting: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    gap: 8,
  },
  waitingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: '#000000',
  },
  sideSlot: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.primary,
  },
  badgeText: {
    color: darkColors.ctaForeground,
    fontSize: 12,
    fontWeight: '800',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: darkColors.cta,
  },
  shutterDisabled: {
    opacity: 0.4,
  },
  shutterPressed: {
    transform: [{ scale: 0.94 }],
  },
  remaining: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  done: {
    color: darkColors.primarySoft,
    fontSize: 16,
    fontWeight: '700',
  },
  permission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: darkColors.background,
  },
  permissionClose: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  permissionTitle: {
    color: darkColors.foreground,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  permissionText: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  permissionButton: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
});
