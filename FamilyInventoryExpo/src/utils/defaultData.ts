import { AppData } from '../types';
import { generateId } from './helpers';

export const createDefaultData = (): AppData => {
  const child1Id = generateId();
  const child2Id = generateId();

  return {
    version: 1,
    familyName: 'わが家',
    children: [
      { id: child1Id, name: 'たろう', color: '#FF6B9D', emoji: '👦' },
      { id: child2Id, name: 'はなこ', color: '#4FC3F7', emoji: '👧' },
    ],
    categories: [
      { id: generateId(), name: 'オムツ', emoji: '🧷', order: 0 },
      { id: generateId(), name: 'トップス', emoji: '👕', order: 1 },
      { id: generateId(), name: 'ボトムス', emoji: '👖', order: 2 },
      { id: generateId(), name: 'アウター', emoji: '🧥', order: 3 },
      { id: generateId(), name: 'くつ', emoji: '👟', order: 4 },
      { id: generateId(), name: 'アクセサリー', emoji: '🎀', order: 5 },
      { id: generateId(), name: 'おもちゃ', emoji: '🧸', order: 6 },
      { id: generateId(), name: 'その他', emoji: '📦', order: 7 },
    ],
    items: [],
  };
};
