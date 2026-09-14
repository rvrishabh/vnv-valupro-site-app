import { LocalPhoto } from '../types/site-visit.types';

type Listener = (photo: LocalPhoto) => void;

const listeners = new Map<string, Set<Listener>>();

/**
 * Hands stamped photos from the camera screen to the visit form's photo grid,
 * which stays mounted underneath and uploads each one as it arrives — so the
 * engineer can keep shooting while earlier photos upload.
 */
export const capturedPhotoStore = {
  emit: (valuationId: string, photo: LocalPhoto) => {
    listeners.get(valuationId)?.forEach(listener => listener(photo));
  },
  subscribe: (valuationId: string, listener: Listener) => {
    const set = listeners.get(valuationId) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(valuationId, set);
    return () => {
      set.delete(listener);
    };
  },
};
