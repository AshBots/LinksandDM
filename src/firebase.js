import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAFqbEIL3TOAcFmsxoqltJfrtfE2sOXVs",
  authDomain: "links-dm-pro.firebaseapp.com",
  projectId: "links-dm-pro",
  storageBucket: "links-dm-pro.appspot.com", // ✅ fixed domain
  messagingSenderId: "965082307073",
  appId: "1:965082307073:web:78ea49e4c5888852307e00",
  measurementId: "G-QVH0R5D92B"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Firestore
export const db = getFirestore(app);
