// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxdacKzM0HBMUe1NztjKi7RqaXisYWFJQ",
  authDomain: "asset-profolio-tracker.firebaseapp.com",
  projectId: "asset-profolio-tracker",
  storageBucket: "asset-profolio-tracker.firebasestorage.app",
  messagingSenderId: "635448016704",
  appId: "1:635448016704:web:aa6d4ed749a2c25809c4a5",
  measurementId: "G-C9Z38NLM3Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };