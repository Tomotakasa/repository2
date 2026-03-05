import { Timestamp } from 'firebase/firestore';

export type GroupRole = 'owner' | 'admin' | 'member';

/** Stored at: users/{uid} */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  /** User's own OpenAI API key for camera AI feature. Stored encrypted in Firestore. */
  openaiApiKey?: string;
  groupIds: string[];
  createdAt: Timestamp;
}

/** Stored at: groups/{groupId} */
export interface Group {
  id: string;
  name: string;
  ownerId: string;
  /** userId → role */
  members: Record<string, GroupRole>;
  /** userId → displayName (denormalized for display) */
  memberNames: Record<string, string>;
  children: Child[];
  categories: Category[];
  createdAt: Timestamp;
}

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

/** Stored at: groups/{groupId}/items/{itemId} */
export interface InventoryItem {
  id: string;
  name: string;
  categoryId: string;
  childId: string; // child id or 'all' for shared
  size: string;
  brand: string;
  quantity: number;
  notes: string;
  imageUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

/** Stored at: inviteCodes/{code} */
export interface InviteCode {
  code: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdByName: string;
  expiresAt: Timestamp;
  maxUses: number; // 0 = unlimited
  usedCount: number;
  isActive: boolean;
}
