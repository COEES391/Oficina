
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuración centralizada para portabilidad total.
// IMPORTANTE: Al subir a un hosting comercial, asegúrese de que process.env.NEXT_PUBLIC_FIREBASE_API_KEY esté configurado.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB-DUMMY-KEY-FOR-PORTABILITY",
  authDomain: "planeacin-16143396.firebaseapp.com",
  projectId: "planeacin-16143396",
  storageBucket: "planeacin-16143396.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicialización de instancia única segura para cualquier entorno
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
