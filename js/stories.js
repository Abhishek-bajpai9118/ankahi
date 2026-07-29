/* ==========================================================================
   ANKAHI — stories.js
   Create / read / list / edit / delete stories. Handles cover image + PDF
   upload to Firebase Storage, read-counter, and grid + detail rendering.
   ========================================================================== */

const Stories = {
  PAGE_SIZE: 9,
  lastDoc: null,
  currentFilter: { category: null, search: null },
  editingId: null,

  colRef(){ return db.collection("stories"); },

  /* ---------------------- List / Grid ---------------------- */
  async reload({ category = null, search = null } = {}){
    Stories.currentFilter = { category, search };
    Stories.lastDoc = null;
    const grid = document.getElementById("storyGrid");
    grid.innerHTML = `<div class="loader"></div>`;
    await Stories.loadPage(true);
  },

  async loadPage(isFirst = false){
    const grid = document.getElementById("storyGrid");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    let query = Stories.colRef().where("published", "==", true);

    if (Stories.currentFilter.category){
      query = query.where("category", "==", Stories.currentFilter.category);
    }
    query = query.orderBy("createdAt", "desc").limit(Stories.PAGE_SIZE);
    if (Stories.lastDoc) query = query.startAfter(Stories.lastDoc);

    try{
      const snap = await query.get();
      if (isFirst) grid.innerHTML = "";

      if (snap.empty && isFirst){
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
          <div class="flame-big">🪔</div>
          <p>Abhi koi kahani nahi hai. Sabse pehli kahani tum likho!</p>
          <a href="#write" class="btn-primary">✍ Likhna Shuru Karo</a>
        </div>`;
        loadMoreBtn.classList.add("hidden");
        return;
      }

      let docs = snap.docs;
      // client-side search filter (title/content contains, case-insensitive)
      if (Stories.currentFilter.search){
        const q = Stories.currentFilter.search.toLowerCase();
        docs = docs.filter(d => {
          const data = d.data();
          return (data.title || "").toLowerCase().includes(q) ||
                 (data.content || "").toLowerCase().includes(q);
        });
      }

      docs.forEach(doc => grid.insertAdjacentHTML("beforeend", Stories.cardHTML(doc.id, doc.data())));

      grid.querySelectorAll("img[data-src]").forEach(lazyObserve);

      Stories.lastDoc = snap.docs[snap.docs.length - 1] || Stories.lastDoc;
      loadMoreBtn.classList.toggle("hidden", snap.docs.length < Stories.PAGE_SIZE);
      loadMoreBtn.onclick = () => Stories.loadPage(false);
    }catch(err){
      console.error(err);
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        ⚠️ Kahaniyaan load nahi ho payi. Firebase config check karo (js/firebase.js).
      </div>`;
    }
  },

  cardHTML(id, s){
    const cover = s.imageURL
      ? `<img class="cover skeleton" data-src="${s.imageURL}" alt="${escapeHTML(s.title)}">`
      : `<div class="cover placeholder">🪔</div>`;
    return `
      <a href="#story/${id}" class="story-card">
        ${cover}
        <div class="body">
          <span class="cat-tag">${escapeHTML(Categories.labelFor(s.category))}</span>
          <h3>${escapeHTML(s.title)}</h3>
          <p class="excerpt">${escapeHTML((s.content || "").slice(0, 140))}...</p>
          <div class="story-meta">
            <span>${escapeHTML(s.authorName || "Anonymous")}</span>
            <span class="stats">
              <span>❤️ ${s.likeCount || 0}</span>
              <span>📖 ${s.reads || 0}</span>
            </span>
          </div>
        </div>
      </a>`;
  },

  /* ---------------------- Detail View ---------------------- */
  async openStory(id){
    const wrap = document.getElementById("storyDetail");
    wrap.innerHTML = `<div class="loader"></div>`;
    try{
      const doc = await Stories.colRef().doc(id).get();
      if (!doc.exists){
        wrap.innerHTML = `<div class="empty-state">Yeh kahani nahi mili.</div>`;
        return;
      }
      const s = doc.data();
      Stories.colRef().doc(id).update({ reads: firebase.firestore.FieldValue.increment(1) }).catch(()=>{});

      const cover = s.imageURL ? `<img class="cover" src="${s.imageURL}" alt="${escapeHTML(s.title)}">` : "";
      const pdfBtn = s.pdfURL ? `<a class="pdf-download" href="${s.pdfURL}" target="_blank" rel="noopener">📄 PDF Padho / Download Karo</a>` : "";
      const canEdit = auth.currentUser && (auth.currentUser.uid === s.authorId || Auth.isAdmin());

      wrap.innerHTML = `
        ${cover}
        <span class="cat-tag">${escapeHTML(Categories.labelFor(s.category))}</span>
        <h1>${escapeHTML(s.title)}</h1>
        <div class="byline">
          <span>✍ ${escapeHTML(s.authorName || "Anonymous")}</span>
          <span>🕒 ${timeAgo(s.createdAt)}</span>
          <span>📖 ${(s.reads || 0) + 1} reads</span>
        </div>
        <div class="content">${escapeHTML(s.content)}</div>
        <div class="story-actions">
          ${pdfBtn}
          <button class="btn-ghost like-btn" id="detailLikeBtn">❤️ <span id="detailLikeCount">${s.likeCount || 0}</span></button>
          <button class="btn-ghost" id="shareBtn">🔗 Share Karo</button>
          ${canEdit ? `<button class="btn-ghost" id="editStoryBtn">✏️ Edit</button>` : ""}
          ${canEdit ? `<button class="btn-ghost" id="deleteStoryBtn" style="color:var(--maroon);">🗑 Delete</button>` : ""}
        </div>

        <div class="comments-section">
          <h3 class="field-label" style="font-size:1rem;">Comments 💬</h3>
          <form id="commentForm" class="comment-form">
            <textarea id="commentInput" placeholder="Apna khayal likho..." required></textarea>
            <button type="submit" class="btn-primary">Bhejo</button>
          </form>
          <div id="commentsList"></div>
        </div>
      `;

      document.getElementById("shareBtn").onclick = () => shareStory(id, s.title);
      Likes.bindDetailButton(id);
      Comments.load(id);

      if (canEdit){
        document.getElementById("editStoryBtn").onclick = () => {
          location.hash = "write";
          setTimeout(() => Stories.loadForEdit(id, s), 50);
        };
        document.getElementById("deleteStoryBtn").onclick = () => Stories.deleteStory(id, s);
      }
    }catch(err){
      console.error(err);
      wrap.innerHTML = `<div class="empty-state">⚠️ Kahani load nahi ho payi.</div>`;
    }
  },

  async deleteStory(id, s){
    if (!confirm("Pakka is kahani ko delete karna hai?")) return;
    try{
      await Stories.colRef().doc(id).delete();
      if (s.imagePath) storage.ref(s.imagePath).delete().catch(()=>{});
      if (s.pdfPath) storage.ref(s.pdfPath).delete().catch(()=>{});
      toast("Kahani delete ho gayi.");
      location.hash = "home";
    }catch(err){
      console.error(err);
      toast("Delete nahi ho paya.");
    }
  },

  /* ---------------------- Editor ---------------------- */
  resetEditor(){
    Stories.editingId = null;
    document.getElementById("editorTitle").textContent = "Apni Kahani Likho ✍";
    document.getElementById("storyForm").reset();
    document.getElementById("aiSuggestion").classList.add("hidden");
    Categories.renderOptions(document.getElementById("storyCategory"));
  },

  loadForEdit(id, s){
    Stories.editingId = id;
    document.getElementById("editorTitle").textContent = "Kahani Edit Karo ✏️";
    document.getElementById("storyTitle").value = s.title;
    document.getElementById("storyContent").value = s.content;
    Categories.renderOptions(document.getElementById("storyCategory"));
    document.getElementById("storyCategory").value = s.category;
  },

  async uploadFile(file, folder){
    const path = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const ref = storage.ref(path);
    const task = ref.put(file);

    const progressWrap = document.getElementById("uploadProgressWrap");
    const progressText = document.getElementById("uploadProgressText");
    progressWrap.classList.remove("hidden");

    return new Promise((resolve, reject) => {
      task.on("state_changed", snap => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        progressText.textContent = `Upload ho raha hai... ${pct}%`;
      }, reject, async () => {
        const url = await task.snapshot.ref.getDownloadURL();
        progressWrap.classList.add("hidden");
        resolve({ url, path });
      });
    });
  },

  async publish(e){
    e.preventDefault();
    if (!auth.currentUser){
      toast("Pehle login karo ✍️");
      location.hash = "login";
      return;
    }

    const title = document.getElementById("storyTitle").value.trim();
    const category = document.getElementById("storyCategory").value;
    const content = document.getElementById("storyContent").value.trim();
    const imageFile = document.getElementById("storyImage").files[0];
    const pdfFile = document.getElementById("storyPdf").files[0];
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.textContent = "Publish ho raha hai...";

    try{
      const data = {
        title, category, content,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        authorPhoto: auth.currentUser.photoURL || "",
        published: true,
        updatedAt: FieldValue.serverTimestamp()
      };

      if (imageFile){
        const { url, path } = await Stories.uploadFile(imageFile, "story-images");
        data.imageURL = url; data.imagePath = path;
      }
      if (pdfFile){
        const { url, path } = await Stories.uploadFile(pdfFile, "story-pdfs");
        data.pdfURL = url; data.pdfPath = path;
      }

      if (Stories.editingId){
        await Stories.colRef().doc(Stories.editingId).update(data);
        toast("Kahani update ho gayi! ✨");
        location.hash = `story/${Stories.editingId}`;
      } else {
        data.createdAt = FieldValue.serverTimestamp();
        data.reads = 0;
        data.likeCount = 0;
        const ref = await Stories.colRef().add(data);
        toast("Kahani publish ho gayi! 🎉");
        location.hash = `story/${ref.id}`;
      }
      Stories.resetEditor();
    }catch(err){
      console.error(err);
      toast("Publish nahi ho paya, dobara try karo.");
    }finally{
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Publish Karo";
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("storyForm");
  if (form) form.addEventListener("submit", Stories.publish);

  const cancelBtn = document.getElementById("cancelEditBtn");
  if (cancelBtn) cancelBtn.addEventListener("click", () => { location.hash = "home"; });
});
