import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0177221054",
  appId: "1:136568881144:web:e950b5c3192e2560c3600d",
  apiKey: "AIzaSyBSNu0N2ihZy__128Um3ZTTAQB5SYoPcJM",
  authDomain: "gen-lang-client-0177221054.firebaseapp.com",
  storageBucket: "gen-lang-client-0177221054.firebasestorage.app",
  messagingSenderId: "136568881144"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c");
