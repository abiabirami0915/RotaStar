
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDEOlO9DdA2h8t5HX9UyK6K-EUY2Hr1oNI",
  authDomain: "rotastar.firebaseapp.com",
  projectId: "rotastar",
  storageBucket: "rotastar.firebasestorage.app",
  messagingSenderId: "783582530423",
  appId: "1:783582530423:web:36d878c9cd55bcdfa8af72",
  measurementId: "G-MRE566ZMPK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Explicitly persist authentication across browser restarts
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

export const db = getFirestore(app);
export const storage = getStorage(app);
