import { format } from 'date-fns';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LiveLocation } from '../../hooks/useLiveLocation';
import { StampAddress } from '../../services/geo/reverseGeocode';
import { facingDirection, formatCoordinate } from '../../utils/geo.utils';
import { CompassDial } from './CompassDial';
import { MiniMap } from './MiniMap';

export type GeoStamp = {
  location: LiveLocation;
  address: StampAddress | null;
  heading: number | null;
  takenAt: Date;
};

type GeoStampOverlayProps = GeoStamp & {
  /** Width of the photo the stamp sits on; every size derives from it. */
  width: number;
  onMapLoaded?: () => void;
};

/**
 * The "GPS map camera" stamp: compass + facing direction on the left, place,
 * address, coordinates, time and altitude on the right with a satellite
 * thumbnail. Used both over the live preview and burnt into the saved JPEG, so
 * what the engineer sees is exactly what the office receives.
 */
export function GeoStampOverlay({
  width,
  location,
  address,
  heading,
  takenAt,
  onMapLoaded,
}: GeoStampOverlayProps) {
  const s = width / 400;
  const dial = 92 * s;
  const map = 62 * s;

  return (
    <View style={[styles.container, { padding: 8 * s, gap: 6 * s }]} pointerEvents="none">
      <View style={[styles.brand, { borderRadius: 8 * s, paddingHorizontal: 7 * s, paddingVertical: 4 * s, gap: 5 * s }]}>
        <Image
          source={require('../../assets/images/logo_icon_light.png')}
          style={{ width: 14 * s, height: 14 * s }}
          resizeMode="contain"
        />
        <Text style={[styles.brandText, { fontSize: 10 * s }]}>VNV Engineers · Site Photo</Text>
      </View>

      <View style={[styles.row, { gap: 6 * s }]}>
        <View style={[styles.panel, styles.compassPanel, { borderRadius: 12 * s, padding: 6 * s, width: dial + 12 * s }]}>
          <CompassDial size={dial} heading={heading} />
          <View style={[styles.facingPill, { borderRadius: 6 * s, marginTop: 5 * s, paddingVertical: 3 * s }]}>
            <Text style={[styles.facingText, { fontSize: 10 * s }]} numberOfLines={1}>
              {heading === null ? 'No compass' : `Facing ${facingDirection(heading)}`}
            </Text>
          </View>
        </View>

        <View style={[styles.panel, styles.infoPanel, { borderRadius: 12 * s, padding: 8 * s, gap: 6 * s }]}>
          <View style={styles.infoText}>
            <Text style={[styles.title, { fontSize: 15 * s, lineHeight: 18 * s }]} numberOfLines={2}>
              {address?.title ?? 'Locating address…'}
            </Text>
            {address?.line ? (
              <Text style={[styles.line, { fontSize: 9 * s, lineHeight: 12 * s, marginTop: 2 * s }]} numberOfLines={3}>
                {address.line}
              </Text>
            ) : null}
            <Text style={[styles.line, styles.strong, { fontSize: 10 * s, lineHeight: 13 * s, marginTop: 3 * s }]}>
              Lat {formatCoordinate(location.latitude)}, Long {formatCoordinate(location.longitude)}
            </Text>
            <Text style={[styles.line, { fontSize: 9.5 * s, lineHeight: 12 * s, marginTop: 1 * s }]}>
              {format(takenAt, "EEEE, dd/MM/yyyy hh:mm a")}
            </Text>
            <Text style={[styles.line, { fontSize: 9 * s, lineHeight: 12 * s, marginTop: 1 * s }]}>
              {location.altitude !== null ? `Altitude ${location.altitude.toFixed(1)} m · ` : ''}±{Math.round(location.accuracy)} m
            </Text>
          </View>
          <MiniMap
            size={map}
            latitude={location.latitude}
            longitude={location.longitude}
            heading={heading}
            onTilesLoaded={onMapLoaded}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  brand: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 21, 51, 0.72)',
  },
  brandText: {
    color: '#F7F7F5',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  compassPanel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  facingPill: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  facingText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  infoPanel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  line: {
    color: '#F3F4F6',
  },
  strong: {
    fontWeight: '700',
  },
});
