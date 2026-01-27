import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIjpDyAuldrWPx8MLlcQtpzYxWR1Jt6Sc",
  authDomain: "spark-app-c685c.firebaseapp.com",
  projectId: "spark-app-c685c",
  storageBucket: "spark-app-c685c.firebasestorage.app",
  messagingSenderId: "1001897299726",
  appId: "1:1001897299726:web:f62cdcaa7076b94145915f",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
