/* ==========================================================================
   ANKAHI — admin.js
   Admin dashboard: stats, story management, category management.
   Client-side gate only — real protection must come from Firestore Rules.
   ========================================================================== */

const Admin = {
  async init(){
    const guard = document.getElementById("adminGuard");
    const content = document.getElementById("adminContent");

    if (!auth.currentUser || !Auth.isAdmin()){
      guard.classList.remove("hidden");
      content.classList.add("hidden");
      return;
    }
    guard.classList.add("hidden");
    content.classList.remove("hidden");

    Admin.bindTabs();
    await Admin.loadStats();
    await Admin.loadStoryTable();
    Admin.loadCategoryManager();
  },

  bindTabs(){
    document.querySelectorAll(".admin-tab").forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        document.getElementById("adminTabStories").classList.toggle("hidden", target !== "stories");
        document.getElementById("adminTabCategories").classList.toggle("hidden", target !== "categories");
      };
    });
  },

  async loadStats(){
    try{
      const storiesSnap = await db.collection("stories").get();
      let likeCount = 0, commentCount = 0;
      storiesSnap.forEach(doc => { likeCount += doc.data().likeCount || 0; });

      const usersSnap = await db.collection("users").get();

      // Comment count needs a subcollection sweep — capped for dashboard speed
      const commentPromises = storiesSnap.docs.slice(0, 30).map(doc =>
        doc.ref.collection("comments").get().then(s => s.size)
      );
      const counts = await Promise.all(commentPromises);
      commentCount = counts.reduce((a, b) => a + b, 0);

      document.getElementById("statStories").textContent = storiesSnap.size;
      document.getElementById("statLikes").textContent = likeCount;
      document.getElementById("statComments").textContent = commentCount;
      document.getElementById("statUsers").textContent = usersSnap.size;
    }catch(err){
      console.error(err);
    }
  },

  async loadStoryTable(){
    const tbody = document.getElementById("adminStoryTable");
    tbody.innerHTML = `<tr><td colspan="7">Load ho raha hai...</td></tr>`;
    try{
      const snap = await db.collection("stories").orderBy("createdAt", "desc").limit(100).get();
      if (snap.empty){
        tbody.innerHTML = `<tr><td colspan="7">Koi kahani nahi hai.</td></tr>`;
        return;
      }
      tbody.innerHTML = snap.docs.map(doc => {
        const s = doc.data();
        return `
          <tr>
            <td><a href="#story/${doc.id}">${escapeHTML(s.title)}</a></td>
            <td>${escapeHTML(s.authorName || "—")}</td>
            <td>${escapeHTML(Categories.labelFor(s.category))}</td>
            <td>${s.reads || 0}</td>
            <td>${s.likeCount || 0}</td>
            <td><span class="badge ${s.published ? 'published' : 'hidden'}">${s.published ? 'Live' : 'Hidden'}</span></td>
            <td class="row-actions">
              <button class="gold" data-action="toggle" data-id="${doc.id}" data-state="${!!s.published}">${s.published ? 'Hide' : 'Show'}</button>
              <button class="danger" data-action="delete" data-id="${doc.id}">Delete</button>
            </td>
          </tr>`;
      }).join("");

      tbody.querySelectorAll('button[data-action="toggle"]').forEach(btn => {
        btn.onclick = () => Admin.togglePublish(btn.dataset.id, btn.dataset.state === "true");
      });
      tbody.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.onclick = () => Admin.deleteStory(btn.dataset.id);
      });
    }catch(err){
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="7">⚠️ Table load nahi ho payi.</td></tr>`;
    }
  },

  async togglePublish(id, currentlyPublished){
    try{
      await db.collection("stories").doc(id).update({ published: !currentlyPublished });
      toast("Status update ho gaya.");
      Admin.loadStoryTable();
    }catch(err){
      console.error(err);
      toast("Update nahi ho paya.");
    }
  },

  async deleteStory(id){
    if (!confirm("Pakka delete karna hai? Yeh wapas nahi aayega.")) return;
    try{
      await db.collection("stories").doc(id).delete();
      toast("Kahani delete ho gayi.");
      Admin.loadStoryTable();
      Admin.loadStats();
    }catch(err){
      console.error(err);
      toast("Delete nahi ho paya.");
    }
  },

  loadCategoryManager(){
    const list = document.getElementById("categoryManageList");
    list.innerHTML = CATEGORIES.map(c =>
      `<span class="badge featured" style="margin:4px;">${escapeHTML(c.label)} <code style="opacity:.6;">(${c.id})</code></span>`
    ).join("");

    const form = document.getElementById("newCategoryForm");
    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById("newCategoryId").value.trim();
      const label = document.getElementById("newCategoryLabel").value.trim();
      if (!id || !label) return;
      CATEGORIES.push({ id, label });
      Categories.renderChips();
      Admin.loadCategoryManager();
      form.reset();
      toast(`Category "${label}" add ho gayi (is session ke liye). Permanent rakhne ke liye js/categories.js mein bhi add karo.`);
    };
  }
};
