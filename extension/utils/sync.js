/**
 * FocusFlow — Firestore Sync Engine
 * Handles bidirectional sync between chrome.storage.local and Firestore.
 */

import { db, collection, doc, setDoc, getDoc, getDocs, query, where, writeBatch, Timestamp } from './firebase.js';
import { getGoals, saveGoals, getStreaks, saveStreaks, getTodayKey, getTodayData } from './storage.js';

/**
 * Sync local pending time entries to Firestore
 */
export async function syncToFirestore() {
  const result = await chrome.storage.local.get('settings');
  const syncKey = result.settings?.syncKey;

  if (!syncKey) {
    console.log('FocusFlow: No Sync Key found, skipping sync');
    return;
  }

  try {
    const batch = writeBatch(db);
    const dateKey = getTodayKey();
    const dayData = await getTodayData();

    let entryCount = 0;
    for (const [domain, data] of Object.entries(dayData)) {
      const docId = `${syncKey}_${domain}_${dateKey}`;
      const docRef = doc(db, 'timeEntries', docId);

      batch.set(docRef, {
        uid: syncKey,
        domain: domain,
        category: data.category || 'neutral',
        timeSpent: data.timeSpent * 1000, // extension stores seconds → dashboard needs milliseconds
        date: dateKey,
        timestamp: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      entryCount++;
    }

    if (entryCount > 0) {
      await batch.commit();
      console.log(`FocusFlow: Synced ${entryCount} domains to Firestore`);
    }

    // Also sync goals and streaks
    await syncGoalsToFirestore(syncKey);
    await syncStreaksToFirestore(syncKey);

  } catch (error) {
    console.error('FocusFlow: Sync to Firestore failed', error);
  }
}

/**
 * Sync goals to Firestore
 */
async function syncGoalsToFirestore(uid) {
  try {
    const goals = await getGoals();
    const docRef = doc(db, 'goals', uid);
    await setDoc(docRef, {
      uid,
      ...goals,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.warn('FocusFlow: Goals sync failed', error);
  }
}

/**
 * Sync streaks to Firestore
 */
async function syncStreaksToFirestore(uid) {
  try {
    const streaks = await getStreaks();
    const docRef = doc(db, 'streaks', uid);
    await setDoc(docRef, {
      uid,
      ...streaks,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.warn('FocusFlow: Streaks sync failed', error);
  }
}

/**
 * Pull settings/goals/streaks from Firestore to local storage
 */
export async function syncFromFirestore() {
  const result = await chrome.storage.local.get('settings');
  const syncKey = result.settings?.syncKey;
  if (!syncKey) return;

  try {
    // Pull goals
    const goalsDoc = await getDoc(doc(db, 'goals', syncKey));
    if (goalsDoc.exists()) {
      const goalsData = goalsDoc.data();
      await saveGoals({
        dailyProductiveHours: goalsData.dailyProductiveHours || 4,
        socialMediaLimit: goalsData.socialMediaLimit || 120
      });
    }

    // Pull streaks
    const streaksDoc = await getDoc(doc(db, 'streaks', syncKey));
    if (streaksDoc.exists()) {
      const streaksData = streaksDoc.data();
      await saveStreaks({
        currentStreak: streaksData.currentStreak || 0,
        bestStreak: streaksData.bestStreak || 0,
        lastProductiveDate: streaksData.lastProductiveDate || null
      });
    }

    console.log('FocusFlow: Synced from Firestore');
  } catch (error) {
    console.error('FocusFlow: Sync from Firestore failed', error);
  }
}
