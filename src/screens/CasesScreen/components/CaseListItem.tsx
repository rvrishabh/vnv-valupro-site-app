import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GlassPanel } from '../../../components/GlassPanel';
import { StatusPill } from '../../../components/StatusPill';
import { glassListItemSpacing } from '../../../theme/glassSurface';
import { darkColors } from '../../../theme/colors';
import { Case } from '../../../types/case.types';
import { formatDisplayDate } from '../../../utils/date.utils';
import { getVisitStage, VISIT_STAGE_LABEL } from '../../../utils/site-visit.utils';

type CaseListItemProps = {
  item: Case;
  index: number;
  onPress: () => void;
};

export function CaseListItem({ item, index, onPress }: CaseListItemProps) {
  const stage = getVisitStage(item);
  const bank = [item.institution?.name, item.branch?.branchName].filter(Boolean).join(' · ');

  return (
    <GlassPanel padded onPress={onPress} enterIndex={Math.min(index, 8)} style={glassListItemSpacing}>
      <View style={styles.topRow}>
        <Text style={styles.caseNumber}>{item.caseNumber}</Text>
        <StatusPill status={stage.toUpperCase()} label={VISIT_STAGE_LABEL[stage]} />
      </View>

      <Text style={styles.customer} numberOfLines={1}>
        {item.customerName}
      </Text>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="map-marker-outline" size={16} color={darkColors.mutedForeground} />
        <Text style={styles.metaText} numberOfLines={2}>
          {item.propertyLocation || 'Address not provided'}
        </Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="bank-outline" size={16} color={darkColors.mutedForeground} />
          <Text style={styles.metaText} numberOfLines={1}>
            {bank || '—'}
          </Text>
        </View>
        <Text style={styles.date}>
          {item.deadline ? `Due ${formatDisplayDate(item.deadline)}` : formatDisplayDate(item.assignedAt ?? item.createdAt)}
        </Text>
      </View>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  caseNumber: {
    color: darkColors.primarySoft,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  customer: {
    color: darkColors.foreground,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexShrink: 1,
  },
  metaText: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    flexShrink: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  date: {
    color: darkColors.mutedForeground,
    fontSize: 12,
  },
});
