export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export const generateInviteCode = (): string =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export const hexToRgba = (hex: string, alpha: number): string => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
};

export const PRESET_COLORS = [
  '#FF6B9D', '#FF8E53', '#FFC107', '#4CAF50',
  '#4FC3F7', '#7C4DFF', '#E91E63', '#009688',
  '#FF5722', '#8BC34A', '#03A9F4', '#9C27B0',
  '#F44336', '#FF9800', '#CDDC39', '#00BCD4',
  '#3F51B5', '#795548', '#607D8B', '#EC407A',
];

export const CHILD_EMOJIS = ['👦', '👧', '🧒', '👶', '🐣', '⭐', '🌟', '🌈'];

export const DEFAULT_CATEGORIES = [
  { name: 'オムツ',    emoji: '🧷' },
  { name: 'トップス',  emoji: '👕' },
  { name: 'ボトムス',  emoji: '👖' },
  { name: 'アウター',  emoji: '🧥' },
  { name: 'くつ',      emoji: '👟' },
  { name: 'アクセサリー', emoji: '🎀' },
  { name: 'おもちゃ',  emoji: '🧸' },
  { name: 'その他',    emoji: '📦' },
];

/** Convert a File or Blob to base64 data URL */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/** Resize an image to max 800x800 and return blob */
export const resizeImage = async (
  file: File,
  maxSize = 800,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
    };
    img.onerror = reject;
    img.src = url;
  });
};
