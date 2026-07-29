/* ==========================================================================
   ANKAHI — ai.js
   AI Story Generator. Uses the person's OWN free Google Gemini API key
   (stored only in their browser's localStorage — never sent anywhere else).
   Get a free key at: https://aistudio.google.com/app/apikey
   ========================================================================== */

const AI = {
  KEY_STORAGE: "ankahi_gemini_key",

  getKey(){
    let key = localStorage.getItem(AI.KEY_STORAGE);
    if (!key){
      key = prompt("Apni free Gemini API key daalo (sirf tumhare browser mein save hogi):\nhttps://aistudio.google.com/app/apikey");
      if (key) localStorage.setItem(AI.KEY_STORAGE, key.trim());
    }
    return key ? key.trim() : null;
  },

  async generate(userPrompt){
    const key = AI.getKey();
    if (!key) throw new Error("No API key");

    const systemHint = "Tum ek Hindi/Urdu shayar aur kahani-lekhak ho. Hinglish ya Hindi mein, bhavuk aur khoobsurat lafzon mein ek chhota sa kahani-tukda ya shayari likho (100-150 shabd). Sirf content do, koi extra explanation nahi.";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemHint}\n\nTopic/Prompt: ${userPrompt}` }] }]
      })
    });

    if (!res.ok){
      const errText = await res.text();
      throw new Error(errText || "API error");
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("aiGenerateBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const promptInput = document.getElementById("aiPrompt");
    const suggestionBox = document.getElementById("aiSuggestion");
    const topic = promptInput.value.trim() || document.getElementById("storyTitle").value.trim();

    if (!topic){
      toast("Pehle thoda topic ya title likho, phir AI se madad lo ✨");
      return;
    }

    btn.disabled = true;
    btn.textContent = "✨ Soch raha hai...";
    suggestionBox.classList.remove("hidden");
    suggestionBox.textContent = "AI likh raha hai...";

    try{
      const text = await AI.generate(topic);
      suggestionBox.textContent = text || "Kuch nahi mila, dobara try karo.";
      if (text){
        suggestionBox.insertAdjacentHTML("beforeend", `
          <div style="margin-top:10px;">
            <button type="button" class="btn-ghost" id="useAiTextBtn" style="font-size:.8rem;">📋 Content mein daalo</button>
          </div>`);
        document.getElementById("useAiTextBtn").onclick = () => {
          const contentBox = document.getElementById("storyContent");
          contentBox.value = contentBox.value ? `${contentBox.value}\n\n${text}` : text;
          toast("AI draft content mein add ho gaya, ab isse apne andaaz mein sanwaar lo ✍️");
        };
      }
    }catch(err){
      console.error(err);
      suggestionBox.textContent = "⚠️ AI se response nahi mila. API key check karo ya thodi der baad try karo.";
    }finally{
      btn.disabled = false;
      btn.textContent = "✨ Generate";
    }
  });
});
