import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDbaRw_cEuiVsPiXPDBqjawsKcQROgZYz0",
  authDomain: "kanni-cash.firebaseapp.com",
  projectId: "kanni-cash",
  storageBucket: "kanni-cash.firebasestorage.app",
  messagingSenderId: "658038605901",
  appId: "1:658038605901:web:f9da9ad181f639b2b93404",
  measurementId: "G-01RQZP49D7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;