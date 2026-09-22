import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bone, SkeletonCard } from '../../../components/Skeleton';

/** One labelled field, matching `glassFieldStyles`: a small label above a glass input row. */
function FieldSkeleton({ width = '100%' as const }: { width?: number | `${number}%` }) {
  return (
    <View style={styles.field}>
      <Bone width={90} height={10} radius={3} style={styles.label} />
      <Bone width={width} height={52} radius={12} />
    </View>
  );
}

/** A `SectionCard`: icon + title header, then a few fields. */
function SectionSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <SkeletonCard style={styles.card}>
      <View style={styles.header}>
        <Bone width={20} height={20} radius={5} />
        <Bone width={130} height={15} radius={4} />
      </View>
      {Array.from({ length: fields }).map((_, index) => (
        <FieldSkeleton key={index} />
      ))}
    </SkeletonCard>
  );
}

/** Loading placeholder for the visit form, shown while the case + draft resolve. */
export function SiteVisitSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
      <SkeletonCard style={styles.card}>
        <View style={styles.header}>
          <Bone width={20} height={20} radius={5} />
          <Bone width={100} height={15} radius={4} />
        </View>
        <View style={styles.photoGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Bone key={index} width="31.5%" height={PHOTO_TILE} radius={12} />
          ))}
        </View>
      </SkeletonCard>
      <SectionSkeleton fields={4} />
      <SectionSkeleton fields={3} />
    </Animated.View>
  );
}

const PHOTO_TILE = 108;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
