/**
 * FocusFlow — Firebase utility for Chrome Extension
 * Uses Firebase v10+ modular SDK via CDN imports
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit, onSnapshot, writeBatch, Timestamp, enableIndexedDbPersistence } from 'firebase/firestore';

// ── Firebase Configuration ───────────────────────────────────────────
// Replace these with your Firebase project values
const firebaseConfig = {
  apiKey: "AIzaSyCMjXNfI3P9k68qT2rju0VuqkW9Gz2uZiY",
  authDomain: "focusflow-ext-101.firebaseapp.com",
  projectId: "focusflow-ext-101",
  storageBucket: "focusflow-ext-101.firebasestorage.app",
  messagingSenderId: "1026353188982",
  appId: "1:1026353188982:web:1c50c377e653711e4c4f57"
};

// ── Initialize Firebase ──────────────────────────────────────────────
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Auth Helpers ─────────────────────────────────────────────────────

/**
 * Sign in using Chrome Identity API token
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInWithChromeIdentity() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      try {
        const credential = GoogleAuthProvider.credential(null, token);
        const userCredential = await signInWithCredential(auth, credential);
        
        // Upsert user document
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: Timestamp.now()
        }, { merge: true });

        resolve(userCredential);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Get the currently signed-in user
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Sign out
 */
export async function signOut() {
  await auth.signOut();
  // Revoke Chrome identity token
  chrome.identity.getAuthToken({ interactive: false }, (token) => {
    if (token) {
      chrome.identity.removeCachedAuthToken({ token });
    }
  });
}

// ── Firestore Helpers ────────────────────────────────────────────────

export {
  app,
  auth,
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  Timestamp
};
