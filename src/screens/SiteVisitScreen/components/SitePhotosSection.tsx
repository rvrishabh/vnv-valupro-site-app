import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SectionCard } from '../../../components/SectionCard';
import { useDeleteSitePhotoMutation } from '../../../mutations/site-visit/useDeleteSitePhotoMutation';
import { useUploadSitePhotoMutation } from '../../../mutations/site-visit/useUploadSitePhotoMutation';
import { AppStackParamList } from '../../../navigation/types';
import { useGetValuationPhotosQuery } from '../../../queries/cases/useGetValuationPhotosQuery';
import { capturedPhotoStore } from '../../../stores/capturedPhotoStore';
import { authGlass } from '../../../theme/glassSurface';
import { darkColors } from '../../../theme/colors';
import {
  LocalPhoto,
  MAX_SITE_VISIT_PHOTOS,
  MIN_SITE_VISIT_PHOTOS,
  ValuationPhoto,
} from '../../../types/site-visit.types';

const TILE_GAP = 8;

type PendingUpload = LocalPhoto & {
  key: string;
  status: 'uploading' | 'failed';
  error?: string;
};

type SitePhotosSectionProps = {
  valuationId: string;
  readOnly?: boolean;
  error?: string;
};

export function SitePhotosSection({ valuationId, readOnly, error }: SitePhotosSectionProps) {
  const { data: photos = [], isLoading } = useGetValuationPhotosQuery(valuationId);
  const upload = useUploadSitePhotoMutation();
  const remove = useDeleteSitePhotoMutation();
  const [pending, setPending] = useState<PendingUpload[]>([]);
  // Explicit square size: percentage width + aspectRatio inside a wrapping row
  // lets Yoga squash later rows, which pushed the icon down in the second row.
  const [gridWidth, setGridWidth] = useState(0);
  const tileSide = gridWidth > 0 ? Math.floor((gridWidth - TILE_GAP * 2) / 3) : undefined;
  const tileSize = tileSide ? { width: tileSide, height: tileSide } : undefined;
  const [preview, setPreview] = useState<ValuationPhoto | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const sitePhotos = photos.filter(photo => photo.section === 'SITE_VISIT');
  const used = sitePhotos.length + pending.filter(p => p.status === 'uploading').length;
  const remaining = Math.max(0, MAX_SITE_VISIT_PHOTOS - used);

  const uploadOne = async (item: PendingUpload) => {
    setPending(list =>
      list.map(p => (p.key === item.key ? { ...p, status: 'uploading', error: undefined } : p)),
    );
    try {
      await upload.mutateAsync({ valuationId, photo: item });
      setPending(list => list.filter(p => p.key !== item.key));
    } catch (uploadError) {
      setPending(list =>
        list.map(p =>
          p.key === item.key
            ? { ...p, status: 'failed', error: (uploadError as Error).message }
            : p,
        ),
      );
    }
  };

  // Uploads run one at a time: parallel multipart uploads on a weak site
  // connection mostly just time out together.
  const queue = useRef(Promise.resolve());
  const uploadOneRef = useRef(uploadOne);
  uploadOneRef.current = uploadOne;

  const enqueue = (photo: LocalPhoto) => {
    const item: PendingUpload = {
      ...photo,
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: 'uploading',
    };
    setPending(list => [...list, item]);
    queue.current = queue.current.then(() => uploadOneRef.current(item));
  };
  const enqueueRef = useRef(enqueue);
  enqueueRef.current = enqueue;

  // Stamped shots from the in-app geo camera arrive here while the engineer
  // keeps shooting.
  useEffect(
    () => capturedPhotoStore.subscribe(valuationId, photo => enqueueRef.current(photo)),
    [valuationId],
  );

  // Photos already on the phone — e.g. shot with no signal, or with the stock
  // camera. They carry no geo stamp, so the GPS field and camera remain the
  // proof of presence.
  const pickFromGallery = async () => {
    if (remaining === 0) {
      Alert.alert(
        'Photo limit reached',
        `A visit can have up to ${MAX_SITE_VISIT_PHOTOS} site photos.`,
      );
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: remaining,
      maxWidth: 2000,
      maxHeight: 2000,
      quality: 0.8,
    });
    if (result.errorCode) {
      Alert.alert('Could not open gallery', result.errorMessage ?? result.errorCode);
      return;
    }
    (result.assets ?? []).forEach(asset => {
      if (asset.uri) {
        enqueue({
          uri: asset.uri,
          type: asset.type ?? 'image/jpeg',
          fileName: asset.fileName ?? `gallery-${Date.now()}.jpg`,
        });
      }
    });
  };

  const retryAll = () => {
    pending
      .filter(p => p.status === 'failed')
      .forEach(item => {
        queue.current = queue.current.then(() => uploadOneRef.current(item));
      });
  };

  const openCamera = () => {
    if (remaining === 0) {
      Alert.alert(
        'Photo limit reached',
        `A visit can have up to ${MAX_SITE_VISIT_PHOTOS} site photos.`,
      );
      return;
    }
    navigation.navigate('GeoCamera', { valuationId, remaining });
  };

  const confirmDelete = (photo: ValuationPhoto) => {
    Alert.alert('Remove photo?', 'This photo will be deleted from the case.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setPreview(null);
          remove.mutate(
            { valuationId, photoId: photo.id },
            { onError: e => Alert.alert('Could not remove photo', e.message) },
          );
        },
      },
    ]);
  };

  return (
    <SectionCard
      title="Site photos"
      icon="camera-outline"
      meta={`${sitePhotos.length} / ${MAX_SITE_VISIT_PHOTOS}`}
    >
      {!readOnly ? (
        <Text style={styles.hint}>
          Take at least {MIN_SITE_VISIT_PHOTOS} photos at the site — front elevation, road, each
          floor, meter and surroundings. Camera photos are stamped with GPS location, direction and
          time and upload as soon as they are taken. With no signal, keep shooting or add from your
          gallery and tap Retry when you are back online. The office chooses which photos go into
          the report.
        </Text>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={darkColors.primary} style={styles.loader} />
      ) : (
        <View style={styles.grid} onLayout={event => setGridWidth(event.nativeEvent.layout.width)}>
          {sitePhotos.map(photo => (
            <Pressable
              key={photo.id}
              style={[styles.tile, tileSize]}
              onPress={() => setPreview(photo)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Open site photo"
            >
              <Image source={{ uri: photo.url }} style={styles.image} />
            </Pressable>
          ))}

          {pending.map(item => (
            <Pressable
              key={item.key}
              style={[styles.tile, tileSize]}
              disabled={item.status !== 'failed'}
              onPress={() => uploadOne(item)}
              accessibilityLabel={item.status === 'failed' ? 'Retry upload' : 'Uploading photo'}
            >
              <Image source={{ uri: item.uri }} style={[styles.image, styles.imageDimmed]} />
              <View style={styles.overlay}>
                {item.status === 'uploading' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
                    <Text style={styles.overlayText}>Retry</Text>
                  </>
                )}
              </View>
              {item.status === 'failed' ? (
                <Pressable
                  style={styles.dismiss}
                  hitSlop={8}
                  onPress={() => setPending(list => list.filter(p => p.key !== item.key))}
                  accessibilityLabel="Discard photo"
                >
                  <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </Pressable>
          ))}

          {!readOnly && remaining > 0 ? (
            <>
              <TouchableOpacity
                style={[styles.tile, tileSize, styles.addTile]}
                onPress={openCamera}
                accessibilityRole="button"
                accessibilityLabel="Open geo camera"
              >
                <MaterialCommunityIcons
                  name="camera-marker-outline"
                  size={28}
                  color={darkColors.primary}
                />
                <Text style={styles.addText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tile, tileSize, styles.addTile]}
                onPress={pickFromGallery}
                accessibilityRole="button"
                accessibilityLabel="Add photos from gallery"
              >
                <MaterialCommunityIcons name="image-plus" size={28} color={darkColors.primary} />
                <Text style={styles.addText}>Gallery</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      )}

      {pending.some(p => p.status === 'failed') ? (
        <View style={styles.failedRow}>
          <Text style={[styles.error, styles.failedText]}>
            {pending.filter(p => p.status === 'failed').length} photo(s) not uploaded —{' '}
            {pending.find(p => p.status === 'failed')?.error ?? 'upload failed'}. Tap a photo to
            retry.
          </Text>
          <TouchableOpacity
            onPress={retryAll}
            accessibilityRole="button"
            accessibilityLabel="Retry all uploads"
          >
            <Text style={styles.retryAll}>Retry all</Text>
          </TouchableOpacity>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}

      <Modal
        visible={!!preview}
        animationType="fade"
        transparent
        onRequestClose={() => setPreview(null)}
      >
        {/* A Modal is its own native view controller, so it needs its own
            SafeAreaProvider to measure the notch (same as GeoCameraScreen). */}
        <SafeAreaProvider>
          <View style={styles.previewBackdrop}>
            <SafeAreaView style={styles.previewSafe}>
              <View style={styles.previewActions}>
                {!readOnly && preview ? (
                  <Pressable
                    onPress={() => confirmDelete(preview)}
                    style={styles.previewButton}
                    accessibilityLabel="Delete photo"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={24}
                      color={darkColors.destructive}
                    />
                  </Pressable>
                ) : (
                  <View />
                )}
                <Pressable
                  onPress={() => setPreview(null)}
                  style={styles.previewButton}
                  accessibilityLabel="Close preview"
                >
                  <MaterialCommunityIcons name="close" size={26} color="#FFFFFF" />
                </Pressable>
              </View>
              {preview ? (
                <Image
                  source={{ uri: preview.url }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : null}
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  hint: {
    color: darkColors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    marginBottom: 12,
  },
  tile: {
    flexShrink: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: authGlass.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageDimmed: {
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  dismiss: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(201, 168, 76, 0.6)',
  },
  addText: {
    color: darkColors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  error: {
    color: darkColors.destructive,
    fontSize: 12,
    marginBottom: 12,
  },
  failedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  failedText: {
    flex: 1,
    marginBottom: 0,
  },
  retryAll: {
    color: darkColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  previewSafe: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewButton: {
    padding: 10,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
});
