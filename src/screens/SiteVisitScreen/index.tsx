import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Control, FieldErrors, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Toast } from 'toastify-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getApiErrorMessage } from '../../api';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { FormChipSelect } from '../../components/form/FormChipSelect';
import { FormTextInput } from '../../components/form/FormTextInput';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SectionCard } from '../../components/SectionCard';
import { useSaveSiteVisitMutation } from '../../mutations/site-visit/useSaveSiteVisitMutation';
import { AppStackParamList } from '../../navigation/types';
import { caseQueryKeys } from '../../queries/cases/caseQueryKeys';
import { useGetCaseByIdQuery } from '../../queries/cases/useGetCaseByIdQuery';
import {
  AUTHORITY_OPTIONS,
  DIRECTIONS,
  METER_OPTIONS,
  OCCUPIED_BY_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  SiteVisitData,
  SiteVisitFormValues,
  siteVisitSchema,
  STRUCTURE_OPTIONS,
  YES_NO_OPTIONS,
} from '../../schemas/site-visit.schema';
import {
  getSiteVisitDraft,
  setSiteVisitDraft,
} from '../../services/storage/siteVisitDraftStorage';
import { darkColors } from '../../theme/colors';
import { MIN_SITE_VISIT_PHOTOS, ValuationPhoto } from '../../types/site-visit.types';
import { formatDisplayDateTime, todayIsoDate } from '../../utils/date.utils';
import { buildInitialValues, isVisitEditable } from '../../utils/site-visit.utils';
import { FloorsSection } from './components/FloorsSection';
import { GpsField } from './components/GpsField';
import { SitePhotosSection } from './components/SitePhotosSection';

type Props = NativeStackScreenProps<AppStackParamList, 'SiteVisit'>;

const DIRECTION_LABEL = { east: 'East', west: 'West', north: 'North', south: 'South' } as const;
const AUTOSAVE_DELAY_MS = 800;

const countErrors = (errors: FieldErrors): number =>
  Object.values(errors).reduce((total: number, entry) => {
    if (!entry) {
      return total;
    }
    if (typeof (entry as { message?: unknown }).message === 'string') {
      return total + 1;
    }
    return total + countErrors(entry as FieldErrors);
  }, 0);

/** Approximate plot area from the four sides — a sanity check for the engineer, not stored. */
const PlotAreaHint = ({ control }: { control: Control<SiteVisitFormValues> }) => {
  const dimensions = useWatch({ control, name: 'dimensions' });
  const [n, s, e, w] = [dimensions?.north, dimensions?.south, dimensions?.east, dimensions?.west].map(
    v => Number(v) || 0,
  );
  const width = n && s ? (n + s) / 2 : n || s;
  const depth = e && w ? (e + w) / 2 : e || w;
  if (!width || !depth) {
    return null;
  }
  const sqft = width * depth;
  return (
    <Text style={styles.hint}>
      ≈ {Math.round(sqft).toLocaleString('en-IN')} sq.ft ({(sqft * 0.092903).toFixed(1)} sq.m)
    </Text>
  );
};

export default function SiteVisitScreen({ route, navigation }: Props) {
  const { caseId } = route.params;
  const queryClient = useQueryClient();
  const { data: item, isLoading, isError, error, refetch } = useGetCaseByIdQuery(caseId);
  const save = useSaveSiteVisitMutation();
  const scrollRef = useRef<ScrollView>(null);
  const [ready, setReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();

  const editable = item ? isVisitEditable(item) : false;
  const valuationId = item?.report?.id;

  const form = useForm<SiteVisitFormValues, unknown, SiteVisitData>({
    resolver: zodResolver(siteVisitSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const { control, reset, handleSubmit, getValues, watch } = form;

  // Pick the newer of the phone draft and what the server has, once per case.
  useEffect(() => {
    if (!item || ready) {
      return;
    }
    let cancelled = false;
    (async () => {
      const serverValues = buildInitialValues(item);
      const draft = editable ? await getSiteVisitDraft(item.id) : null;
      const serverSavedAt = (item.report?.siteVisit as { savedAt?: string } | null)?.savedAt;
      const useDraft = draft && (!serverSavedAt || draft.savedAt > serverSavedAt);
      if (cancelled) {
        return;
      }
      reset(useDraft ? { ...serverValues, ...draft.values } : serverValues);
      setDraftSavedAt(useDraft ? draft.savedAt : null);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [item, ready, editable, reset]);

  // Local autosave — nothing typed at a site with no signal should be lost.
  useEffect(() => {
    if (!ready || !editable) {
      return;
    }
    let handle: ReturnType<typeof setTimeout> | undefined;
    const subscription = watch(() => {
      if (handle) {
        clearTimeout(handle);
      }
      handle = setTimeout(() => {
        const savedAt = new Date().toISOString();
        setSiteVisitDraft(caseId, getValues())
          .then(() => setDraftSavedAt(savedAt))
          .catch(() => undefined);
      }, AUTOSAVE_DELAY_MS);
    });
    return () => {
      if (handle) {
        clearTimeout(handle);
      }
      subscription.unsubscribe();
    };
  }, [ready, editable, watch, getValues, caseId]);

  const readOnly = !editable;
  const sitePhotoCount = () =>
    (queryClient.getQueryData<ValuationPhoto[]>(caseQueryKeys.photos(valuationId ?? '')) ?? []).filter(
      photo => photo.section === 'SITE_VISIT',
    ).length;

  const onSaveDraft = () => {
    if (!item || !valuationId) {
      return;
    }
    save.mutate(
      { item, valuationId, values: getValues() as SiteVisitData, final: false },
      {
        onSuccess: () => Toast.success('Draft saved to the office'),
        onError: e => Toast.error(e.message),
      },
    );
  };

  const onValidSubmit = (values: SiteVisitData) => {
    if (!item || !valuationId) {
      return;
    }
    const photos = sitePhotoCount();
    if (photos < MIN_SITE_VISIT_PHOTOS) {
      setPhotoError(`Add at least ${MIN_SITE_VISIT_PHOTOS} site photos (${photos} added).`);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setPhotoError(undefined);

    Alert.alert(
      'Submit site visit?',
      'The details and photos will be sent to the office for the valuation report.',
      [
        { text: 'Review again', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            save.mutate(
              { item, valuationId, values, final: true },
              {
                onSuccess: () => {
                  Toast.success('Site visit submitted');
                  navigation.popToTop();
                },
                onError: e => Alert.alert('Submission failed', e.message),
              },
            ),
        },
      ],
    );
  };

  const onInvalidSubmit = (errors: FieldErrors<SiteVisitFormValues>) => {
    const count = countErrors(errors);
    Toast.error(`${count} field${count === 1 ? ' needs' : 's need'} attention`);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const subtitle = useMemo(() => {
    if (!item) {
      return undefined;
    }
    if (readOnly) {
      return `Submitted ${formatDisplayDateTime(item.surveyCompletedAt)}`;
    }
    return draftSavedAt ? `Saved on phone · ${formatDisplayDateTime(draftSavedAt)}` : item.customerName;
  }, [item, readOnly, draftSavedAt]);

  if (isLoading || (item && !ready)) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Site visit" />
        <ActivityIndicator color={darkColors.primary} style={styles.loader} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Site visit" />
        <EmptyState
          icon="alert-circle-outline"
          title="Could not load this case"
          message={getApiErrorMessage(error)}
          action={<AppButton label="Try again" variant="secondary" onPress={() => refetch()} />}
        />
      </View>
    );
  }

  if (!valuationId) {
    return (
      <View style={styles.flex}>
        <ScreenHeader title="Site visit" />
        <EmptyState
          icon="clipboard-alert-outline"
          title="Visit not started"
          message="Start the visit from the case screen first."
        />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Visit · ${item.caseNumber}`} subtitle={subtitle} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {readOnly ? (
            <View style={styles.readOnlyBanner}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={darkColors.mutedForeground} />
              <Text style={styles.readOnlyText}>
                This visit was submitted. It can be edited again only if the office raises a query.
              </Text>
            </View>
          ) : null}

          <SitePhotosSection valuationId={valuationId} readOnly={readOnly} error={photoError} />

          <View pointerEvents={readOnly ? 'none' : 'auto'}>
            <SectionCard title="Visit details" icon="clipboard-text-outline">
              <FormTextInput
                control={control}
                name="visitDate"
                label="Visit date"
                placeholder="YYYY-MM-DD"
                required
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                right={
                  !readOnly ? (
                    <Text style={styles.inlineAction} onPress={() => form.setValue('visitDate', todayIsoDate())}>
                      Today
                    </Text>
                  ) : undefined
                }
              />
              <FormTextInput control={control} name="bankName" label="Bank name" placeholder="Bank & branch" />
              <FormTextInput control={control} name="ownerName" label="Client / owner / firm name" required autoCapitalize="words" />
              <FormTextInput
                control={control}
                name="addressAsPerSite"
                label="Address (as per site)"
                placeholder="House no., street, locality, city"
                required
                multiline
              />
              <FormTextInput control={control} name="landmark" label="Landmark" placeholder="e.g. Near Ram Darbar" />
            </SectionCard>

            <SectionCard title="Person met at site" icon="account-tie-outline">
              <FormTextInput control={control} name="personMetName" label="Name" required autoCapitalize="words" />
              <FormTextInput
                control={control}
                name="personMetMobile"
                label="Mobile"
                placeholder="10 digit mobile"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </SectionCard>

            <SectionCard title="Location & authority" icon="map-marker-radius-outline">
              <GpsField control={control} readOnly={readOnly} />
              <FormChipSelect control={control} name="authority" label="Authority" options={AUTHORITY_OPTIONS} />
              <FormTextInput control={control} name="meterNumber" label="Meter no." placeholder="Electricity meter number" autoCapitalize="characters" />
              <FormChipSelect control={control} name="meterStatus" label="Meter vs documents" options={METER_OPTIONS} />
            </SectionCard>

            <SectionCard title="Occupancy & surroundings" icon="home-account">
              <FormChipSelect control={control} name="occupiedBy" label="Occupied by" options={OCCUPIED_BY_OPTIONS} />
              <FormTextInput control={control} name="occupancy" label="Occupancy" placeholder="e.g. Self occupied, fully used" />
              <FormChipSelect control={control} name="communityDominated" label="Community dominated area" options={YES_NO_OPTIONS} />
              <FormChipSelect control={control} name="highTension" label="High tension line nearby" options={YES_NO_OPTIONS} />
            </SectionCard>

            <SectionCard title="Rates" icon="currency-inr">
              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <FormTextInput control={control} name="rateByOwner" label="By owner (₹/sq.ft)" placeholder="14000" keyboardType="decimal-pad" />
                </View>
                <View style={styles.col}>
                  <FormTextInput control={control} name="rateByLocals" label="By locals (₹/sq.ft)" placeholder="8000" keyboardType="decimal-pad" />
                </View>
              </View>
              <FormTextInput
                control={control}
                name="propertyDealerRef"
                label="Property dealer / reference no."
                placeholder="Name and phone"
              />
            </SectionCard>

            <SectionCard title="Construction" icon="home-city-outline">
              <FormChipSelect control={control} name="typeOfProperty" label="Type of property" options={PROPERTY_TYPE_OPTIONS} required />
              <FormChipSelect
                control={control}
                name="structureTypes"
                label="Structure type"
                options={STRUCTURE_OPTIONS}
                multiple
                helperText="Select all that apply"
              />
              <FormTextInput
                control={control}
                name="ageOfProperty"
                label="Year of construction"
                placeholder="e.g. 2010"
                keyboardType="number-pad"
                maxLength={4}
              />
            </SectionCard>

            <SectionCard title="Boundaries (as per site)" icon="compass-outline">
              {DIRECTIONS.map(direction => (
                <FormTextInput
                  key={direction}
                  control={control}
                  name={`boundaries.${direction}`}
                  label={DIRECTION_LABEL[direction]}
                  placeholder={direction === 'south' ? 'e.g. 36 ft wide road' : 'e.g. House of …'}
                />
              ))}
            </SectionCard>

            <SectionCard title="Plot dimensions & road" icon="ruler-square">
              <View style={styles.twoCol}>
                {DIRECTIONS.map(direction => (
                  <View key={direction} style={styles.halfCell}>
                    <FormTextInput
                      control={control}
                      name={`dimensions.${direction}`}
                      label={`${DIRECTION_LABEL[direction]} (ft)`}
                      placeholder="0"
                      keyboardType="decimal-pad"
                    />
                  </View>
                ))}
              </View>
              <PlotAreaHint control={control} />
              <FormTextInput control={control} name="roadWidth" label="Road width" placeholder="e.g. 36 ft" />
              <FormChipSelect
                control={control}
                name="roadSide"
                label="Road on side"
                options={['East', 'West', 'North', 'South']}
              />
            </SectionCard>

            <FloorsSection control={control} readOnly={readOnly} />

            <SectionCard title="Remarks" icon="note-text-outline">
              <FormTextInput
                control={control}
                name="remarks"
                label="Remarks"
                placeholder="Anything the office should know about this property"
                multiline
              />
            </SectionCard>
          </View>
        </ScrollView>

        {!readOnly ? (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <AppButton
              label="Save draft"
              variant="secondary"
              onPress={onSaveDraft}
              loading={save.isPending && save.variables?.final === false}
              disabled={save.isPending}
              style={styles.footerButton}
            />
            <AppButton
              label="Submit visit"
              icon={<MaterialCommunityIcons name="send" size={18} color={darkColors.ctaForeground} />}
              onPress={handleSubmit(onValidSubmit, onInvalidSubmit)}
              loading={save.isPending && save.variables?.final === true}
              disabled={save.isPending}
              style={styles.footerButtonPrimary}
            />
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loader: { marginTop: 48 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  readOnlyText: {
    flex: 1,
    color: darkColors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineAction: {
    color: darkColors.primarySoft,
    fontSize: 14,
    fontWeight: '700',
  },
  twoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  col: {
    flex: 1,
  },
  halfCell: {
    width: '48%',
    flexGrow: 1,
  },
  hint: {
    color: darkColors.primarySoft,
    fontSize: 13,
    fontWeight: '600',
    marginTop: -6,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: darkColors.border,
    backgroundColor: 'rgba(6, 21, 51, 0.94)',
  },
  footerButton: {
    flex: 1,
  },
  footerButtonPrimary: {
    flex: 1.4,
  },
});
