import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { CustomCategories } from '../../types';

const COLLECTION_NAME = 'categories';

const DEFAULT_CATEGORIES = (uid: string): CustomCategories => ({
  uid,
  productive: [],
  unproductive: [],
  neutral: [],
  updatedAt: Timestamp.now()
});

/**
 * Fetch custom categories for a user
 */
export async function getCustomCategories(uid: string): Promise<CustomCategories> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as CustomCategories;
    }
    
    return DEFAULT_CATEGORIES(uid);
  } catch (error) {
    console.error('Failed to fetch custom categories:', error);
    return DEFAULT_CATEGORIES(uid);
  }
}

/**
 * Save custom categories to Firestore
 */
export async function saveCustomCategories(uid: string, categories: Omit<CustomCategories, 'uid' | 'updatedAt'>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, uid);
  await setDoc(docRef, {
    uid,
    ...categories,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

/**
 * Subscribe to realtime custom categories updates
 */
export function subscribeToCustomCategories(uid: string, callback: (categories: CustomCategories) => void) {
  const docRef = doc(db, COLLECTION_NAME, uid);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as CustomCategories);
    } else {
      callback(DEFAULT_CATEGORIES(uid));
    }
  }, (error) => {
    console.error('Custom categories subscription failed:', error);
  });
}
