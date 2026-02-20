export interface Child {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  order: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  childId: string; // child id or 'all' for shared items
  size: string;
  brand: string;
  quantity: number;
  notes: string;
  imageUri: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  version: number;
  familyName: string;
  children: Child[];
  categories: Category[];
  items: InventoryItem[];
}

export type RootStackParamList = {
  Home: undefined;
  CategoryDetail: { categoryId: string };
  AddEditItem: { itemId?: string; categoryId?: string };
  Settings: undefined;
};

export type FilterState = {
  size: string;
  brand: string;
  childId: string;
};
