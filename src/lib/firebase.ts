import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

type RequiredFirebaseConfig = {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
};

const firebaseConfig: RequiredFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function getMissingConfigKeys() {
  return Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
}

function assertFirebaseConfig() {
  const missingKeys = getMissingConfigKeys();

  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase config eksik. .env dosyana su alanlari ekle: ${missingKeys.join(', ')}`,
    );
  }
}

export function getFirebaseApp(): FirebaseApp {
  assertFirebaseConfig();

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig as FirebaseOptions);
}

export function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
