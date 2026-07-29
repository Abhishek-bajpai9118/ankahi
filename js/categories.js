/* ==========================================================================
   ANKAHI — categories.js
   ========================================================================== */

const CATEGORIES = [
  { id: "shayari",   label: "शायरी" },
  { id: "kahani",    label: "कहानी" },
  { id: "motivation",label: "प्रेरणा" },
  { id: "kashi",     label: "काशी / आध्यात्म" },
  { id: "prem",      label: "प्रेम" },
  { id: "dosti",     label: "दोस्ती" },
  { id: "zindagi",   label: "ज़िंदगी" }
];

const Categories = {
  active: "all",

  renderChips(){
    const el = document.getElementById("categoryBar");
    if (!el) return;
    const chips = [{ id: "all", label: "सभी" }, ...CATEGORIES];
    el.innerHTML = chips.map(c =>
      `<button class="chip ${Categories.active === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`
    ).join("");
    el.querySelectorAll(".chip").forEach(btn => {
      btn.onclick = () => Categories.filter(btn.dataset.cat);
    });
  },

  filter(catId){
    Categories.active = catId;
    Categories.renderChips();
    Stories.reload({ category: catId === "all" ? null : catId });
  },

  labelFor(id){
    const found = CATEGORIES.find(c => c.id === id);
    return found ? found.label : id;
  },

  renderOptions(selectEl){
    selectEl.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join("");
  }
};
