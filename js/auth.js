/* ==========================================================================
   ANKAHI — auth.js
   Google Sign-In via Firebase Auth + user profile sync in Firestore.
   ========================================================================== */

const Auth = {
  isAdmin(){
    const u = auth.currentUser;
    return !!u && !!u.email && ADMIN_EMAILS.includes(u.email);
  },

  async loginWithGoogle(){
    try{
      const result = await auth.signInWithPopup(googleProvider);
      await Auth.syncUserDoc(result.user);
      toast(`Swagat hai, ${result.user.displayName?.split(" ")[0] || "dost"}! 🙏`);
      location.hash = "home";
    }catch(err){
      console.error(err);
      toast("Login fail ho gaya, dobara try karo.");
    }
  },

  async syncUserDoc(user){
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();
    const base = {
      name: user.displayName || "Anonymous",
      email: user.email,
      photoURL: user.photoURL || "",
      lastLogin: FieldValue.serverTimestamp()
    };
    if (!snap.exists){
      base.createdAt = FieldValue.serverTimestamp();
      base.role = ADMIN_EMAILS.includes(user.email) ? "admin" : "user";
    }
    await ref.set(base, { merge: true });
  },

  async logout(){
    await auth.signOut();
    toast("Aap logout ho gaye. Phir milenge! 👋");
    location.hash = "home";
  }
};

/* ---------------------- Reactive nav UI ---------------------- */
auth.onAuthStateChanged(user => {
  const authArea = document.getElementById("authArea");
  const adminLink = document.getElementById("adminNavLink");
  const writeLink = document.getElementById("writeNavLink");

  if (user){
    authArea.innerHTML = `
      <div class="user-chip">
        <img src="${user.photoURL || 'icons/icon-48.png'}" alt="${escapeHTML(user.displayName || '')}">
        <span>${escapeHTML((user.displayName || 'User').split(' ')[0])}</span>
      </div>
      <button class="nav-btn" id="logoutBtn">Logout</button>
    `;
    document.getElementById("logoutBtn").onclick = Auth.logout;
    adminLink.classList.toggle("hidden", !Auth.isAdmin());
  } else {
    authArea.innerHTML = `<button class="nav-btn btn-primary" id="loginNavBtn">Login</button>`;
    document.getElementById("loginNavBtn").onclick = () => (location.hash = "login");
    adminLink.classList.add("hidden");
  }
  if (writeLink) writeLink.classList.remove("hidden");
});
