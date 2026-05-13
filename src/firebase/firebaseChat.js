import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// You can use the SAME Firebase project as your Instagram clone
// Just add Firestore if you haven't already
const firebaseConfig = {
  apiKey: "AIzaSyC0WWw-y6UgnlPcnoGznokM4trWThG9eRY",
  authDomain: "chatapp-5847d.firebaseapp.com",
  projectId: "chatapp-5847d",
  storageBucket: "chatapp-5847d.firebasestorage.app",
  messagingSenderId: "1058214781304",
  appId: "1:1058214781304:web:3222c10e277cefc608288d",
  measurementId: "G-4ZD0MGNJ07"
};

// Initialize Firebase for chat
const app = initializeApp(firebaseConfig, "chat"); // Second parameter makes it a separate instance if needed
export const chatFirestore = getFirestore(app);