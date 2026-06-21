import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  setDoc, 
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import type { TimeEntry } from '../../types';

const COLLECTION_NAME = 'timeEntries';

/**
 * Fetch all time entries for a user between two date strings (inclusive)
 */
export async function getTimeEntriesRange(uid: string, startDate: string, endDate: string): Promise<TimeEntry[]> {
  try {
    // Only query by uid to avoid requiring a composite index in Firestore
    const q = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', uid)
    );
    
    const querySnapshot = await getDocs(q);
    const entries: TimeEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as TimeEntry;
      // Filter by date in memory
      if (data.date >= startDate && data.date <= endDate) {
        entries.push(data);
      }
    });
    
    // Sort by date ascending in memory
    entries.sort((a, b) => a.date.localeCompare(b.date));
    
    return entries;
  } catch (error) {
    console.error('Failed to get time entries range:', error);
    return [];
  }
}

/**
 * Stream real-time time entry updates for a specific date (typically "today")
 */
export function subscribeToTimeEntries(uid: string, dateStr: string, callback: (entries: TimeEntry[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('uid', '==', uid),
    where('date', '==', dateStr)
  );

  return onSnapshot(q, (snapshot) => {
    const entries: TimeEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push(doc.data() as TimeEntry);
    });
    callback(entries);
  }, (error) => {
    console.error('Time entries subscription failed:', error);
  });
}

/**
 * Manually update/set a time entry
 */
export async function updateTimeEntry(uid: string, domain: string, dateStr: string, timeSpent: number, category: any): Promise<void> {
  const docId = `${uid}_${domain}_${dateStr}`;
  const docRef = doc(db, COLLECTION_NAME, docId);
  
  const payload = {
    uid,
    domain,
    category,
    timeSpent,
    date: dateStr,
    timestamp: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  await setDoc(docRef, payload, { merge: true });
}
