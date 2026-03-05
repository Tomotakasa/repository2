import {
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { db, storage } from '../firebase';
import type { Category, Child, Group, InventoryItem, InviteCode } from '../types';
import { DEFAULT_CATEGORIES, generateId, generateInviteCode } from '../utils/helpers';
import { useAuth } from './AuthContext';

interface GroupContextType {
  groups: Group[];
  currentGroup: Group | null;
  items: InventoryItem[];
  loading: boolean;
  setCurrentGroupId: (id: string) => void;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<{ groupName: string }>;
  updateGroupName: (name: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id'>) => Promise<void>;
  updateChild: (id: string, updates: Partial<Omit<Child, 'id'>>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id' | 'order'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (cats: Category[]) => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, imageFile?: File) => Promise<void>;
  updateItem: (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>, imageFile?: File) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  generateInvite: () => Promise<string>;
  getInviteCodes: () => Promise<InviteCode[]>;
  deleteInviteCode: (code: string) => Promise<void>;
}

const GroupContext = createContext<GroupContextType | null>(null);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, refreshProfile } = useAuth();
  const [groups, setGroups]               = useState<Group[]>([]);
  const [currentGroupId, _setCurrentGroupId] = useState<string | null>(null);
  const [items, setItems]                 = useState<InventoryItem[]>([]);
  const [loading, setLoading]             = useState(true);
  const itemsUnsubRef = useRef<(() => void) | null>(null);

  // Subscribe to groups that user belongs to
  useEffect(() => {
    if (!userProfile?.groupIds?.length) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const unsubs: Array<() => void> = [];
    const groupMap = new Map<string, Group>();

    for (const gid of userProfile.groupIds) {
      const unsub = onSnapshot(doc(db, 'groups', gid), (snap) => {
        if (snap.exists()) {
          groupMap.set(gid, { id: snap.id, ...snap.data() } as Group);
        } else {
          groupMap.delete(gid);
        }
        setGroups([...groupMap.values()]);
        setLoading(false);
      });
      unsubs.push(unsub);
    }
    return () => unsubs.forEach((u) => u());
  }, [userProfile?.groupIds]);

  // Auto-select first group
  useEffect(() => {
    if (!currentGroupId && groups.length > 0) {
      const saved = localStorage.getItem('currentGroupId');
      const found = groups.find((g) => g.id === saved);
      _setCurrentGroupId(found ? found.id : groups[0].id);
    }
  }, [groups, currentGroupId]);

  // Subscribe to items of current group
  useEffect(() => {
    itemsUnsubRef.current?.();
    itemsUnsubRef.current = null;
    if (!currentGroupId) { setItems([]); return; }

    const unsub = onSnapshot(
      collection(db, 'groups', currentGroupId, 'items'),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem)),
        );
      },
    );
    itemsUnsubRef.current = unsub;
    return () => unsub();
  }, [currentGroupId]);

  const setCurrentGroupId = useCallback((id: string) => {
    _setCurrentGroupId(id);
    localStorage.setItem('currentGroupId', id);
  }, []);

  const currentGroup = groups.find((g) => g.id === currentGroupId) ?? null;

  // ---- Group management ----
  const createGroup = async (name: string) => {
    if (!user) return;
    const newGroup = {
      name,
      ownerId: user.uid,
      members: { [user.uid]: 'owner' as const },
      memberNames: { [user.uid]: user.displayName ?? user.email ?? 'You' },
      children: [],
      categories: DEFAULT_CATEGORIES.map((c, i) => ({
        id: generateId(),
        ...c,
        order: i,
      })),
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'groups'), newGroup);
    await updateDoc(doc(db, 'users', user.uid), {
      groupIds: arrayUnion(ref.id),
    });
    await refreshProfile();
    setCurrentGroupId(ref.id);
  };

  const joinGroup = async (code: string): Promise<{ groupName: string }> => {
    if (!user) throw new Error('未ログイン');
    const codeRef = doc(db, 'inviteCodes', code.toUpperCase());
    const codeSnap = await getDocs(
      query(collection(db, 'inviteCodes'), where('code', '==', code.toUpperCase())),
    );
    if (codeSnap.empty) throw new Error('招待コードが見つかりません');
    const codeData = { id: codeSnap.docs[0].id, ...codeSnap.docs[0].data() } as InviteCode & { id: string };

    if (!codeData.isActive) throw new Error('この招待コードは無効です');
    const expiresAt = codeData.expiresAt instanceof Timestamp
      ? codeData.expiresAt.toDate()
      : new Date(codeData.expiresAt as unknown as string);
    if (expiresAt < new Date()) throw new Error('招待コードの有効期限が切れています');
    if (codeData.maxUses > 0 && codeData.usedCount >= codeData.maxUses) {
      throw new Error('招待コードの使用上限に達しました');
    }
    if (userProfile?.groupIds?.includes(codeData.groupId)) {
      throw new Error('すでにこのグループに参加しています');
    }

    const displayName = user.displayName ?? user.email ?? 'ユーザー';
    await updateDoc(doc(db, 'groups', codeData.groupId), {
      [`members.${user.uid}`]: 'member',
      [`memberNames.${user.uid}`]: displayName,
    });
    await updateDoc(doc(db, 'users', user.uid), {
      groupIds: arrayUnion(codeData.groupId),
    });
    await updateDoc(codeSnap.docs[0].ref, {
      usedCount: codeData.usedCount + 1,
    });
    await refreshProfile();
    setCurrentGroupId(codeData.groupId);
    void codeRef; // suppress unused warning
    return { groupName: codeData.groupName };
  };

  const updateGroupName = async (name: string) => {
    if (!currentGroupId) return;
    await updateDoc(doc(db, 'groups', currentGroupId), { name });
  };

  const removeMember = async (userId: string) => {
    if (!currentGroupId || !user) return;
    const group = currentGroup!;
    if (group.ownerId !== user.uid) throw new Error('権限がありません');
    const newMembers = { ...group.members };
    const newMemberNames = { ...group.memberNames };
    delete newMembers[userId];
    delete newMemberNames[userId];
    await updateDoc(doc(db, 'groups', currentGroupId), {
      members: newMembers,
      memberNames: newMemberNames,
    });
    await updateDoc(doc(db, 'users', userId), {
      groupIds: arrayRemove(currentGroupId),
    });
  };

  // ---- Helpers to update group document ----
  const patchGroup = (updates: Partial<Group>) => {
    if (!currentGroupId) return Promise.resolve();
    return updateDoc(doc(db, 'groups', currentGroupId), updates as Record<string, unknown>);
  };

  // ---- Children ----
  const addChild = async (child: Omit<Child, 'id'>) => {
    if (!currentGroup) return;
    await patchGroup({
      children: [...currentGroup.children, { ...child, id: generateId() }],
    });
  };

  const updateChild = async (id: string, updates: Partial<Omit<Child, 'id'>>) => {
    if (!currentGroup) return;
    await patchGroup({
      children: currentGroup.children.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const deleteChild = async (id: string) => {
    if (!currentGroup) return;
    await patchGroup({
      children: currentGroup.children.filter((c) => c.id !== id),
    });
    // Reassign items owned by this child to 'all'
    const itemsToUpdate = items.filter((i) => i.childId === id);
    await Promise.all(
      itemsToUpdate.map((i) =>
        updateDoc(doc(db, 'groups', currentGroupId!, 'items', i.id), { childId: 'all' }),
      ),
    );
  };

  // ---- Categories ----
  const addCategory = async (cat: Omit<Category, 'id' | 'order'>) => {
    if (!currentGroup) return;
    const newCat: Category = {
      ...cat,
      id: generateId(),
      order: currentGroup.categories.length,
    };
    await patchGroup({ categories: [...currentGroup.categories, newCat] });
  };

  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    if (!currentGroup) return;
    await patchGroup({
      categories: currentGroup.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const deleteCategory = async (id: string) => {
    if (!currentGroup || !currentGroupId) return;
    await patchGroup({ categories: currentGroup.categories.filter((c) => c.id !== id) });
    // Delete all items in that category
    const q = query(
      collection(db, 'groups', currentGroupId, 'items'),
      where('categoryId', '==', id),
    );
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  const reorderCategories = async (cats: Category[]) => {
    if (!currentGroup) return;
    await patchGroup({ categories: cats.map((c, i) => ({ ...c, order: i })) });
  };

  // ---- Items ----
  const uploadItemImage = async (groupId: string, file: File): Promise<string> => {
    const { resizeImage } = await import('../utils/helpers');
    const blob = await resizeImage(file);
    const imgRef = ref(storage, `groups/${groupId}/items/${generateId()}.jpg`);
    await uploadBytes(imgRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(imgRef);
  };

  const addItem = async (
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    imageFile?: File,
  ) => {
    if (!currentGroupId || !user) return;
    let imageUrl = item.imageUrl;
    if (imageFile) imageUrl = await uploadItemImage(currentGroupId, imageFile);
    await addDoc(collection(db, 'groups', currentGroupId, 'items'), {
      ...item,
      imageUrl,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateItem = async (
    id: string,
    updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>,
    imageFile?: File,
  ) => {
    if (!currentGroupId) return;
    let imageUrl = updates.imageUrl;
    if (imageFile) imageUrl = await uploadItemImage(currentGroupId, imageFile);
    await updateDoc(doc(db, 'groups', currentGroupId, 'items', id), {
      ...updates,
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      updatedAt: serverTimestamp(),
    });
  };

  const deleteItem = async (id: string) => {
    if (!currentGroupId) return;
    const item = items.find((i) => i.id === id);
    await deleteDoc(doc(db, 'groups', currentGroupId, 'items', id));
    if (item?.imageUrl) {
      try {
        await deleteObject(ref(storage, item.imageUrl));
      } catch { /* image may already be deleted */ }
    }
  };

  // ---- Invite codes ----
  const generateInvite = async (): Promise<string> => {
    if (!currentGroup || !user) throw new Error('グループが選択されていません');
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours

    await addDoc(collection(db, 'inviteCodes'), {
      code,
      groupId: currentGroup.id,
      groupName: currentGroup.name,
      createdBy: user.uid,
      createdByName: user.displayName ?? user.email ?? 'unknown',
      expiresAt: Timestamp.fromDate(expiresAt),
      maxUses: 0, // unlimited
      usedCount: 0,
      isActive: true,
    });
    return code;
  };

  const getInviteCodes = async (): Promise<InviteCode[]> => {
    if (!currentGroupId) return [];
    const snap = await getDocs(
      query(collection(db, 'inviteCodes'), where('groupId', '==', currentGroupId)),
    );
    return snap.docs.map((d) => ({ code: d.id, ...d.data() } as InviteCode));
  };

  const deleteInviteCode = async (docId: string) => {
    await deleteDoc(doc(db, 'inviteCodes', docId));
  };

  return (
    <GroupContext.Provider
      value={{
        groups,
        currentGroup,
        items,
        loading,
        setCurrentGroupId,
        createGroup,
        joinGroup,
        updateGroupName,
        removeMember,
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
        generateInvite,
        getInviteCodes,
        deleteInviteCode,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = (): GroupContextType => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within GroupProvider');
  return ctx;
};
