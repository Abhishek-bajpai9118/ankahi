/* ==========================================================================
   ANKAHI — firebase.js
   Firebase init. Replace firebaseConfig with YOUR project's config from
   https://console.firebase.google.com  →  Project settings → General
   ========================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyDSRxI_CZhr6oF6gVMrAYcMctLKNYimCD0",
  authDomain: "ankahi-3f793.firebaseapp.com",
  projectId: "ankahi-3f793",
  storageBucket: "ankahi-3f793.firebasestorage.app",
  messagingSenderId: "339462467385",
  appId: "1:339462467385:web:76433717001f83490082e8"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Storage needs the Blaze (pay-as-you-go) plan on the Firebase project.
// Skipped for now — image/PDF upload will show a friendly error until you
// upgrade the plan and uncomment this line. Everything else (write, like,
// comment, share) works fine without it.
// const storage = firebase.storage();

// Enable offline persistence (best-effort — fails silently on unsupported browsers/tabs)
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

/* ---- Admin allow-list -----------------------------------------------------
   Client-side check only controls the UI. You MUST also protect writes with
   Firestore Security Rules (see README.md) or anyone could edit the DB
   directly with devtools. Add your Google account's email below.        ---- */
const ADMIN_EMAILS = [
  "ab895707@gmail.com"
];

const FieldValue = firebase.firestore.FieldValue;
