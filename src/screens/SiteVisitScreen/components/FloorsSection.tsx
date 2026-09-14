import React from 'react';
import { Control, useFieldArray, useWatch } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppButton } from '../../../components/AppButton';
import { FormChipSelect } from '../../../components/form/FormChipSelect';
import { FormTextInput } from '../../../components/form/FormTextInput';
import { SectionCard } from '../../../components/SectionCard';
import {
  emptyFloor,
  FLOOR_OPTIONS,
  SiteVisitFormValues,
} from '../../../schemas/site-visit.schema';
import { authGlass } from '../../../theme/glassSurface';
import { darkColors } from '../../../theme/colors';

type FloorsSectionProps = {
  control: Control<SiteVisitFormValues>;
  readOnly?: boolean;
};

/** The paper form's "Covered area" and "No. of rooms" grids, one row per floor. */
export function FloorsSection({ control, readOnly }: FloorsSectionProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'floors' });
  const floors = useWatch({ control, name: 'floors' }) ?? [];

  const addFloor = () => {
    const used = new Set(floors.map(floor => floor.name));
    const next = FLOOR_OPTIONS.find(option => !used.has(option)) ?? '';
    append(emptyFloor(next));
  };

  return (
    <SectionCard title="Floors — covered area & rooms" icon="office-building-outline">
      {fields.length === 0 ? (
        <Text style={styles.empty}>No construction recorded (open plot).</Text>
      ) : null}

      {fields.map((field, index) => (
        <View key={field.id} style={styles.floor}>
          <View style={styles.floorHeader}>
            <Text style={styles.floorTitle}>{floors[index]?.name || `Floor ${index + 1}`}</Text>
            {!readOnly ? (
              <Pressable
                onPress={() => remove(index)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Remove floor"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={darkColors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          <FormChipSelect control={control} name={`floors.${index}.name`} label="Floor" options={FLOOR_OPTIONS} required />

          <FormTextInput
            control={control}
            name={`floors.${index}.coveredArea`}
            label="Covered area"
            placeholder="e.g. Full covered 23' x 31', (7' x 11')"
          />

          <View style={styles.countRow}>
            <View style={styles.countCell}>
              <FormTextInput control={control} name={`floors.${index}.rooms`} label="Rooms" placeholder="0" keyboardType="number-pad" maxLength={3} />
            </View>
            <View style={styles.countCell}>
              <FormTextInput control={control} name={`floors.${index}.toilets`} label="Toilets" placeholder="0" keyboardType="number-pad" maxLength={3} />
            </View>
            <View style={styles.countCell}>
              <FormTextInput control={control} name={`floors.${index}.kitchens`} label="Kitchen" placeholder="0" keyboardType="number-pad" maxLength={3} />
            </View>
          </View>

          <FormTextInput
            control={control}
            name={`floors.${index}.others`}
            label="Other spaces"
            placeholder="e.g. 1 drawing room, 1 lobby, 1 balcony"
          />
        </View>
      ))}

      {!readOnly && fields.length < FLOOR_OPTIONS.length ? (
        <AppButton
          label="Add floor"
          variant="secondary"
          icon={<MaterialCommunityIcons name="plus" size={20} color={darkColors.foreground} />}
          onPress={addFloor}
          style={styles.addButton}
        />
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: darkColors.mutedForeground,
    fontSize: 14,
    marginBottom: 12,
  },
  floor: {
    borderWidth: 1,
    borderColor: authGlass.border,
    borderRadius: 14,
    padding: 12,
    paddingBottom: 0,
    marginBottom: 12,
  },
  floorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  floorTitle: {
    color: darkColors.primarySoft,
    fontSize: 15,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countCell: {
    flex: 1,
  },
  addButton: {
    marginBottom: 14,
  },
});
