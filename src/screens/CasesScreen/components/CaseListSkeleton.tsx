import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bone, SkeletonCard } from '../../../components/Skeleton';
import { glassListItemSpacing } from '../../../theme/glassSurface';

const ROWS = 5;

/** Mirrors `CaseListItem`'s shape: case no. + pill, customer name, two meta rows, footer. */
function CaseCardSkeleton() {
  return (
    <SkeletonCard style={glassListItemSpacing}>
      <View style={styles.topRow}>
        <Bone width={90} height={12} radius={4} />
        <Bone width={64} height={22} radius={999} />
      </View>
      <Bone width="70%" height={18} radius={5} style={styles.customer} />
      <View style={styles.metaRow}>
        <Bone width={16} height={16} radius={4} />
        <Bone width="85%" height={13} radius={4} />
      </View>
      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          <Bone width={16} height={16} radius={4} />
          <Bone width={110} height={13} radius={4} />
        </View>
        <Bone width={70} height={12} radius={4} />
      </View>
    </SkeletonCard>
  );
}

/** Loading placeholder for the cases list, shown while the first page fetches. */
export function CaseListSkeleton() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {Array.from({ length: ROWS }).map((_, index) => (
        <CaseCardSkeleton key={index} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  customer: {
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
