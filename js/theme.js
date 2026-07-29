/* ==========================================================================
   ANKAHI — theme.js
   Dark / light mode toggle, persisted in localStorage.
   ========================================================================== */

const Theme = {
  KEY: "ankahi_theme",

  init(){
    const saved = localStorage.getItem(Theme.KEY);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)){
      document.body.classList.add("dark-mode");
      Theme.updateIcon();
    }
  },

  toggle(){
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem(Theme.KEY, isDark ? "dark" : "light");
    Theme.updateIcon();
  },

  updateIcon(){
    const btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", Theme.toggle);
});
