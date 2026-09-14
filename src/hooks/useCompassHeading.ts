import { useEffect, useState } from 'react';
import CompassHeading from 'react-native-compass-heading';

/** Device heading in degrees (0 = north), updated when it changes by at least 3°. */
export const useCompassHeading = (enabled: boolean) => {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    CompassHeading.start(3, ({ heading: next }: { heading: number }) => {
      setHeading(next);
    });
    return () => {
      CompassHeading.stop();
    };
  }, [enabled]);

  return heading;
};
