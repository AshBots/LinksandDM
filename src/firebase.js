// src/firebase.js
// ✅ Firebase v9.22.2 – fully modular and build-safe with CRA (react-scripts)

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.firebasestorage.app",
  messagingSenderId: "965082307073",
  appId: "1:965082307073:web:78ea49e4c5888852307e00",
  measurementId: "G-QVH0R5D92B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore database
export const db = getFirestore(app);

// (Optional) – you can export app if needed elsewhere
export default app;
