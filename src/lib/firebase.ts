
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Esta configuración permite que el sistema funcione en cualquier hosting
// una vez que el proyecto de Firebase esté vinculado.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB...",
  authDomain: "planeacin-16143396.firebaseapp.com",
  projectId: "planeacin-16143396",
  storageBucket: "planeacin-16143396.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
