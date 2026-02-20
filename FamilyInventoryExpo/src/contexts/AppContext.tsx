import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AppData, Category, Child, InventoryItem } from '../types';
import { createDefaultData } from '../utils/defaultData';
import { generateId } from '../utils/helpers';
import { deleteLocalImage, loadData, saveData } from '../utils/storage';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  // Family
  updateFamilyName: (name: string) => void;
  // Children
  addChild: (child: Omit<Child, 'id'>) => void;
  updateChild: (id: string, updates: Partial<Omit<Child, 'id'>>) => void;
  deleteChild: (id: string) => void;
  // Categories
  addCategory: (category: Omit<Category, 'id' | 'order'>) => void;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (ordered: Category[]) => void;
  // Items
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteItem: (id: string) => void;
  // Data management
  replaceAllData: (newData: AppData) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<AppData>(createDefaultData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded = await loadData();
      if (loaded) {
        setData(loaded);
      }
      setIsLoading(false);
    })();
  }, []);

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  // Family
  const updateFamilyName = useCallback(
    (name: string) => persist((d) => ({ ...d, familyName: name })),
    [persist],
  );

  // Children
  const addChild = useCallback(
    (child: Omit<Child, 'id'>) =>
      persist((d) => ({
        ...d,
        children: [...d.children, { ...child, id: generateId() }],
      })),
    [persist],
  );

  const updateChild = useCallback(
    (id: string, updates: Partial<Omit<Child, 'id'>>) =>
      persist((d) => ({
        ...d,
        children: d.children.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      })),
    [persist],
  );

  const deleteChild = useCallback(
    (id: string) =>
      persist((d) => ({
        ...d,
        children: d.children.filter((c) => c.id !== id),
        // Reassign deleted child's items to 'all'
        items: d.items.map((item) =>
          item.childId === id ? { ...item, childId: 'all' } : item,
        ),
      })),
    [persist],
  );

  // Categories
  const addCategory = useCallback(
    (category: Omit<Category, 'id' | 'order'>) =>
      persist((d) => ({
        ...d,
        categories: [
          ...d.categories,
          { ...category, id: generateId(), order: d.categories.length },
        ],
      })),
    [persist],
  );

  const updateCategory = useCallback(
    (id: string, updates: Partial<Omit<Category, 'id'>>) =>
      persist((d) => ({
        ...d,
        categories: d.categories.map((c) =>
          c.id === id ? { ...c, ...updates } : c,
        ),
      })),
    [persist],
  );

  const deleteCategory = useCallback(
    (id: string) =>
      persist((d) => ({
        ...d,
        categories: d.categories
          .filter((c) => c.id !== id)
          .map((c, i) => ({ ...c, order: i })),
        items: d.items.filter((item) => item.categoryId !== id),
      })),
    [persist],
  );

  const reorderCategories = useCallback(
    (ordered: Category[]) =>
      persist((d) => ({
        ...d,
        categories: ordered.map((c, i) => ({ ...c, order: i })),
      })),
    [persist],
  );

  // Items
  const addItem = useCallback(
    (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      persist((d) => ({
        ...d,
        items: [
          ...d.items,
          { ...item, id: generateId(), createdAt: now, updatedAt: now },
        ],
      }));
    },
    [persist],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) =>
      persist((d) => ({
        ...d,
        items: d.items.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item,
        ),
      })),
    [persist],
  );

  const deleteItem = useCallback(
    (id: string) => {
      persist((d) => {
        const item = d.items.find((i) => i.id === id);
        if (item?.imageUri) {
          deleteLocalImage(item.imageUri);
        }
        return { ...d, items: d.items.filter((i) => i.id !== id) };
      });
    },
    [persist],
  );

  const replaceAllData = useCallback(
    (newData: AppData) => {
      setData(newData);
      saveData(newData);
    },
    [],
  );

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        updateFamilyName,
        addChild,
        updateChild,
        deleteChild,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addItem,
        updateItem,
        deleteItem,
        replaceAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
