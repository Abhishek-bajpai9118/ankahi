/* ==========================================================================
   ANKAHI — firebase.js
   Firebase init. Replace firebaseConfig with YOUR project's config from
   https://console.firebase.google.com  →  Project settings → General
   ========================================================================== */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Enable offline persistence (best-effort — fails silently on unsupported browsers/tabs)
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

/* ---- Admin allow-list -----------------------------------------------------
   Client-side check only controls the UI. You MUST also protect writes with
   Firestore Security Rules (see README.md) or anyone could edit the DB
   directly with devtools. Add your Google account's email below.        ---- */
const ADMIN_EMAILS = [
  "your-email@gmail.com"
];

const FieldValue = firebase.firestore.FieldValue;
