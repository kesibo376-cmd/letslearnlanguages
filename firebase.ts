import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRg-8tn40pgJ0B-ZFm_vPOitYWOeoC4sw",
  authDomain: "audioapp-a21fa.firebaseapp.com",
  projectId: "audioapp-a21fa",
  storageBucket: "audioapp-a21fa.firebasestorage.app",
  messagingSenderId: "310489098654",
  appId: "1:310489098654:web:5e3e983a1e1f759f904e8f",
  measurementId: "G-WF3WGKC5S2"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export services for use in other parts of the app
// Note: Firebase Storage is not used in this version.
export { auth, db };