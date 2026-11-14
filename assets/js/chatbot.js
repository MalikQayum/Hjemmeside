/* Ejerforeningens lokale, vidensbaserede chatbot – ingen ekstern AI/API. */
(() => {
  if (document.getElementById("association-chatbot")) return;

  const BASE = new URL("/", document.baseURI);
  const KNOWLEDGE_URL = new URL("chatbot/data/knowledge.json", BASE).href;
  const TEXT = {
    da: {
      title: "Spørg ejerforeningen", subtitle: "Dansk / English",
      intro: "Hej! Jeg kan hjælpe med at finde information på ejerforeningens hjemmeside. Hvad vil du gerne vide?",
      placeholder: "Skriv dit spørgsmål…", send: "Send", open: "Åbn chat med ejerforeningen",
      noMatch: "Jeg kunne ikke finde et sikkert svar i hjemmesidens nuværende information. Prøv at omformulere spørgsmålet, eller kontakt bestyrelsen.",
      sources: "Kilder", loading: "Indlæser foreningens viden…", error: "Vidensdatabasen kunne ikke indlæses lige nu.",
      disclaimer: "Jeg er en automatisk informationsassistent og kan ikke træffe beslutninger på bestyrelsens vegne."
    },
    en: {
      title: "Ask the association", subtitle: "Danish / English",
      intro: "Hello! I can help you find information on the association website. What would you like to know?",
      placeholder: "Type your question…", send: "Send", open: "Open association chat",
      noMatch: "I could not find a reliable answer in the website's current information. Try rephrasing your question or contact the board.",
      sources: "Sources", loading: "Loading the association's information…", error: "The knowledge file could not be loaded right now.",
      disclaimer: "I am an automated information assistant and cannot make decisions on behalf of the board."
    }
  };

  // Synonymer hjælper med almindelige formuleringer – de ændrer aldrig kildens regler.
  const synonyms = {
    parkering: ["parking", "parkeringsplads", "venteliste", "bil", "p-plads", "parkeringskort"],
    husdyr: ["dyr", "hund", "hunde", "kat", "katte", "kæledyr", "kæledyr", "pets", "pet", "dog", "dogs", "cat", "cats"],
    husorden: ["regler", "støj", "affald", "cykler", "rygning", "trappe"],
    vedtaegter: ["vedtægter", "regler", "bestyrelse", "generalforsamling"],
    noeglebrik: ["noeglebrik", "adgang", "nøglekort", "key fob", "keycard"],
    kælderrum: ["kaelderrum", "leje", "opbevaring", "basement storage"],
    kontakt: ["bestyrelse", "email", "telefon", "deas", "contact"],
    airbnb: ["udlejning", "korttidsudlejning", "fremleje"]
  };

  const stopWords = new Set(["maa", "må", "vi", "jeg", "man", "kan", "det", "er", "der", "har", "have", "holde", "holde", "vores", "for", "med", "til", "om", "at", "en", "et", "the", "can", "we", "i", "a", "is", "are"]);
  const intents = [
    { id: "husdyr", terms: ["husdyr", "dyr", "hund", "hunde", "kat", "katte", "kæledyr", "pet", "pets", "dog", "cat"], category: "husorden", section: 6 },
    { id: "fodring", terms: ["fodre", "fodring", "fugle", "katte", "fodres"], category: "husorden", section: 9 },
    { id: "stoej", terms: ["støj", "larm", "musik", "radio", "fjernsyn", "nattero", "højlydt"], category: "husorden", section: 7 },
    { id: "parkering", terms: ["parkering", "parkeringsplads", "parkeringspladser", "p-plads", "venteliste", "dinparkering", "parkeringskontrol", "pladsnummer", "uvedkommende", "holder på min plads", "forkert parkeret", "parking", "parking space"], category: "parkering" }
  ];

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
    const base = tokens(query).filter(term => !stopWords.has(term));
    const expanded = new Set(base);
    const normalized = normalize(query);
    for (const [key, values] of Object.entries(synonyms)) {
      const group = [key, ...values].map(normalize);
      if (group.some(term => base.includes(term) || (term.length > 3 && normalized.includes(term)))) group.forEach(term => expanded.add(term));
    }
    return [...expanded];
  }
  function detectIntent(query) {
    const q = normalize(query);
    return intents.filter(intent => intent.terms.some(term => {
      const t = normalize(term);
      return q.split(/[^a-z0-9]+/).includes(t) || (t.length > 4 && q.includes(t));
    })).sort((a, b) => b.terms.filter(t => q.includes(normalize(t))).length - a.terms.filter(t => q.includes(normalize(t))).length)[0] || null;
  }
  function scoreDocument(doc, queryTerms, query, intent) {
    const title = tokens(doc.title || "");
    const content = tokens(doc.content || "");
    const keywords = tokens((doc.keywords || []).join(" "));
    const category = tokens(doc.category || "");
    let score = 0;
    for (const term of queryTerms) {
      if (title.includes(term)) score += 9;
      if (keywords.includes(term)) score += 6;
      if (category.includes(term)) score += 3;
      const occurrences = content.filter(word => word === term).length;
      score += Math.min(occurrences, 4) * 1.2;
    }
    if (intent && doc.category === intent.category) score += 5;
    if (intent && intent.section !== undefined && Number(doc.section) === intent.section) score += 24;
    if (intent?.id === "parkering") {
      const q = normalize(query);
      if (doc.topic === "enforcement" && /holder|uvedkommende|pladsnummer|forkert parkeret|dinparkering/.test(q)) score += 30;
      else if (doc.topic === "waitlist" && /venteliste|skrevet op|ledig plads/.test(q)) score += 30;
      else if (doc.topic === "overview") score += 8;
    }
    const normalizedQuery = normalize(query);
    if (normalizedQuery.length > 4 && normalize(doc.content || "").includes(normalizedQuery)) score += 10;
    return score;
  }
  function search(query) {
    const terms = expandedTokens(query);
    const intent = detectIntent(query);
    const ranked = (knowledge?.documents || []).map(doc => ({ doc, score: scoreDocument(doc, terms, query, intent) }))
      .filter(item => item.score >= 6)
      .sort((a, b) => b.score - a.score);
    // Ved kendte emner prioriteres det præcise husordenspunkt; undgå at blande andre punkter ind.
    if (intent) {
      const exact = intent.section !== undefined
        ? ranked.filter(item => item.doc.category === intent.category && Number(item.doc.section) === intent.section)
        : ranked.filter(item => item.doc.category === intent.category);
      if (exact.length) return exact.slice(0, 1);
    }
    return ranked.slice(0, 1);
  }
  function formatAnswer(matches, question) {
    const primary = matches[0].doc;
    const intent = detectIntent(question);
    if (language === "da" && intent?.id === "husdyr" && primary.category === "husorden" && Number(primary.section) === 6) {
      return "Nej. Husordenens punkt 6 siger: “Det er ikke tilladt at holde husdyr.”";
    }
    if (language === "da" && intent?.id === "fodring" && primary.category === "husorden" && Number(primary.section) === 9) {
      return "Husordenens punkt 9 siger: “Det er IKKE tilladt at fodre fugle, katte og andre dyr på området.”";
    }
    if (language === "da" && intent?.id === "stoej" && primary.category === "husorden" && Number(primary.section) === 7) {
      return "Husordenens punkt 7 siger, at man i de sene aftentimer skal vise særligt hensyn til naboerne og dæmpe radio, fjernsyn, musik og instrumenter, så naboernes ønske om nattero ikke forstyrres. Der står ikke et bestemt klokkeslæt.";
    }
    if (language === "da" && intent?.id === "parkering" && primary.category === "parkering") {
      const query = normalize(question);
      if (primary.topic === "enforcement" || /holder.*(plads|parkering)|uvedkommende|forkert parkeret/.test(query)) {
        return "Hvis nogen holder på din parkeringsplads, skal du kontakte DinParkering, som står for parkeringskontrollen. Oplys gerne pladsnummer og bilens registreringsnummer.";
      }
      if (primary.topic === "waitlist" || /venteliste|skrevet op|ledig plads/.test(query)) {
        return "Ejerforeningens parkeringspladser administreres af bestyrelsen. Ønsker du en plads, kan du skrive dig på ventelisten via kontaktformularen på parkeringssiden.";
      }
      return "Ejerforeningens parkeringspladser administreres af bestyrelsen. Du kan skrive dig på ventelisten via kontaktformularen på parkeringssiden. Hvis nogen holder på din plads, skal du kontakte DinParkering.";
    }
    const excerpt = primary.content.trim();
    return language === "en"
      ? "I found this information in the association's Danish source material. The original wording is shown below:\n\n" + excerpt
      : excerpt;
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
        const sourceUrl = new URL(doc.source.url, BASE);
        if (doc.page && /\.pdf$/i.test(doc.source.url)) sourceUrl.hash = `page=${doc.page}`;
        a.href = sourceUrl.href;
        const title = doc.title || doc.source.file;
        const location = doc.section && !new RegExp(`punkt\\s*${doc.section}`, "i").test(title)
          ? ` – punkt ${doc.section}`
          : (!doc.section && doc.page && !new RegExp(`side\\s*${doc.page}`, "i").test(title) ? ` – side ${doc.page}` : "");
        a.textContent = title + location; a.target = "_self";
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
    // Svarene bygges kun af fundne kilder. Ingen ekstern AI og ingen regel-fortolkning.
    addMessage("bot", formatAnswer(matches, question), matches.slice(0, 1));
  });

  updateLanguage();
})();
