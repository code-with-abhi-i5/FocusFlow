import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Streak } from '../../types';

const COLLECTION_NAME = 'streaks';

const DEFAULT_STREAK = (uid: string): Streak => ({
  uid,
  currentStreak: 0,
  bestStreak: 0,
  lastProductiveDate: null,
  updatedAt: Timestamp.now()
});

/**
 * Fetch user streak data
 */
export async function getStreak(uid: string): Promise<Streak> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Streak;
    }
    
    return DEFAULT_STREAK(uid);
  } catch (error) {
    console.error('Failed to fetch streak:', error);
    return DEFAULT_STREAK(uid);
  }
}

/**
 * Subscribe to realtime streak updates
 */
export function subscribeToStreak(uid: string, callback: (streak: Streak) => void) {
  const docRef = doc(db, COLLECTION_NAME, uid);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Streak);
    } else {
      callback(DEFAULT_STREAK(uid));
    }
  }, (error) => {
    console.error('Streak subscription failed:', error);
  });
}
