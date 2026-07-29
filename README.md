# Ankahi 🪔
**"Lafzon Mein Aag, Khamoshi Mein Wazan"**

Ek Firebase-powered story-sharing PWA — likho, padho, share karo. Isme koi backend server nahi hai, yeh pure frontend (HTML/CSS/JS) + Firebase se chalti hai, isliye GitHub Pages ya Netlify pe **free** deploy ho jaati hai.

---

## ✨ Features
- 🔐 Google Login (Firebase Auth)
- 📝 Story likho / edit karo / publish karo
- 🖼 Cover Image + 📄 PDF upload (Firebase Storage)
- ❤️ Like system, 💬 Comments, 🏷 Categories, 🔍 Search
- 📖 Read counter
- 🌙 Dark/Light mode (persisted)
- 📱 Installable PWA (offline app-shell caching)
- 👑 Admin dashboard (manage stories/categories, stats)
- 🤖 AI Story Helper (apni free Gemini API key se)

---

## 1️⃣ Firebase Project Banao

1. [Firebase Console](https://console.firebase.google.com) pe jao → **Add Project**.
2. **Build → Authentication** → "Get Started" → **Sign-in method** mein **Google** enable karo.
3. **Build → Firestore Database** → "Create Database" → production mode mein start karo.
4. **Build → Storage** → "Get Started" (default rules ke saath).
5. **Project settings (⚙️) → General** → "Your apps" mein **Web app (`</>`)** add karo → config copy karo.

## 2️⃣ Config Daalo

`js/firebase.js` file kholo aur apna config paste karo:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Neeche `ADMIN_EMAILS` array mein apna Gmail daalo — jis email se login karoge wahi Admin Dashboard access kar payega:

```js
const ADMIN_EMAILS = ["tumhara-email@gmail.com"];
```

## 3️⃣ Firestore Security Rules (zaroori! ⚠️)

Client-side admin check sirf UI ke liye hai — asli protection **Firestore Rules** se hoti hai. Firebase Console → Firestore → **Rules** tab mein yeh paste karo (apna admin email daal ke):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.email in ["tumhara-email@gmail.com"]; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /stories/{storyId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.authorId) || isAdmin();

      match /likes/{uid} {
        allow read: if true;
        allow write: if isOwner(uid);
      }
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid;
        allow delete: if isOwner(resource.data.uid) || isAdmin();
      }
    }

    match /users/{uid} {
      allow read: if true;
      allow write: if isOwner(uid);
    }
  }
}
```

## 4️⃣ Storage Security Rules

Firebase Console → Storage → **Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /story-images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
    match /story-pdfs/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.resource.size < 15 * 1024 * 1024;
    }
  }
}
```

## 5️⃣ Firestore Index (agar zaroorat pade)

Category-filter wali query (`published == true` + `category == X` + `orderBy createdAt`) ke liye Firestore ek composite index maang sakta hai. Console error mein diya gaya link click karke ek click mein index bana lena — koi extra kaam nahi.

## 6️⃣ AI Story Helper Setup

Write page pe "✨ Generate" button apni **free Google Gemini API key** maangega (ek baar):
1. https://aistudio.google.com/app/apikey pe jao → free key banao.
2. Jab prompt aaye, key paste karo — yeh sirf tumhare browser ke `localStorage` mein save hoti hai, kahin bheji nahi jaati (Firebase mein bhi nahi).

## 7️⃣ Local Testing

Kisi bhi static server se chala sakte ho (module scripts CORS ki wajah se seedha file:// se nahi chalenge agar module use kiya ho — yahan plain scripts hain to file:// bhi chal sakta hai, lekin best practice ke liye local server use karo):

```bash
npx serve .
# ya
python3 -m http.server 8080
```

## 8️⃣ Deploy — GitHub Pages

1. Is poore folder ko ek GitHub repo mein push karo.
2. Repo → **Settings → Pages** → Branch: `main`, folder: `/ (root)` → Save.
3. Firebase Console → Authentication → **Settings → Authorized domains** mein apna `username.github.io` domain add karo.

## 9️⃣ Deploy — Netlify

1. [Netlify](https://app.netlify.com) → "Add new site" → **Deploy manually** (poora folder drag-drop karo) ya GitHub repo connect karo.
2. Deploy hone ke baad jo domain mile (e.g. `ankahi.netlify.app`), usse Firebase Authentication → Authorized domains mein add karo.

---

## 📁 Project Structure

```
Ankahi/
├── index.html          → poori app ek single-page app (hash routing)
├── manifest.json        → PWA manifest
├── service-worker.js    → offline app-shell caching
├── css/
│   ├── style.css        → main design (Banarasi ghat theme)
│   ├── dark.css          → dark mode overrides
│   └── admin.css        → admin dashboard styling
├── js/
│   ├── firebase.js      → Firebase init + admin email list
│   ├── auth.js           → Google login/logout
│   ├── categories.js    → category list + chip UI
│   ├── stories.js        → CRUD, image/pdf upload, grid+detail render
│   ├── likes.js          → like/unlike toggle
│   ├── comments.js      → comments CRUD
│   ├── search.js         → nav search box
│   ├── ai.js              → AI story helper (Gemini)
│   ├── admin.js          → admin dashboard logic
│   ├── theme.js           → dark/light toggle
│   └── app.js             → router + shared helpers (toast, lazy-load, ticker)
└── icons/                 → PWA icons (all sizes)
```

---

## 🧭 Kaise Use Karo

- **Story likhna:** top-right pe "✍ Likho" pe click karo → login karo (agar nahi kiya) → title, category, content bharo → chaho to cover image / PDF attach karo → "Publish Karo".
- **AI se madad:** write page pe topic likh ke "✨ Generate" dabao, AI ek draft dega jise tum apne content mein add kar sakte ho.
- **Share karna:** kisi bhi kahani ke page pe "🔗 Share Karo" button — mobile pe native share sheet khulega, desktop pe link copy ho jayega.
- **Admin bannna:** apna email `js/firebase.js` ke `ADMIN_EMAILS` mein aur Firestore Rules dono jagah add karo, phir usi email se login karke top-nav mein "👑 Admin" link dikhega.

Made with ❤️ — **Abhi's Bite**
