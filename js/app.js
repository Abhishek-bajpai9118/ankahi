/* ==========================================================================
   ANKAHI — app.js
   Hash-based router + shared UI helpers (toast, lazy loading, ticker).
   ========================================================================== */

const VIEWS = ["home", "story", "write", "login", "admin"];

function showView(name){
  VIEWS.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle("hidden", v !== name);
  });
  document.querySelectorAll(".nav-btn[data-view]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function router(){
  const hash = location.hash.replace("#", "") || "home";
  const [route, param] = hash.split("/");

  if (route === "story" && param){
    showView("story");
    Stories.openStory(param);
  } else if (route === "write"){
    if (!auth.currentUser){
      toast("Story likhne ke liye pehle login karo ✍️");
      location.hash = "login";
      return;
    }
    showView("write");
    Stories.resetEditor();
  } else if (route === "admin"){
    showView("admin");
    Admin.init();
  } else if (route === "login"){
    showView("login");
  } else if (route.startsWith("category:")){
    showView("home");
    Categories.filter(route.split(":")[1]);
  } else {
    showView("home");
    Stories.reload({ category: Categories.active === "all" ? null : Categories.active });
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  Categories.renderChips();
  Categories.renderOptions(document.getElementById("storyCategory"));
  router();
  initLazyLoading();
  initTicker();

  const googleBtn = document.getElementById("googleLoginBtn");
  if (googleBtn) googleBtn.addEventListener("click", Auth.loginWithGoogle);
});

/* ---------------------- Toast ---------------------- */
let toastTimer;
function toast(msg, ms = 2600){
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), ms);
}

/* ---------------------- Lazy loading (IntersectionObserver) ---------------------- */
function initLazyLoading(){
  if (!("IntersectionObserver" in window)) return;
  window._lazyObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const img = entry.target;
        if (img.dataset.src){
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          img.classList.remove("skeleton");
        }
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "150px" });
}
function lazyObserve(img){
  if (window._lazyObserver) window._lazyObserver.observe(img);
}

/* ---------------------- Hero shayari ticker ---------------------- */
const SHAYARI_LINES = [
  "लफ़्ज़ों में आग, ख़ामोशी में वज़न।",
  "हर कहानी अधूरी है, जब तक तुम ना सुनो।",
  "काशी की गलियों में हर पत्थर एक कहानी कहता है।",
  "जो कहा नहीं जा सका, वो यहाँ लिख दो — अनकही में।",
  "शब्द रुकते हैं, एहसास नहीं।"
];
function initTicker(){
  const el = document.getElementById("shayariTicker");
  if (!el) return;
  let i = 0;
  const render = () => {
    el.innerHTML = `<span>${SHAYARI_LINES[i]}</span>`;
    i = (i + 1) % SHAYARI_LINES.length;
  };
  render();
  setInterval(render, 4200);
}

/* ---------------------- Share helper ---------------------- */
async function shareStory(id, title){
  const url = `${location.origin}${location.pathname}#story/${id}`;
  if (navigator.share){
    try{
      await navigator.share({ title: `Ankahi — ${title}`, text: "Ye kahani padho Ankahi par:", url });
      return;
    }catch(e){ /* user cancelled — fall through to copy */ }
  }
  try{
    await navigator.clipboard.writeText(url);
    toast("Link copy ho gaya! Ab share karo 🔗");
  }catch(e){
    toast(url);
  }
}

/* ---------------------- Small utils ---------------------- */
function escapeHTML(str = ""){
  return str.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function timeAgo(ts){
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return "abhi";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min pehle`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ghante pehle`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} din pehle`;
  return date.toLocaleDateString("hi-IN");
}
