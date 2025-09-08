import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// IMPORTANT:
// Replace the placeholder values below with your actual Firebase project configuration.
// You can find these details in your Firebase project settings.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_FIREBASE_APP_ID",
  measurementId: "REPLACE_WITH_YOUR_FIREBASE_MEASUREMENT_ID"
};


// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services using v8 compat syntax
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
try {
  db.enablePersistence()
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one.
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        console.warn('Firestore persistence not supported in this browser.');
      }
    });
} catch (error) {
    console.error("Error enabling Firestore persistence: ", error);
}

// Export services for use in other parts of the app
// Note: Firebase Storage is not used in this version.
export { auth, db, firebase };