import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bone, SkeletonCard } from '../../../components/Skeleton';

/** Mirrors an `InfoRow`: icon + label + value stacked. */
function InfoRowSkeleton() {
  return (
    <View style={styles.infoRow}>
      <Bone width={20} height={20} radius={5} />
      <View style={styles.infoText}>
        <Bone width={110} height={11} radius={4} style={styles.infoLabel} />
        <Bone width="65%" height={14} radius={4} />
      </View>
    </View>
  );
}

/** Loading placeholder for a case's detail screen, shaped like the loaded layout. */
export function CaseDetailSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.content}>
      <SkeletonCard style={styles.card}>
        <View style={styles.titleRow}>
          <Bone width="55%" height={20} radius={5} />
          <Bone width={64} height={22} radius={999} />
        </View>
        <Bone width={120} height={13} radius={4} style={styles.propertyType} />
        <View style={styles.quickActions}>
          <Bone width={90} height={36} radius={999} />
          <Bone width={110} height={36} radius={999} />
        </View>
      </SkeletonCard>

      <SkeletonCard style={styles.card}>
        <InfoRowSkeleton />
        <InfoRowSkeleton />
        <InfoRowSkeleton />
      </SkeletonCard>

      <SkeletonCard style={styles.card}>
        <Bone width={90} height={14} radius={4} style={styles.sectionTitle} />
        <InfoRowSkeleton />
        <InfoRowSkeleton />
      </SkeletonCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  propertyType: {
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    marginBottom: 6,
  },
});
