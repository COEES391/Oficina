
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuración sincronizada con el proyecto activo: planeacin-1776866447103
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB-DUMMY-KEY-FOR-PORTABILITY",
  authDomain: "planeacin-1776866447103.firebaseapp.com",
  projectId: "planeacin-1776866447103",
  storageBucket: "planeacin-1776866447103.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicialización de instancia única segura
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
