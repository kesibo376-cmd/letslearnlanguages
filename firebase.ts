import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// IMPORTANT:
// Replace the placeholder values below with your actual Firebase project configuration.
// You can find these details in your Firebase project settings.
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
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services using v8 compat syntax
const auth = firebase.auth();
const db = firebase.firestore();

// Export services for use in other parts of the app
// Note: Firebase Storage is not used in this version.
export { auth, db, firebase };