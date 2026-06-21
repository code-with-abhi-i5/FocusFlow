import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Goal } from '../../types';

const COLLECTION_NAME = 'goals';

const DEFAULT_GOAL = (uid: string): Goal => ({
  uid,
  dailyProductiveHours: 4,
  socialMediaLimit: 120, // in minutes
  updatedAt: Timestamp.now()
});

/**
 * Fetch user goals or return defaults if not configured
 */
export async function getGoals(uid: string): Promise<Goal> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Goal;
    }
    
    return DEFAULT_GOAL(uid);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    return DEFAULT_GOAL(uid);
  }
}

/**
 * Update user goals in Firestore
 */
export async function updateGoals(uid: string, dailyProductiveHours: number, socialMediaLimit: number): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, uid);
  await setDoc(docRef, {
    uid,
    dailyProductiveHours,
    socialMediaLimit,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

/**
 * Subscribe to realtime goal updates
 */
export function subscribeToGoals(uid: string, callback: (goal: Goal) => void) {
  const docRef = doc(db, COLLECTION_NAME, uid);
  
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as Goal);
    } else {
      callback(DEFAULT_GOAL(uid));
    }
  }, (error) => {
    console.error('Goals subscription failed:', error);
  });
}
