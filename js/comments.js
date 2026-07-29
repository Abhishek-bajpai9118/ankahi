/* ==========================================================================
   ANKAHI — comments.js
   Comments stored in stories/{id}/comments/{commentId}
   ========================================================================== */

const Comments = {
  currentStoryId: null,

  async load(storyId){
    Comments.currentStoryId = storyId;
    const list = document.getElementById("commentsList");
    const form = document.getElementById("commentForm");
    if (!list) return;

    list.innerHTML = `<div class="loader" style="margin:16px auto;"></div>`;

    try{
      const snap = await db.collection("stories").doc(storyId)
        .collection("comments").orderBy("createdAt", "desc").limit(50).get();

      if (snap.empty){
        list.innerHTML = `<p style="color:var(--ink-soft); font-size:.9rem;">Sabse pehla comment tum karo!</p>`;
      } else {
        list.innerHTML = snap.docs.map(doc => Comments.itemHTML(doc.id, doc.data())).join("");
        list.querySelectorAll("button.del").forEach(btn => {
          btn.onclick = () => Comments.remove(storyId, btn.dataset.id);
        });
      }
    }catch(err){
      console.error(err);
      list.innerHTML = `<p style="color:var(--maroon);">Comments load nahi ho paye.</p>`;
    }

    if (form) form.onsubmit = (e) => Comments.add(e, storyId);
  },

  itemHTML(id, c){
    const canDelete = auth.currentUser && (auth.currentUser.uid === c.uid || Auth.isAdmin());
    return `
      <div class="comment">
        <div class="c-head">
          <span><strong>${escapeHTML(c.authorName || "Anonymous")}</strong> · ${timeAgo(c.createdAt)}</span>
          ${canDelete ? `<button class="del" data-id="${id}">Delete</button>` : ""}
        </div>
        <p>${escapeHTML(c.text)}</p>
      </div>`;
  },

  async add(e, storyId){
    e.preventDefault();
    if (!auth.currentUser){
      toast("Comment karne ke liye login karo 💬");
      location.hash = "login";
      return;
    }
    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    try{
      await db.collection("stories").doc(storyId).collection("comments").add({
        text,
        uid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "Anonymous",
        authorPhoto: auth.currentUser.photoURL || "",
        createdAt: FieldValue.serverTimestamp()
      });
      input.value = "";
      Comments.load(storyId);
    }catch(err){
      console.error(err);
      toast("Comment post nahi ho paya.");
    }
  },

  async remove(storyId, commentId){
    if (!confirm("Comment delete karna hai?")) return;
    try{
      await db.collection("stories").doc(storyId).collection("comments").doc(commentId).delete();
      Comments.load(storyId);
    }catch(err){
      console.error(err);
      toast("Delete nahi ho paya.");
    }
  }
};
