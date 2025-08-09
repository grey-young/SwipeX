// firebaseConfig.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ Import Firebase Storage

// Platform import from react native
import { Platform } from "react-native"; // ✅ Import Platform

const firebaseConfig = {
  apiKey: "AIzaSyAO5h_ugnZvWAEph_qz4Yy1PcAMEkH9IlE",
  authDomain: "swipex-ae234.firebaseapp.com",
  projectId: "swipex-ae234",
  storageBucket: "swipex-ae234.firebasestorage.app",
  messagingSenderId: "455933125090",
  appId: "1:455933125090:web:449c450acedf6dd5f919bb",
  measurementId: "G-J5VYYG3TCY",
};

const app = initializeApp(firebaseConfig);
export const auth =
  Platform.OS === "web"
    ? getAuth(app, { persistence: browserLocalPersistence }) // Web version
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      }); // React Native
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Initialize Firebase Storage

export default app;
