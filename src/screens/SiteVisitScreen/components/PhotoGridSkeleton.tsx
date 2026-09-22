import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bone } from '../../../components/Skeleton';

/** Loading placeholder for the site-photos grid, shown while photo metadata fetches. */
export function PhotoGridSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.grid}>
      {Array.from({ length: 3 }).map((_, index) => (
        <Bone key={index} width="31.5%" height={TILE_HEIGHT} radius={12} />
      ))}
    </Animated.View>
  );
}

// Tiles are square via aspectRatio in the real grid; a fixed height stand-in
// (roughly a phone-width third minus gaps) keeps the skeleton from jumping.
const TILE_HEIGHT = 108;

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
});
