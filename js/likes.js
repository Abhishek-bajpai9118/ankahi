/* ==========================================================================
   ANKAHI — likes.js
   One like per logged-in user per story, stored in stories/{id}/likes/{uid}
   ========================================================================== */

const Likes = {
  async hasLiked(storyId){
    if (!auth.currentUser) return false;
    const doc = await db.collection("stories").doc(storyId)
      .collection("likes").doc(auth.currentUser.uid).get();
    return doc.exists;
  },

  async toggle(storyId){
    if (!auth.currentUser){
      toast("Like karne ke liye login karo ❤️");
      location.hash = "login";
      return null;
    }
    const storyRef = db.collection("stories").doc(storyId);
    const likeRef = storyRef.collection("likes").doc(auth.currentUser.uid);

    return db.runTransaction(async (t) => {
      const likeDoc = await t.get(likeRef);
      const storyDoc = await t.get(storyRef);
      const currentCount = storyDoc.data().likeCount || 0;

      if (likeDoc.exists){
        t.delete(likeRef);
        t.update(storyRef, { likeCount: Math.max(0, currentCount - 1) });
        return { liked: false, count: Math.max(0, currentCount - 1) };
      } else {
        t.set(likeRef, { uid: auth.currentUser.uid, createdAt: FieldValue.serverTimestamp() });
        t.update(storyRef, { likeCount: currentCount + 1 });
        return { liked: true, count: currentCount + 1 };
      }
    });
  },

  async bindDetailButton(storyId){
    const btn = document.getElementById("detailLikeBtn");
    const countEl = document.getElementById("detailLikeCount");
    if (!btn) return;

    const liked = await Likes.hasLiked(storyId);
    btn.classList.toggle("liked", liked);

    btn.onclick = async () => {
      btn.disabled = true;
      const result = await Likes.toggle(storyId);
      if (result){
        btn.classList.toggle("liked", result.liked);
        countEl.textContent = result.count;
      }
      btn.disabled = false;
    };
  }
};
