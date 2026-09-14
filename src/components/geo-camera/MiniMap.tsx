import React, { useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { latLngToTile, satelliteTileUrl } from '../../utils/geo.utils';

type MiniMapProps = {
  size: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  onTilesLoaded?: () => void;
};

const ZOOM = 17;
const TILE = 256;

/**
 * Satellite thumbnail centred on the fix: a 3×3 block of tiles around the
 * point, shifted so the point sits in the middle, with a pin and a view cone
 * turned to the compass heading.
 */
export function MiniMap({ size, latitude, longitude, heading, onTilesLoaded }: MiniMapProps) {
  const { x, y } = latLngToTile(latitude, longitude, ZOOM);
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  // Scale so one tile spans the thumbnail — roughly 150 m across at zoom 17.
  const scale = size / TILE;
  const tileSize = TILE * scale;
  const offsetX = size / 2 - (x - tileX + 1) * tileSize;
  const offsetY = size / 2 - (y - tileY + 1) * tileSize;

  // Settled (loaded or failed) tiles for the current centre; offline tiles
  // fail fast, so the stamp is never held back waiting for imagery.
  const settled = useRef(new Set<string>());
  const tileKey = `${tileX}:${tileY}`;
  const handleLoad = (key: string) => {
    settled.current.add(`${tileKey}|${key}`);
    const count = [...settled.current].filter(k => k.startsWith(`${tileKey}|`)).length;
    if (count === 9) {
      onTilesLoaded?.();
    }
  };

  const c = size / 2;
  const cone = size * 0.42;

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.08 }]}>
      {[-1, 0, 1].map(dy =>
        [-1, 0, 1].map(dx => (
          <Image
            key={`${dx}:${dy}`}
            source={{ uri: satelliteTileUrl(ZOOM, tileX + dx, tileY + dy) }}
            onLoadEnd={() => handleLoad(`${dx}:${dy}`)}
            style={{
              position: 'absolute',
              width: tileSize,
              height: tileSize,
              left: offsetX + (dx + 1) * tileSize,
              top: offsetY + (dy + 1) * tileSize,
            }}
          />
        )),
      )}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {heading !== null ? (
          <Path
            d={`M ${c} ${c} L ${c - cone * 0.45} ${c - cone} L ${c + cone * 0.45} ${c - cone} Z`}
            fill="rgba(59,130,246,0.45)"
            rotation={heading}
            origin={`${c}, ${c}`}
          />
        ) : null}
        <Path
          d={`M ${c} ${c} C ${c - size * 0.02} ${c - size * 0.1} ${c - size * 0.11} ${c - size * 0.15} ${c - size * 0.11} ${c - size * 0.24} A ${size * 0.11} ${size * 0.11} 0 1 1 ${c + size * 0.11} ${c - size * 0.24} C ${c + size * 0.11} ${c - size * 0.15} ${c + size * 0.02} ${c - size * 0.1} ${c} ${c} Z`}
          fill="#DC2626"
          stroke="#7F1D1D"
          strokeWidth={1}
        />
        <Path
          d={`M ${c - size * 0.04} ${c - size * 0.24} a ${size * 0.04} ${size * 0.04} 0 1 0 ${size * 0.08} 0 a ${size * 0.04} ${size * 0.04} 0 1 0 ${-size * 0.08} 0`}
          fill="#7F1D1D"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
});
