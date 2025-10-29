// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCMCHSKjTq8fuhE3KE3sIjF9hA0ajDZtWw",
  authDomain: "review-app-92858.firebaseapp.com",
  projectId: "review-app-92858",
  storageBucket: "review-app-92858.firebasestorage.app",
  messagingSenderId: "726807320595",
  appId: "1:726807320595:web:b10e4793b54ca54928c7e6",
  measurementId: "G-EGRF9LHQ44"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
