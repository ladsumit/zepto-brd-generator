// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Define your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGOFueTJpCdfAhxmVpOZbtFYjjKRAjdIg",
  authDomain: "zepto-brd-generator.firebaseapp.com",
  projectId: "zepto-brd-generator",
  storageBucket: "zepto-brd-generator.firebasestorage.app",
  messagingSenderId: "38302893745",
  appId: "1:38302893745:web:98dd2ad7a7238f2aaec490",
  measurementId: "G-EYFK8FPQGB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Conditionally initialize Analytics (it may not be supported in some environments)
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

// Initialize Firestore
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, analytics, auth };
