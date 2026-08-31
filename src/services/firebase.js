// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAmxWKW0QEcMBllYxTlYOaLbuEIC2Svu0",
  authDomain: "b3procurador.firebaseapp.com",
  projectId: "b3procurador",
  storageBucket: "b3procurador.firebasestorage.app",
  messagingSenderId: "851733772729",
  appId: "1:851733772729:web:ae8e3a3f4b4f27eed45e68",
  measurementId: "G-FX2SY7JN2T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
