/* ==========================================================================
   ANKAHI — search.js
   Debounced search box in the nav; filters the home story grid.
   ========================================================================== */

const Search = {
  debounceTimer: null,

  bind(){
    const input = document.getElementById("navSearch");
    if (!input) return;
    input.addEventListener("input", () => {
      clearTimeout(Search.debounceTimer);
      Search.debounceTimer = setTimeout(() => {
        const q = input.value.trim();
        if (location.hash.replace("#", "") !== "home"){
          location.hash = "home";
        }
        Categories.active = "all";
        Categories.renderChips();
        Stories.reload({ search: q || null });
      }, 350);
    });
  }
};

document.addEventListener("DOMContentLoaded", Search.bind);
