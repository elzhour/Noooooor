import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  // @ts-ignore - getReactNativePersistence is exported from firebase/auth in RN
  getReactNativePersistence,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDOVE54x_j5fldKYwTRAG9QzdRok_pD074",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "noooooor-app.firebaseapp.com",
  databaseURL: "https://noooooor-app-default-rtdb.firebaseio.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "noooooor-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "noooooor-app.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "230599694330",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:230599694330:web:8780636368d1469591f643",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { app, auth };
export const rtdb = getDatabase(app);
