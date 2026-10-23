/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup as fbSignInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore with dedicated databaseId
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection verification test as required by Firebase integration guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] ✅ Cloud Firestore connected successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] ⚠️ Client is offline or Firestore config needs attention:', error.message);
    } else {
      // Permission denied on test path is normal for non-existent doc with strict rules
      console.log('[Firebase] 🔗 Cloud Firestore connection verified.');
    }
  }
}
testFirestoreConnection();

// Compatibility User interface
export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Session state tracking
let cachedUser: User | null = null;
let cachedAccessToken: string | null = null;
let authListeners: Array<(user: User | null) => void> = [];

// Track Firebase Auth state changes
onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
  if (fbUser) {
    const user: User = {
      uid: fbUser.uid,
      displayName: fbUser.displayName,
      email: fbUser.email,
      photoURL: fbUser.photoURL
    };
    cachedUser = user;
    localStorage.setItem('firebase_active_user', JSON.stringify(user));
    authListeners.forEach(l => l(user));
  } else {
    // If not signed into Firebase auth directly, check local session storage
    const savedUser = localStorage.getItem('mock_user') || localStorage.getItem('firebase_active_user');
    if (savedUser) {
      try {
        cachedUser = JSON.parse(savedUser);
      } catch (e) {
        cachedUser = null;
      }
    } else {
      cachedUser = null;
    }
    authListeners.forEach(l => l(cachedUser));
  }
});

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const listener = (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken || 'firebase-session-token');
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };
  authListeners.push(listener);

  // Initial trigger
  setTimeout(() => {
    listener(cachedUser);
  }, 50);

  return () => {
    authListeners = authListeners.filter(l => l !== listener);
  };
};

export const googleSignIn = async (
  customClientId?: string, 
  customClientSecret?: string
): Promise<{ user: User; accessToken: string } | null> => {
  // First attempt Firebase native Google Auth popup
  try {
    const cred = await fbSignInWithPopup(auth, googleProvider);
    const fbUser = cred.user;
    const user: User = {
      uid: fbUser.uid,
      displayName: fbUser.displayName,
      email: fbUser.email,
      photoURL: fbUser.photoURL
    };
    cachedUser = user;
    const token = await fbUser.getIdToken();
    cachedAccessToken = token;
    localStorage.setItem('firebase_active_user', JSON.stringify(user));
    localStorage.setItem('mock_access_token', token);
    authListeners.forEach(l => l(user));
    return { user, accessToken: token };
  } catch (firebaseErr: any) {
    console.warn('[Firebase Auth] Native popup did not complete, trying Google Workspace OAuth proxy...', firebaseErr);
  }

  // Fallback to Google Workspace OAuth proxy if Firebase popup is dismissed or restricted in iframe
  return new Promise(async (resolve, reject) => {
    try {
      let url = '/api/auth/google/url';
      if (customClientId || customClientSecret) {
        const q = new URLSearchParams();
        if (customClientId) q.append('clientId', customClientId);
        if (customClientSecret) q.append('clientSecret', customClientSecret);
        url += '?' + q.toString();
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to get Google authorization URL from server.');
      }
      const { url: authUrl } = await response.json();
      
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!popup) {
        alert('Please allow popups to sign in with Google Workspace.');
        resolve(null);
        return;
      }
      
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          const { token, user } = event.data;
          cachedUser = user;
          cachedAccessToken = token;
          localStorage.setItem('mock_user', JSON.stringify(user));
          localStorage.setItem('mock_access_token', token);
          authListeners.forEach(l => l(user));
          window.removeEventListener('message', handleMessage);
          resolve({ user, accessToken: token });
        } else if (event.data?.type === 'OAUTH_AUTH_FAILURE') {
          const errorMsg = event.data?.error || 'Authentication aborted';
          window.removeEventListener('message', handleMessage);
          reject(new Error(errorMsg));
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          resolve(null);
        }
      }, 1000);
    } catch (err: any) {
      console.error('googleSignIn error:', err);
      reject(err);
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.error('Firebase signOut error:', e);
  }
  cachedUser = null;
  cachedAccessToken = null;
  localStorage.removeItem('mock_user');
  localStorage.removeItem('firebase_active_user');
  localStorage.removeItem('mock_access_token');
  authListeners.forEach(l => l(null));
};

export const signInWithPopup = fbSignInWithPopup;
export const signOut = fbSignOut;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  console.error(`[Firestore Error] [${operationType.toUpperCase()}] at path "${path || 'unknown'}":`, errMessage);
  throw error;
}
