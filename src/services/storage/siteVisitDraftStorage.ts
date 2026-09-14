import AsyncStorage from '@react-native-async-storage/async-storage';
import { SiteVisitFormValues } from '../../schemas/site-visit.schema';

/**
 * Local copy of an in-progress visit form, written as the engineer types.
 * Sites often have no signal, so nothing typed should depend on a save
 * reaching the server; the draft is dropped once the visit is submitted.
 */
const PREFIX = 'vnv_site_visit_draft:';

interface StoredDraft {
  values: SiteVisitFormValues;
  savedAt: string;
}

export const getSiteVisitDraft = async (caseId: string): Promise<StoredDraft | null> => {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + caseId);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
};

export const setSiteVisitDraft = async (caseId: string, values: SiteVisitFormValues) => {
  const draft: StoredDraft = { values, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(PREFIX + caseId, JSON.stringify(draft));
};

export const removeSiteVisitDraft = async (caseId: string) => {
  await AsyncStorage.removeItem(PREFIX + caseId);
};

export const clearAllSiteVisitDrafts = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const draftKeys = keys.filter(key => key.startsWith(PREFIX));
  if (draftKeys.length) {
    await AsyncStorage.multiRemove(draftKeys);
  }
};
