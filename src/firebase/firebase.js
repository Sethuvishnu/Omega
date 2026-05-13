import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCA_jvyJCIVUr7fQJRHyfGmEDDuQX4EWi0",
  authDomain: "instagram-e19c1.firebaseapp.com",
  projectId: "instagram-e19c1",
  storageBucket: "instagram-e19c1.firebasestorage.app",
  messagingSenderId: "236778155918",
  appId: "1:236778155918:web:4776aa5ef6a696120b3edf",
  measurementId: "G-GZVKYYZQV8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
