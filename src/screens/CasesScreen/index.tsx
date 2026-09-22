import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useLogoutMutation } from '../../mutations/auth/useLogoutMutation';
import { AppStackParamList } from '../../navigation/types';
import { useGetAssignedCasesInfiniteQuery } from '../../queries/cases/useGetAssignedCasesInfiniteQuery';
import { useAuthStore } from '../../stores/authStore';
import { authGlass, glassCardStyles, glassPanel } from '../../theme/glassSurface';
import { darkColors } from '../../theme/colors';
import { getApiErrorMessage } from '../../api';
import { getVisitStage } from '../../utils/site-visit.utils';
import { CaseListItem } from './components/CaseListItem';
import { CaseListSkeleton } from './components/CaseListSkeleton';

type Tab = 'pending' | 'submitted';

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'To visit' },
  { key: 'submitted', label: 'Submitted' },
];

export default function CasesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore(s => s.user);
  const logout = useLogoutMutation();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  // Sliding gold pill behind the tabs, in place of a hard background swap.
  const tabLayouts = useRef<Partial<Record<Tab, { x: number; width: number }>>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);

  const measureTab = (key: Tab) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current[key] = { x, width };
    if (key === tab && indicatorWidth.value === 0) {
      indicatorX.value = x;
      indicatorWidth.value = width;
      indicatorOpacity.value = withTiming(1, { duration: 150 });
    }
  };

  const selectTab = (key: Tab) => {
    setTab(key);
    const layout = tabLayouts.current[key];
    if (layout) {
      indicatorX.value = withSpring(layout.x, { damping: 22, stiffness: 260 });
      indicatorWidth.value = withSpring(layout.width, { damping: 22, stiffness: 260 });
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
    opacity: indicatorOpacity.value,
  }));

  const {
    cases,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAssignedCasesInfiniteQuery({ limit: 30, search: debouncedSearch || undefined });

  // The backend filters on one status at a time, while "to visit" spans
  // several — so the split into tabs happens on the engineer's own list.
  const { pending, submitted } = useMemo(() => {
    const groups = { pending: [] as typeof cases, submitted: [] as typeof cases };
    cases.forEach(item => {
      const stage = getVisitStage(item);
      if (stage === 'new' || stage === 'in_progress' || stage === 'query') {
        groups.pending.push(item);
      } else {
        groups.submitted.push(item);
      }
    });
    return groups;
  }, [cases]);

  const visible = tab === 'pending' ? pending : submitted;

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Unsynced form drafts on this phone will be cleared.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => logout.mutate() },
    ]);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'Engineer';

  return (
    <View style={styles.flex}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.headerSubtitle}>
              {pending.length} site visit{pending.length === 1 ? '' : 's'} pending
            </Text>
          </View>
          <Pressable
            onPress={confirmLogout}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            hitSlop={8}
            style={[glassCardStyles.iconBadge, styles.iconButton]}
          >
            <MaterialCommunityIcons name="logout" size={20} color={darkColors.foreground} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color={darkColors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search case no., customer or mobile"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
              <MaterialCommunityIcons name="close-circle" size={18} color={darkColors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabs}>
          <Animated.View style={[styles.tabIndicator, indicatorStyle]} />
          {TABS.map(({ key, label }) => {
            const selected = key === tab;
            const count = key === 'pending' ? pending.length : submitted.length;
            return (
              <Pressable
                key={key}
                onPress={() => selectTab(key)}
                onLayout={measureTab(key)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={styles.tab}
              >
                <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
                  {label} · {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {isLoading ? (
        <CaseListSkeleton />
      ) : isError ? (
        <EmptyState
          icon="cloud-off-outline"
          title="Could not load your cases"
          message={getApiErrorMessage(error)}
          action={<AppButton label="Try again" variant="secondary" onPress={() => refetch()} />}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <CaseListItem
              item={item}
              index={index}
              onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              tintColor={darkColors.primary}
              colors={[darkColors.primary]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={darkColors.primary} /> : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'pending' ? 'clipboard-check-outline' : 'file-send-outline'}
              title={
                debouncedSearch
                  ? 'No matching cases'
                  : tab === 'pending'
                  ? 'No visits pending'
                  : 'Nothing submitted yet'
              }
              message={
                tab === 'pending' && !debouncedSearch
                  ? 'Cases the office assigns to you will appear here. Pull down to refresh.'
                  : undefined
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  greeting: {
    color: darkColors.foreground,
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    marginTop: 2,
  },
  iconButton: {
    width: 42,
    height: 42,
  },
  searchRow: {
    ...glassPanel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    color: darkColors.foreground,
    fontSize: 15,
    paddingVertical: 10,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 6,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: darkColors.cta,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: authGlass.border,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  tabLabel: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelSelected: {
    color: darkColors.ctaForeground,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
});
