/* Ejerforeningens lokale, vidensbaserede chatbot – ingen ekstern AI/API. */
(() => {
  if (document.getElementById("association-chatbot")) return;

  const BASE = new URL("/", document.baseURI);
  const KNOWLEDGE_URL = new URL("chatbot/data/knowledge.json", BASE).href;
  const TEXT = {
    da: {
      title: "Spørg ejerforeningen", subtitle: "Informationsassistent · Dansk og English",
      intro: "Hej! Jeg kan hjælpe med at finde information på ejerforeningens hjemmeside. Hvad vil du gerne vide?",
      placeholder: "Skriv dit spørgsmål…", send: "Send", open: "Åbn chat med ejerforeningen",
      noMatch: "Jeg kunne ikke finde et sikkert svar i hjemmesidens nuværende information. Prøv at omformulere spørgsmålet, eller kontakt bestyrelsen.",
      sources: "Kilder", loading: "Indlæser foreningens viden…", error: "Vidensdatabasen kunne ikke indlæses lige nu.",
      disclaimer: "Jeg er en automatisk informationsassistent og kan ikke træffe beslutninger på bestyrelsens vegne."
    },
    en: {
      title: "Ask the association", subtitle: "Information assistant · Dansk og English",
      intro: "Hello! I can help you find information on the association website. What would you like to know?",
      placeholder: "Type your question…", send: "Send", open: "Open association chat",
      noMatch: "I could not find a reliable answer in the website's current information. Try rephrasing your question or contact the board.",
      sources: "Sources", loading: "Loading the association's information…", error: "The knowledge file could not be loaded right now.",
      disclaimer: "I am an automated information assistant and cannot make decisions on behalf of the board."
    }
  };

  const synonyms = {
    parkering: ["parking", "parkeringsplads", "venteliste", "bil", "dinparkering"],
    parking: ["parkering", "parkeringsplads", "waiting list"],
    husdyr: ["dyr", "hund", "kat", "pets", "pet", "dog", "cat"],
    pets: ["husdyr", "dyr", "hund", "kat"],
    husorden: ["regler", "støj", "affald", "cykler", "rygning", "trappe"],
    vedtaegter: ["vedtægter", "regler", "bestyrelse", "generalforsamling"],
    nøglebrik: ["noeglebrik", "adgang", "nøglekort", "key fob", "keycard"],
    kælderrum: ["kaelderrum", "leje", "opbevaring", "basement storage"],
    kontakt: ["bestyrelse", "email", "telefon", "deas", "contact"],
    airbnb: ["udlejning", "korttidsudlejning", "fremleje"]
  };

  let language = detectLanguage(navigator.language || "da");
  let knowledge = null;
  let loading = false;

  function detectLanguage(value) { return String(value).toLowerCase().startsWith("en") ? "en" : "da"; }
  function normalize(value) {
    return String(value).toLocaleLowerCase("da")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a");
  }
  function tokens(value) {
    return normalize(value).match(/[a-z0-9]{2,}/g) || [];
  }
  function expandedTokens(query) {
    const base = tokens(query);
    const expanded = new Set(base);
    for (const [key, values] of Object.entries(synonyms)) {
      const group = [key, ...values].map(normalize);
      if (group.some(term => base.includes(term) || normalize(query).includes(term))) group.forEach(term => expanded.add(term));
    }
    return [...expanded];
  }
  function scoreDocument(doc, queryTerms, query) {
    const title = tokens(doc.title || "");
    const content = tokens(doc.content || "");
    const keywords = tokens((doc.keywords || []).join(" "));
    const category = tokens(doc.category || "");
    let score = 0;
    for (const term of queryTerms) {
      if (title.includes(term)) score += 7;
      if (keywords.includes(term)) score += 5;
      if (category.includes(term)) score += 4;
      const occurrences = content.filter(word => word === term).length;
      score += Math.min(occurrences, 5) * 1.4;
    }
    const normalizedQuery = normalize(query);
    if (normalizedQuery.length > 4 && normalize(doc.content || "").includes(normalizedQuery)) score += 12;
    return score;
  }
  function search(query) {
    const terms = expandedTokens(query);
    return (knowledge?.documents || []).map(doc => ({ doc, score: scoreDocument(doc, terms, query) }))
      .filter(item => item.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  const style = document.createElement("link");
  style.rel = "stylesheet"; style.href = new URL("assets/css/chatbot.css", BASE).href;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "association-chatbot";
  root.innerHTML = `
    <button class="acb-launcher" type="button" aria-label="${TEXT[language].open}" aria-expanded="false">
      <span aria-hidden="true">✦</span><span class="acb-launcher-label">Spørg os</span>
    </button>
    <section class="acb-panel" role="dialog" aria-modal="false" aria-label="${TEXT[language].title}" hidden>
      <header class="acb-header">
        <div><strong class="acb-title"></strong><small class="acb-subtitle"></small></div>
        <div class="acb-header-actions">
          <button class="acb-language" type="button" aria-label="Switch language">EN</button>
          <button class="acb-close" type="button" aria-label="Close chat">×</button>
        </div>
      </header>
      <div class="acb-messages" aria-live="polite" aria-relevant="additions"></div>
      <form class="acb-form">
        <label class="acb-sr-only" for="acb-input">Question</label>
        <input id="acb-input" class="acb-input" maxlength="500" autocomplete="off" required />
        <button class="acb-send" type="submit"></button>
      </form>
      <p class="acb-disclaimer"></p>
    </section>`;
  document.body.appendChild(root);

  const panel = root.querySelector(".acb-panel");
  const launcher = root.querySelector(".acb-launcher");
  const messages = root.querySelector(".acb-messages");
  const form = root.querySelector(".acb-form");
  const input = root.querySelector(".acb-input");

  function updateLanguage() {
    const t = TEXT[language];
    root.querySelector(".acb-title").textContent = t.title;
    root.querySelector(".acb-subtitle").textContent = t.subtitle;
    root.querySelector(".acb-language").textContent = language === "da" ? "EN" : "DA";
    root.querySelector(".acb-send").textContent = t.send;
    root.querySelector(".acb-disclaimer").textContent = t.disclaimer;
    input.placeholder = t.placeholder;
    launcher.setAttribute("aria-label", t.open);
    panel.setAttribute("aria-label", t.title);
  }
  function addMessage(kind, text, results = []) {
    const item = document.createElement("div"); item.className = `acb-message acb-${kind}`;
    const body = document.createElement("div"); body.className = "acb-message-text"; body.textContent = text;
    item.appendChild(body);
    if (results.length) {
      const sourceHeading = document.createElement("strong");
      sourceHeading.className = "acb-sources-heading"; sourceHeading.textContent = TEXT[language].sources;
      item.appendChild(sourceHeading);
      const list = document.createElement("ul"); list.className = "acb-sources";
      results.forEach(({doc}) => {
        const li = document.createElement("li"); const a = document.createElement("a");
        a.href = new URL(doc.source.url, BASE).href;
        a.textContent = doc.title || doc.source.file; a.target = "_self";
        li.appendChild(a); list.appendChild(li);
      });
      item.appendChild(list);
    }
    messages.appendChild(item); messages.scrollTop = messages.scrollHeight;
  }
  async function loadKnowledge() {
    if (knowledge || loading) return;
    loading = true;
    try {
      const response = await fetch(KNOWLEDGE_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      knowledge = await response.json();
    } catch (error) {
      console.error("Chatbot knowledge load failed:", error);
      addMessage("bot", TEXT[language].error);
    } finally { loading = false; }
  }

  launcher.addEventListener("click", async () => {
    panel.hidden = !panel.hidden;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) {
      updateLanguage(); await loadKnowledge();
      if (!messages.children.length) addMessage("bot", TEXT[language].intro);
      input.focus();
    }
  });
  root.querySelector(".acb-close").addEventListener("click", () => {
    panel.hidden = true; launcher.setAttribute("aria-expanded", "false"); launcher.focus();
  });
  root.querySelector(".acb-language").addEventListener("click", () => {
    language = language === "da" ? "en" : "da"; updateLanguage();
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const question = input.value.trim(); if (!question) return;
    addMessage("user", question); input.value = "";
    await loadKnowledge();
    const matches = search(question);
    if (!matches.length) {
      addMessage("bot", TEXT[language].noMatch);
      return;
    }
    // V1 er bevidst retrieval-baseret: den viser kildeuddrag uden at opfinde AI-svar.
    const excerpts = matches.slice(0, 3).map(({doc}) => doc.content.trim()).join("\n\n");
    const answer = language === "en"
      ? "I found relevant information in the association's Danish source material. The excerpts below are shown in their original language:\n\n" + excerpts
      : excerpts;
    addMessage("bot", answer, matches.slice(0, 3));
  });

  updateLanguage();
})();
