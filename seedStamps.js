import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
  projectId: "gen-lang-client-0177221054",
  appId: "1:136568881144:web:e950b5c3192e2560c3600d",
  apiKey: "AIzaSyBSNu0N2ihZy__128Um3ZTTAQB5SYoPcJM",
  authDomain: "gen-lang-client-0177221054.firebaseapp.com",
  storageBucket: "gen-lang-client-0177221054.firebasestorage.app",
  messagingSenderId: "136568881144"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c");

const seed = async () => {
  const stampsDir = path.join(process.cwd(), "public", "stamps");
  const files = fs.readdirSync(stampsDir).filter(f => f.endsWith(".jpg"));
  
  for (const file of files) {
    const url = `/stamps/${file}`;
    const id = file.replace(".jpg", "");
    
    await setDoc(doc(db, "default_stamps", id), {
      id,
      imageUrl: url,
      createdAt: Date.now()
    });
    console.log(`Seeded default stamp: ${url}`);
  }
  
  console.log("Done seeding!");
  process.exit(0);
};

seed().catch(console.error);
