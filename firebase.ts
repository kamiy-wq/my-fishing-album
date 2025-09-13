import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Your web app's Firebase configuration.
// Vite exposes environment variables on `import.meta.env`.
const firebaseConfig = {
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // FIX: Cast import.meta to any to resolve TypeScript error about missing 'env' property.
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();