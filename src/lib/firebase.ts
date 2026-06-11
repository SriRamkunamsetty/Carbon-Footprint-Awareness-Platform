import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQW1Rz1Mfqcga3_MOVoxt_1RevVKZedMg",
  authDomain: "cardon-footprint.firebaseapp.com",
  projectId: "cardon-footprint",
  storageBucket: "cardon-footprint.firebasestorage.app",
  messagingSenderId: "651862946102",
  appId: "1:651862946102:web:0c0d7c1977d9f56cbfc397",
  measurementId: "G-NYHZ6HL3M3"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
