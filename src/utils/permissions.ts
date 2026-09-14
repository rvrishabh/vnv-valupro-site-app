import { PermissionsAndroid, Platform } from 'react-native';
import CameraKit from 'react-native-camera-kit';

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
  return Boolean(await CameraKit.requestDeviceCameraAuthorization());
};
