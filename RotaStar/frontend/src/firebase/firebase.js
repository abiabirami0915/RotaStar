import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEOlO9DdA2h8t5HX9UyK6K-EUY2Hr1oNI",
  authDomain: "rotastar.firebaseapp.com",
  projectId: "rotastar",
  storageBucket: "rotastar.firebasestorage.app",
  messagingSenderId: "783582530423",
  appId: "1:783582530423:web:36d878c9cd55bcdfa8af72",
  measurementId: "G-MRE566ZMPK",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);