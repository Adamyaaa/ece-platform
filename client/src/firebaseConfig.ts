// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔴 REPLACE THESE VALUES WITH THE ONES FROM YOUR FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCZV7emkWS1TW_qM09GykTBMsT1DD8KqY4",
  authDomain: "vericode-86f89.firebaseapp.com",
  projectId: "vericode-86f89",
  storageBucket: "vericode-86f89.firebasestorage.app",
  messagingSenderId: "817521093818",
  appId: "1:817521093818:web:92ae6733b462cc3b60a683"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();