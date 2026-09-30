import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBwiusDHdciM0py06sQZ1WsDW6IeheCbqQ",
  authDomain: "movi-movilidad.firebaseapp.com",
  projectId: "movi-movilidad",
  storageBucket: "movi-movilidad.firebasestorage.app",
  messagingSenderId: "974287503686",
  appId: "1:974287503686:web:83ac98b4e42f8a0dc2a547",
  measurementId: "G-JFNQMSFZZG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

export default app;