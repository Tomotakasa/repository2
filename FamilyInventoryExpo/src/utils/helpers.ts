export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
};

export const PRESET_COLORS = [
  '#FF6B9D', '#FF8E53', '#FFC107', '#4CAF50',
  '#4FC3F7', '#7C4DFF', '#E91E63', '#009688',
  '#FF5722', '#8BC34A', '#03A9F4', '#9C27B0',
  '#F44336', '#FF9800', '#CDDC39', '#00BCD4',
  '#3F51B5', '#795548', '#607D8B', '#E91E63',
];

export const CHILD_EMOJIS = ['👦', '👧', '🧒', '👶', '🐣', '⭐', '🌟', '🌈'];
