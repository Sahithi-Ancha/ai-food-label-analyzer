import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwQhok6KEPkEYU_VlFTMDkUE-CihN0tfI",
  authDomain: "food-label-mobile.firebaseapp.com",
  projectId: "food-label-mobile",
  storageBucket: "food-label-mobile.firebasestorage.app",
  messagingSenderId: "301463078871",
  appId: "1:301463078871:web:20cb6f7e7b61ea1a35ed92",
};

const app = initializeApp(firebaseConfig);

// ✅ FIX WARNING ALSO HERE
export const auth = getAuth(app);
export const db = getFirestore(app);
