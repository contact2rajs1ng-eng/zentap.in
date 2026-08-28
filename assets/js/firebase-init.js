// ============================================================================
// ZENTAP.IN — Firebase initialization
//
// This file sets up your real Firebase project (Authentication + Firestore
// database) and exposes what common.js needs on `window.zentapFirebase`,
// since Firebase's SDK is only available as an ES module and the rest of
// the site's scripts are plain classic scripts.
//
// Your config below came from Firebase Console → Project settings → your
// web app → SDK setup and configuration → "Config".
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSlq1sfzYNIyEeieguGkdYQtDR-7G5d9E",
  authDomain: "zentap-aba22.firebaseapp.com",
  projectId: "zentap-aba22",
  storageBucket: "zentap-aba22.firebasestorage.app",
  messagingSenderId: "863450776384",
  appId: "1:863450776384:web:cece51bcb0f701b94830a5",
  measurementId: "G-6SXTNQDZDN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose what common.js (a classic script) needs to call.
window.zentapFirebase = {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  doc,
  setDoc,
  serverTimestamp,
  ready: true
};

// Let common.js know Firebase has finished loading, in case it started
// listening before this module finished importing.
window.dispatchEvent(new Event('zentap-firebase-ready'));
