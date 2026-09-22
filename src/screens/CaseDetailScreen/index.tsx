import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getApiErrorMessage } from '../../api';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { CaseDetailSkeleton } from './components/CaseDetailSkeleton';
import { GlassPanel } from '../../components/GlassPanel';
import { InfoRow } from '../../components/InfoRow';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatusPill } from '../../components/StatusPill';
import { useStartVisitMutation } from '../../mutations/site-visit/useStartVisitMutation';
import { AppStackParamList } from '../../navigation/types';
import { useGetCaseByIdQuery } from '../../queries/cases/useGetCaseByIdQuery';
import { useGetCaseTimelineQuery } from '../../queries/cases/useGetCaseTimelineQuery';
import { glassCardStyles } from '../../theme/glassSurface';
import { darkColors } from '../../theme/colors';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/date.utils';
import { getVisitStage, VISIT_STAGE_LABEL } from '../../utils/site-visit.utils';

type Props = NativeStackScreenProps<AppStackParamList, 'CaseDetail'>;

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  LAND: 'Land',
  INDUSTRIAL: 'Industrial',
};

const openMaps = (address: string) => {
  const query = encodeURIComponent(address);
  const url = Platform.select({
    ios: `maps://?q=${query}`,
    default: `geo:0,0?q=${query}`,
  });
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`),
  );
};

export default function CaseDetailScreen({ route, navigation }: Props) {
  const { caseId } = route.params;
  const { data: item, isLoading, isError, error, refetch, isRefetching } =
    useGetCaseByIdQuery(caseId);
  const startVisit = useStartVisitMutation();
  

  const stage = item ? getVisitStage(item) : null;
  const { data: timeline } = useGetCaseTimelineQuery(caseId, stage === 'query');
  const latestQuery = timeline?.events
    .filter(event => event.action === 'QUERY_RAISED')
    .at(-1);

  if (isLoading) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Case" />
        <CaseDetailSkeleton />
      </View>
    );
  }

  if (isError || !item || !stage) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Case" />
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load this case"
          message={getApiErrorMessage(error)}
          action={<AppButton label="Try again" variant="secondary" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  const openVisit = () => {
    startVisit.mutate(item, {
      onSuccess: () => navigation.navigate('SiteVisit', { caseId: item.id }),
    });
  };

  const cta =
    stage === 'new'
      ? { label: 'Start site visit', icon: 'play-circle-outline' }
      : stage === 'in_progress'
      ? { label: 'Continue visit form', icon: 'clipboard-edit-outline' }
      : stage === 'query'
      ? { label: 'Update visit details', icon: 'clipboard-edit-outline' }
      : null;

  return (
    <View style={styles.flex}>
      <ScreenHeader title={item.caseNumber} subtitle={item.institution?.name} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={darkColors.primary}
            colors={[darkColors.primary]}
          />
        }
      >
        <GlassPanel padded style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.customer}>{item.customerName}</Text>
            <StatusPill status={stage.toUpperCase()} label={VISIT_STAGE_LABEL[stage]} />
          </View>
          <Text style={styles.propertyType}>
            {PROPERTY_TYPE_LABEL[item.propertyType] ?? item.propertyType} property
          </Text>

          <View style={styles.quickActions}>
            {item.customerMobile ? (
              <Pressable
                style={[glassCardStyles.pill, styles.quickAction]}
                onPress={() =>
                  Linking.openURL(`tel:${item.customerMobile.replace(/\s+/g, '')}`).catch(() =>
                    Alert.alert('Could not place call', 'This device cannot open the dialer.'),
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`Call ${item.customerName}`}
              >
                <MaterialCommunityIcons name="phone" size={18} color={darkColors.primarySoft} />
                <Text style={styles.quickActionText}>Call</Text>
              </Pressable>
            ) : null}
            {item.propertyLocation ? (
              <Pressable
                style={[glassCardStyles.pill, styles.quickAction]}
                onPress={() => openMaps(item.propertyLocation as string)}
                accessibilityRole="button"
                accessibilityLabel="Open address in maps"
              >
                <MaterialCommunityIcons name="navigation-variant-outline" size={18} color={darkColors.primarySoft} />
                <Text style={styles.quickActionText}>Directions</Text>
              </Pressable>
            ) : null}
          </View>
        </GlassPanel>

        {stage === 'query' ? (
          <GlassPanel padded style={[styles.card, styles.queryCard]}>
            <View style={styles.queryHeader}>
              <MaterialCommunityIcons name="message-alert-outline" size={20} color={darkColors.destructive} />
              <Text style={styles.queryTitle}>Query from the office</Text>
            </View>
            <Text style={styles.queryText}>
              {latestQuery?.notes || 'The office has raised a query on this visit. Review the details and update the form.'}
            </Text>
            {latestQuery ? (
              <Text style={styles.queryMeta}>
                {latestQuery.actor.name} · {formatDisplayDateTime(latestQuery.createdAt)}
              </Text>
            ) : null}
          </GlassPanel>
        ) : null}

        <GlassPanel padded style={styles.card}>
          <InfoRow icon="phone-outline" label="Customer mobile" value={item.customerMobile} />
          <InfoRow icon="map-marker-outline" label="Property location" value={item.propertyLocation} />
          <InfoRow
            icon="bank-outline"
            label="Bank / branch"
            value={[item.institution?.name, item.branch?.branchName].filter(Boolean).join(', ')}
          />
          <InfoRow icon="pound" label="Bank reference" value={item.bankReference} />
          <InfoRow icon="calendar-clock-outline" label="Deadline" value={formatDisplayDate(item.deadline)} />
        </GlassPanel>

        <GlassPanel padded style={styles.card}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <InfoRow icon="account-check-outline" label="Assigned" value={formatDisplayDateTime(item.assignedAt)} />
          <InfoRow icon="walk" label="Visit started" value={formatDisplayDateTime(item.surveyStartedAt)} />
          <InfoRow icon="send-check-outline" label="Visit submitted" value={formatDisplayDateTime(item.surveyCompletedAt)} />
        </GlassPanel>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {startVisit.error ? <Text style={styles.error}>{startVisit.error.message}</Text> : null}
        {cta ? (
          <AppButton
            label={cta.label}
            icon={<MaterialCommunityIcons name={cta.icon} size={20} color={darkColors.ctaForeground} />}
            onPress={openVisit}
            loading={startVisit.isPending}
          />
        ) : (
          <AppButton
            label="View submitted form"
            variant="secondary"
            icon={<MaterialCommunityIcons name="eye-outline" size={20} color={darkColors.foreground} />}
            onPress={() => navigation.navigate('SiteVisit', { caseId: item.id })}
            disabled={!item.report}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  customer: {
    flex: 1,
    color: darkColors.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
  propertyType: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  quickActionText: {
    color: darkColors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  queryCard: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  queryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  queryTitle: {
    color: darkColors.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  queryText: {
    color: darkColors.foreground,
    fontSize: 14,
    lineHeight: 20,
  },
  queryMeta: {
    color: darkColors.mutedForeground,
    fontSize: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: darkColors.foreground,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: darkColors.border,
    backgroundColor: 'rgba(6, 21, 51, 0.92)',
  },
  error: {
    color: darkColors.destructive,
    fontSize: 13,
    marginBottom: 8,
  },
});
