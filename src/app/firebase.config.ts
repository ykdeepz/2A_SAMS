import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDtMOV7F75ku_v8l-zk4gm6YqyJsiBZtwQ",
  authDomain: "sams-2a.firebaseapp.com",
  projectId: "sams-2a",
  storageBucket: "sams-2a.firebasestorage.app",
  messagingSenderId: "1044212254517",
  appId: "1:1044212254517:web:22ac2f54e8ec456bb32e7c"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Secondary app used exclusively for creating new Firebase Auth accounts.
// Using a separate app instance keeps the admin's session untouched —
// createUserWithEmailAndPassword on the primary app would sign the admin out.
export const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
