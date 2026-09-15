import { PermissionsAndroid, Platform, TurboModuleRegistry } from 'react-native';

// `Camera` from react-native-camera-kit only exposes authorization checks
// through a mounted component's ref, so we call the underlying native
// module directly here, before any Camera view exists.
type CameraKitModule = { checkDeviceCameraAuthorizationStatus(): Promise<boolean>; getConstants?(): {} };
const cameraKitModule = TurboModuleRegistry.get<CameraKitModule>('RNCameraKitModule');

export const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') {
    // iOS prompts from the geolocation module on first use.
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'VNV Site records the GPS location of the property you are visiting.',
      buttonPositive: 'Allow',
    },
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
      title: 'Camera permission',
      message: 'VNV Site takes geo-tagged photos of the property during a site visit.',
      buttonPositive: 'Allow',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  return Boolean(await cameraKitModule?.checkDeviceCameraAuthorizationStatus());
};
