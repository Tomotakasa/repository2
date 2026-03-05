import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { AppData } from '../types';

const STORAGE_KEY = '@family_inventory_v1';
export const IMAGES_DIR = FileSystem.documentDirectory + 'inventory_images/';

export const initializeImageDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  }
};

export const saveImageLocally = async (uri: string): Promise<string> => {
  await initializeImageDir();
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const filename = `img_${Date.now()}.${ext}`;
  const destPath = IMAGES_DIR + filename;
  await FileSystem.copyAsync({ from: uri, to: destPath });
  return destPath;
};

export const deleteLocalImage = async (uri: string): Promise<void> => {
  try {
    if (uri && uri.startsWith(FileSystem.documentDirectory || '')) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (e) {
    console.warn('Failed to delete image:', e);
  }
};

export const loadData = async (): Promise<AppData | null> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? (JSON.parse(json) as AppData) : null;
  } catch (e) {
    console.error('Failed to load data:', e);
    return null;
  }
};

export const saveData = async (data: AppData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
};

export const exportDataAsJson = (data: AppData): string => {
  // Export without image URIs (they are device-local)
  const exportData = {
    ...data,
    items: data.items.map((item) => ({ ...item, imageUri: null })),
    exportedAt: new Date().toISOString(),
    note: '画像は端末ローカルのため共有されません',
  };
  return JSON.stringify(exportData, null, 2);
};

export const importDataFromJson = (json: string): AppData => {
  const parsed = JSON.parse(json) as AppData;
  if (!parsed.version || !parsed.children || !parsed.categories) {
    throw new Error('Invalid data format');
  }
  return parsed;
};
