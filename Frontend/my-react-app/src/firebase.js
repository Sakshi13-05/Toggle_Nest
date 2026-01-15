import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // ✅ REQUIRED

const firebaseConfig = {
  apiKey: "AIzaSyDTrKWJPLFbLMzr9dGiSGGY75VRZ1Cl7LA",
  authDomain: "togglenest.firebaseapp.com",
  projectId: "togglenest",
  storageBucket: "togglenest.appspot.com",
  messagingSenderId: "458770124644",
  appId: "1:458770124644:web:3ccec7d60331636708b471",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account", // forces account selection
});

export const githubProvider = new GithubAuthProvider();

// Auth & Firestore exports
export const auth = getAuth(app);
export const db = getFirestore(app);
