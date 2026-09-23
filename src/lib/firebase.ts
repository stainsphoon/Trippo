import { initializeApp } from 'firebase/app';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

try {
  setLogLevel('error');
} catch (_e) {}

const firebaseConfig = {
  projectId: "gen-lang-client-0177221054",
  appId: "1:136568881144:web:e950b5c3192e2560c3600d",
  apiKey: "AIzaSyBSNu0N2ihZy__128Um3ZTTAQB5SYoPcJM",
  authDomain: "gen-lang-client-0177221054.firebaseapp.com",
  storageBucket: "gen-lang-client-0177221054.firebasestorage.app",
  messagingSenderId: "136568881144"
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "ai-studio-trippo-ff4554d0-30e6-46ce-9ce9-47e9504b809c");
export const auth = getAuth(app);

// Initialize App Check
export let appCheck: any = null;
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const isDev = hostname === 'localhost' || 
                hostname === '127.0.0.1' || 
                hostname.includes('ais-dev') || 
                hostname.includes('ais-pre');
  
  if (isDev) {
    // Enable debug token for official App Check Debug Provider
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6Ld_e1cqAAAAAKxP2Y9mZ_SgTq_I335O967w-uF2'),
      isTokenAutoRefreshEnabled: true
    });
    console.log("[App Check] Initialized App Check.");
  } catch (err) {
    console.warn("[App Check] App Check initialization skipped or failed:", err);
  }
}

