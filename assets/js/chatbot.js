/* Lokal, kildebaseret chatbot. AI bruges kun i den separate GitHub Actions-træning. */
(() => {
  if (document.getElementById("association-chatbot")) return;

  const BASE = new URL("/", document.baseURI);
  const KNOWLEDGE_URL = new URL("chatbot/data/knowledge.json", BASE).href;
  const RESPONSE_RULES_URL = new URL("chatbot/config/response-rules.json", BASE).href;
  const TEXT = {
    title: "Spørg ejerforeningen",
    subtitle: "Informationsassistent",
    intro: "Hej! Jeg kan hjælpe med at finde information på ejerforeningens hjemmeside. Vælg et emne herunder, eller skriv dit spørgsmål direkte. Du kan altid spørge på tværs af emnerne.",
    topicsHeading: "Hvad drejer dit spørgsmål sig om?",
    topicPrompt: "Typiske spørgsmål om",
    backTopics: "Vis alle emner",
    placeholder: "Skriv dit spørgsmål…",
    send: "Send",
    open: "Spørg os",
    close: "Luk chatten",
    noMatch: "Jeg kunne ikke finde et sikkert svar i hjemmesidens nuværende information. Prøv at omformulere spørgsmålet, eller kontakt bestyrelsen.",
    sources: "Kilder",
    loading: "Indlæser foreningens viden…",
    error: "Vidensdatabasen kunne ikke indlæses lige nu.",
    disclaimer: "Jeg er en automatisk informationsassistent og kan ikke træffe beslutninger på bestyrelsens vegne."
  };

  // Emnevalg er kun genveje til forslag. De begrænser aldrig den almindelige søgning.
  const TOPICS = [
    {
      id: "parkering",
      label: "Parkering",
      questions: [
        "Hvordan kommer jeg på ventelisten?",
        "Nogen holder på min parkeringsplads",
        "Hvem administrerer parkeringspladserne?"
      ]
    },
    {
      id: "vedtaegter",
      label: "Vedtægter",
      questions: [
        "Hvad siger vedtægterne om generalforsamlingen?",
        "Hvad siger vedtægterne om udlejning?",
        "Hvor finder jeg vedtægterne?"
      ]
    },
    {
      id: "husorden",
      label: "Husorden",
      questions: [
        "Må vi holde hund?",
        "Hvad gælder om nattero?",
        "Må man ryge i opgangen?"
      ]
    },
    {
      id: "kontakt",
      label: "Kontakt",
      questions: [
        "Hvordan kontakter jeg bestyrelsen?",
        "Hvem kontakter jeg ved problemer med ejendommen?"
      ]
    },
    {
      id: "kaelderrum",
      label: "Kælderrum",
      questions: [
        "Hvordan lejer jeg et kælderrum?"
      ]
    },
    {
      id: "noeglebrikker",
      label: "Nøglebrikker",
      questions: [
        "Hvordan bestiller jeg en nøglebrik?",
        "Hvad gør jeg, hvis jeg har mistet min nøglebrik?"
      ]
    },
    {
      id: "nyheder",
      label: "Nyheder",
      questions: [
        "Hvor finder jeg nyhedsbreve fra bestyrelsen?"
      ]
    },
    {
      id: "affald",
      label: "Affald & storskrald",
      questions: [
        "Hvor ligger skralderum og storskraldsrum?",
        "Hvor finder jeg miljøskabet til farligt affald?"
      ]
    },
    {
      id: "generalforsamling",
      label: "Generalforsamling",
      questions: [
        "Hvornår afholdes generalforsamlingen?",
        "Hvor finder jeg referater, regnskab og prisblad?"
      ]
    },
    {
      id: "udlejning",
      label: "Udlejning & Airbnb",
      questions: [
        "Hvad er reglerne for Airbnb og korttidsudlejning?",
        "Hvordan udlejer jeg min lejlighed, og hvor er blanketten?"
      ]
    },
    {
      id: "vedligeholdelse",
      label: "Vedligeholdelse",
      questions: [
        "Hvad er ejerens ansvar ved vedligeholdelse?",
        "Hvad gør jeg ved vandskade eller sprunget rør?",
        "Hvad er proceduren ved lukning af vand?",
        "Hvad dækker bygningsforsikringen ved skade?"
      ]
    },
    {
      id: "generelt",
      label: "Generelle spørgsmål",
      questions: [
        "Hvad kan jeg spørge om?",
        "Hvordan bruger jeg chatbotten?",
        "Er dine svar officielle?"
      ]
    }
  ];

  const PREDEFINED_ANSWERS = [
    {
      match: /^(hvad kan jeg sporge om|hvad kan du hjaelpe med)\??$/,
      answer: "Jeg kan hjælpe med oplysninger om parkering, vedtægter, husorden, kontakt, kælderrum, nøglebrikker, nyheder, affald og storskrald, generalforsamling, udlejning og vedligeholdelse. Vælg et emne eller skriv et frit spørgsmål."
    },
    {
      match: /^(hvordan bruger jeg chatbotten)\??$/,
      answer: "Vælg et emne for at se forslag til typiske spørgsmål, eller skriv dit spørgsmål i feltet. Emnevalget er kun en genvej, da jeg stadig søger i hele hjemmesidens vidensdatabase, så du kan også spørge om noget helt andet."
    },
    {
      match: /^(er dine svar officielle|er dine svar bindende)\??$/,
      answer: "Nej. Jeg er en automatisk informationsassistent og kan ikke træffe beslutninger på bestyrelsens vegne. Brug kildelinkene, og kontakt bestyrelsen, hvis du er i tvivl."
    }
  ];

  // Synonymer hjælper med almindelige formuleringer, og de ændrer aldrig kildens regler.
  const synonyms = {
    parkering: ["parkering", "parkeringsplads", "venteliste", "bil", "p-plads", "parkeringskort"],
    husdyr: ["dyr", "hund", "hunde", "kat", "katte", "kæledyr"],
    husorden: ["regler", "støj", "cykler", "rygning", "trappe"],
    vedtaegter: ["vedtægter", "regler", "bestyrelse"],
    noeglebrik: ["noeglebrik", "noeglebrikker", "adgang", "adgangsbrik", "nøglekort"],
    kaelderrum: ["kaelderrum", "kaelder", "leje", "opbevaring"],
    kontakt: ["bestyrelse", "email", "telefon", "deas"],
    affald: ["storskrald", "skralderum", "storskraldsrum", "miljøskab", "genbrugsplads", "sortering", "rengøring", "hebsoe", "rotter"],
    generalforsamling: ["gf", "xgf", "referat", "referater", "indkaldelse", "dagsorden", "regnskab", "årsregnskab", "budget", "driftsbudget", "prisblad", "takster"],
    airbnb: ["udlejning", "korttidsudlejning", "fremleje", "udlejningsblanket", "navneskilte"],
    vvs: ["vvs", "rør", "vandrør", "afløb", "faldstamme", "faldstammer", "stigerør", "stigstreng", "stigstrenge", "forgrening", "forgreninger", "rørforgrening", "rørforgreninger", "vandhane", "blandingsbatteri", "armatur", "sanitet", "toilet", "cisterne", "håndvask", "vask", "bruser", "radiator", "afspærringshane"],
    vandskade: ["vandskade", "vandskader", "rørskade", "rørbrud", "sprunget", "lækage", "oversvømmelse", "vandudstrømning", "fugt", "fugtskade", "utæt", "utæthed"],
    badevaerelse: ["badeværelse", "badeværelset", "bad", "toilet", "toilettet", "sanitet", "vådrum"],
    forsikring: ["forsikring", "bygningsforsikring", "indboforsikring", "protector", "selvrisiko", "skade", "skader", "skadeanmeldelse", "skadesanmeldelse", "dækning"],
    vedligeholdelse: [
      "vedligehold", "vandlukning", "lukning af vand", "rørbrud", "rørskade", "vandrør", "vandskade", "vandskader",
      "sprunget", "sprunget rør", "faldstammer", "faldstamme", "stigerør", "stigstrenge", "forgrening", "forgreninger",
      "rørforgrening", "rørforgreninger", "vinduer", "radiator", "vvs", "fld", "ista",
      "badeværelse", "badeværelset", "bad", "toilet", "toilettet", "vandhane", "vandhaner", "håndvask", "sanitet", "armatur",
      "blandingsbatteri", "cisterne", "bruser", "afløb", "utæt", "drypper", "løber", "oversvømmelse", "fugt", "fugtskade",
      "afspærringshane", "døgnvagt", "forsikring", "bygningsforsikring", "indboforsikring", "protector", "selvrisiko",
      "skadesanmeldelse", "skadeanmeldelse"
    ]
  };

  const stopWords = new Set(["maa", "må", "vi", "jeg", "man", "kan", "det", "er", "der", "har", "have", "holde", "vores", "for", "med", "til", "om", "at", "en", "et", "min", "mit", "mine", "pa", "på", "af", "og", "eller", "som", "hvad", "hvem", "hvor", "hvordan", "hvorfor", "nu", "her", "hos"]);
  const intents = [
    { id: "husdyr", terms: ["husdyr", "dyr", "hund", "hunde", "kat", "katte", "kæledyr"], category: "husorden", section: 6 },
    { id: "fodring", terms: ["fodre", "fodring", "fugle", "katte", "fodres"], category: "husorden", section: 9 },
    { id: "stoej", terms: ["støj", "larm", "musik", "radio", "fjernsyn", "nattero", "højlydt"], category: "husorden", section: 7 },
    { id: "parkering", terms: ["parkering", "parkeringsplads", "parkeringspladser", "p-plads", "venteliste", "dinparkering", "parkeringskontrol", "pladsnummer", "uvedkommende", "holder på min plads", "forkert parkeret"], category: "parkering" },
    { id: "vedtaegter", terms: ["vedtægter", "vedtægt"], category: "vedtaegter" },
    { id: "affald", terms: ["affald", "storskrald", "skralderum", "storskraldsrum", "miljøskab", "genbrugsplads", "affaldssortering", "farligt affald", "hebsoe", "rengøring"], category: "affald" },
    { id: "generalforsamling", terms: ["generalforsamling", "generalforsamlingen", "referat", "referater", "gf", "xgf", "indkaldelse", "dagsorden", "regnskab", "årsregnskab", "budget", "driftsbudget", "prisblad"], category: "generalforsamling" },
    { id: "udlejning", terms: ["udlejning", "udleje", "airbnb", "korttidsudlejning", "fremleje", "udlejningsblanket", "navneskilte"], category: "udlejning" },
    {
      id: "vedligeholdelse",
      terms: [
        "vedligeholdelse", "vedligehold", "vandlukning", "lukning af vand", "lukke for vandet", "vandskade", "vandskader",
        "vandrør", "rør", "rørskade", "rørbrud", "sprunget", "sprunget rør", "varslingsseddel", "faldstamme", "faldstammer",
        "stigstreng", "stigstrenge", "stigerør", "forgrening", "forgreninger", "rørforgrening", "rørforgreninger", "fld", "ista",
        "indvendig vedligeholdelse", "udvendig vedligehold", "badeværelse", "badeværelset", "bad", "toilet", "toilettet",
        "vandhane", "vandhaner", "håndvask", "sanitet", "armatur", "blandingsbatteri", "cisterne", "bruser", "afløb",
        "utæt", "drypper", "løber", "oversvømmelse", "fugt", "fugtskade", "afspærringshane", "hovedhane", "døgnvagt",
        "forsikring", "bygningsforsikring", "indboforsikring", "selvrisiko", "skade", "skader", "skadesanmeldelse",
        "skadeanmeldelse", "protector"
      ],
      category: "vedligeholdelse"
    },
    { id: "kontakt", terms: ["kontakt", "bestyrelse", "bestyrelsen", "administrator", "email", "e-mail", "telefon", "deas"], category: "kontakt" },
    { id: "kaelderrum", terms: ["kælderrum", "kælder", "opbevaring"], category: "kaelderrum" },
    { id: "noeglebrikker", terms: ["nøglebrik", "nøglebrikker", "nøglekort", "adgangsbrik"], category: "noeglebrikker" },
    { id: "nyheder", terms: ["nyhed", "nyheder", "nyhedsbrev", "nyhedsbreve"], category: "nyheder" }
  ];

  let knowledge = null;
  let responseRules = { schema_version: 1, rules: [] };
  let loading = false;
  function normalize(value) {
    return String(value).toLocaleLowerCase("da")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a");
  }
  function tokens(value) {
    return normalize(value).match(/[a-z0-9]{2,}/g) || [];
  }
  function decomposeCompounds(term) {
    const parts = [term];
    const prefixes = ["vand", "ror", "bad", "skade", "bygning", "indbo", "fald", "stig", "hoved", "aflob"];
    for (const prefix of prefixes) {
      if (term.startsWith(prefix) && term.length > prefix.length + 2) {
        parts.push(prefix);
        parts.push(term.slice(prefix.length));
      }
    }
    return parts;
  }
  function expandedTokens(query) {
    const base = tokens(query).filter(term => !stopWords.has(term));
    const expanded = new Set();
    for (const t of base) {
      decomposeCompounds(t).forEach(p => {
        if (!stopWords.has(p) && p.length >= 2) expanded.add(p);
      });
    }
    const normalized = normalize(query);
    for (const [key, values] of Object.entries(synonyms)) {
      const group = [key, ...values].map(normalize);
      if (group.some(term => expanded.has(term) || (term.length > 3 && normalized.includes(term)))) {
        group.forEach(term => {
          if (!stopWords.has(term)) expanded.add(term);
        });
      }
    }
    return [...expanded];
  }
  function detectIntent(query) {
    const q = normalize(query);
    const words = q.split(/[^a-z0-9]+/);
    return intents.filter(intent => intent.terms.some(term => {
      const t = normalize(term);
      return words.includes(t) || (t.length > 4 && q.includes(t));
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
    if (intent && doc.category === intent.category) score += 8;
    if (intent && intent.section !== undefined && Number(doc.section) === intent.section) score += 24;
    if (intent?.id === "parkering") {
      const q = normalize(query);
      if (doc.topic === "enforcement" && /holder|uvedkommende|pladsnummer|forkert parkeret|dinparkering/.test(q)) score += 30;
      else if (doc.topic === "waitlist" && /venteliste|skrevet op|ledig plads/.test(q)) score += 30;
      else if (doc.topic === "overview") score += 8;
    } else if (intent?.id === "affald") {
      const q = normalize(query);
      if (doc.topic === "cleaning" && /rengoring|hebsoe|opgang|graesslaaning|vicevaert/.test(q)) score += 24;
      else if (doc.topic === "waste") score += 12;
    } else if (intent?.id === "generalforsamling") {
      const q = normalize(query);
      if (doc.topic === "finance" && /referat|regnskab|budget|prisblad|gebyr|takst|gf|xgf/.test(q)) score += 24;
      else if (doc.topic === "meeting") score += 12;
    } else if (intent?.id === "udlejning") {
      const q = normalize(query);
      if (doc.topic === "airbnb" && /airbnb|korttid|erhverv|forbud|ma man|ikke ma/.test(q)) score += 24;
      else if (doc.topic === "procedure" && /blanket|udlejningsblanket|navneskilt|hvordan|procedure/.test(q)) score += 24;
      else if (doc.topic === "conditions" && /betingelse|ansvar|haeftelse|vaerelse|fremleje/.test(q)) score += 24;
    } else if (intent?.id === "vedligeholdelse") {
      const q = normalize(query);
      if (/sprunget|springer|rorbrud|akut.*(vand|ror|vvs)|vand.*fosser|vand.*strommer|afspaerringshane|vvs.*dognvagt/.test(q)) {
        if (doc.topic === "water") score += 36;
      } else if (/faldstamm|stigeror|stigstreng|hovedstig|lodrette.*ror|facade|tag|murvaerk|udvendig|faelles.*(ror|ansvar)|bygningens klimaskaerm/.test(q)) {
        if (doc.topic === "exterior") score += 36;
      } else if (/vandskade|fugtskade|hvem.*daekker.*skade|bygningsforsikring.*vand|forsikring|protector|selvrisiko|skadesanmeldelse|skadeanmeldelse/.test(q)) {
        if (doc.topic === "insurance") score += 30;
        else if (doc.topic === "water") score += 20;
      } else if (/forgrening|badevaerels|toilet|vandhane|armatur|blandingsbatteri|handvask|bruser|cisterne|drypper|lober|aflob|indvendig|sanitet/.test(q)) {
        if (doc.topic === "interior") score += 30;
      } else if (/lukning.*vand|vandlukning|lukke.*vand|varsling.*vand|varslingsseddel/.test(q)) {
        if (doc.topic === "water") score += 30;
      } else {
        if (doc.topic === "water" && /vand|ror/.test(q)) score += 20;
        else if (doc.topic === "insurance" && /forsikring|skade/.test(q)) score += 20;
        else if (doc.topic === "interior") score += 14;
      }
    }
    const normalizedQuery = normalize(query);
    if (normalizedQuery.length > 4 && normalize(doc.content || "").includes(normalizedQuery)) score += 10;
    return score;
  }
  function search(query) {
    // Godkendte træningsspørgsmål peger på et konkret kildeafsnit.
    // Reglen vælger kun kilde; svaret formuleres stadig af den almindelige svarmotor.
    const normalizedQuestion = normalize(query).trim().replace(/[.!?]+$/g, "");
    const learnedRule = (responseRules.rules || []).find(rule =>
      normalize(rule.question || "").trim().replace(/[.!?]+$/g, "") === normalizedQuestion
    );
    if (learnedRule && knowledge?.documents) {
      const learnedDoc = knowledge.documents.find(doc => doc.id === learnedRule.document_id);
      if (learnedDoc) return [{ doc: learnedDoc, score: 1000, learned: true }];
    }
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
  function predefinedAnswer(question) {
    const normalized = normalize(question).trim().replace(/[.!?]+$/g, "");
    const found = PREDEFINED_ANSWERS.find(item => item.match.test(normalized));
    return found ? found.answer : null;
  }

  function formatAnswer(matches, question) {
    const primary = matches[0].doc;
    const intent = detectIntent(question);
    if (intent?.id === "husdyr" && primary.category === "husorden" && Number(primary.section) === 6) {
      return "Nej. Husordenens punkt 6 siger: “Det er ikke tilladt at holde husdyr.”";
    }
    if (intent?.id === "fodring" && primary.category === "husorden" && Number(primary.section) === 9) {
      return "Husordenens punkt 9 siger: “Det er IKKE tilladt at fodre fugle, katte og andre dyr på området.”";
    }
    if (intent?.id === "stoej" && primary.category === "husorden" && Number(primary.section) === 7) {
      return "Husordenens punkt 7 siger, at man i de sene aftentimer skal vise særligt hensyn til naboerne og dæmpe radio, fjernsyn, musik og instrumenter, så naboernes ønske om nattero ikke forstyrres. Der står ikke et bestemt klokkeslæt.";
    }
    if (intent?.id === "parkering" && primary.category === "parkering") {
      const query = normalize(question);
      if (primary.topic === "enforcement" || /holder.*(plads|parkering)|uvedkommende|forkert parkeret/.test(query)) {
        return "Hvis nogen holder på din parkeringsplads, skal du kontakte DinParkering, som står for parkeringskontrollen. Oplys gerne pladsnummer og bilens registreringsnummer.";
      }
      if (primary.topic === "waitlist" || /venteliste|skrevet op|ledig plads/.test(query)) {
        return "Ejerforeningens parkeringspladser administreres af bestyrelsen. Ønsker du en plads, kan du skrive dig på ventelisten via kontaktformularen på parkeringssiden.";
      }
      return "Ejerforeningens parkeringspladser administreres af bestyrelsen. Du kan skrive dig på ventelisten via kontaktformularen på parkeringssiden. Hvis nogen holder på din plads, skal du kontakte DinParkering.";
    }
    if (primary.category === "vedligeholdelse") {
      const q = normalize(question);
      if (/sprunget|springer|rorbrud|akut.*(vand|ror|vvs)|vand.*fosser|vand.*strommer|afspaerringshane|vvs.*dognvagt/.test(q)) {
        return "Ved akut rørbrud eller ukontrolleret vandudstrømning skal afspærringshanen lukkes omgående! Kontakt straks FLD Døgnvagt på tlf. 70 12 20 20 samt bestyrelsen. Ansvar og eventuel forsikringsdækning afhænger af, om skaden stammer fra fælles lodrette hovedstigstrenge/faldstammer (foreningens ansvar frem til forgreningen) eller lejlighedens egne indvendige rørforgreninger (ejerens ansvar), samt policens vilkår hos Protector Forsikring.";
      }
      if (/vandskade|fugtskade|skade.*(bad|toilet|ror|badevaerels)|(bad|toilet|badevaerels).*skade/.test(q)) {
        return "Ved vandskade i badeværelset eller lejligheden: Ved akut vandudstrømning luk straks afspærringshanen og ring til FLD Døgnvagt på tlf. 70 12 20 20 samt bestyrelsen. Foreningen har ansvaret for fælles lodrette hovedstigstrenge og faldstammer frem til den individuelle forgrening, mens indvendige rørforgreninger, sanitet og armaturer i lejligheden er ejerens eget ansvar. Eventuel dækning under ejendommens bygningsforsikring hos Protector Forsikring (anmeldes via DEAS selvbetjening) afgøres altid konkret af forsikringen efter policens vilkår; privat løsøre dækkes af egen indboforsikring.";
      }
      if (/toilet|vandhane|armatur|blandingsbatteri|handvask|bruser|cisterne|drypper|lober|sanitet/.test(q)) {
        return "Som ejer har du selv ansvaret for vedligeholdelse og reparation af sanitet, armaturer og radiatorer i lejligheden (vandhaner, blandingsbatterier, toiletter, cisterner, håndvaske og bruser) samt alle individuelle indvendige rørforgreninger efter tilslutningen til de fælles lodrette hovedstigstrenge og faldstammer. Kontakt en autoriseret VVS-installatør, f.eks. FLD på tlf. 70 12 20 20.";
      }
      if (/forsikring|bygningsforsikring|indboforsikring|protector|selvrisiko|skadesanmeldelse|skadeanmeldelse|anmeld.*skade/.test(q)) {
        return "Ejerforeningens bygningsforsikring hos Protector Forsikring omfatter selve bygningen, faste bygningsdele og fælles installationer (såsom fælles lodrette hovedstigstrenge og faldstammer) efter policens vilkår. Konkret dækning afgøres altid af forsikringsselskabet ud fra skadens placering og årsag; den dækker f.eks. ikke manglende vedligeholdelse eller almindeligt slid på ejerens egne indvendige forgreninger og sanitet, og privat indbo kræver egen indboforsikring. Skader anmeldes via DEAS selvbetjening eller bestyrelsen, og ved dækket selvforskyldt skade gælder prisbladets selvrisiko.";
      }
      if (/lukning.*vand|vandlukning|lukke.*vand|slukke.*vand|varsling.*vand/.test(q)) {
        return "Ved planlagt VVS-arbejde, der kræver lukning af vandet for en streng eller opgangen, skal det koordineres med autoriseret VVS (foreningens faste partner er FLD på tlf. 70 12 20 20). Der skal ophænges en tydelig varslingsseddel i opgangen i god tid (min. 3-5 dage før) med dato, tidsrum og kontaktoplysninger.";
      }
      if (/forgrening/.test(q) && !/faldstamm|stigeror|stigstreng|hovedstig|lodrette/.test(q)) {
        return "Vedtægterne (§ 7) skelner mellem lodrette fællesrør og indvendige forgreninger: Alle individuelle forgreninger på vand-, varme- og afløbsrør inde i lejligheden er ejerens eget ansvar, mens foreningen har ansvaret for de fælles lodrette hovedstigstrenge og faldstammer frem til den individuelle forgrening.";
      }
      if (/faldstamm|stigeror|stigstreng|hovedstig|lodrette.*ror|faelles.*ror/.test(q)) {
        return "Ejerforeningen har ansvaret for ejendommens fælles lodrette hovedstigstrenge til vand og varme samt lodrette faldstammer frem til den individuelle forgrening til den enkelte lejlighed (vedtægterne § 7, stk. 2). Alle individuelle indvendige rørforgreninger i lejligheden er ejerens eget ansvar (§ 7, stk. 1).";
      }
    }
    const excerpt = primary.content.trim();
    // Hold standardsvaret kort: højst to sætninger og 45 ord.
    const sentences = excerpt.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 2);
    let concise = sentences.join(" ");
    const words = concise.split(/\s+/);
    if (words.length > 45) concise = words.slice(0, 45).join(" ").replace(/[,:;]$/, "") + "…";
    return concise;
  }

  const style = document.createElement("link");
  style.rel = "stylesheet"; style.href = new URL("assets/css/chatbot.css", BASE).href;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "association-chatbot";
  root.innerHTML = `
    <button class="acb-launcher" type="button" aria-label="${TEXT.open}" aria-expanded="false">
      <span aria-hidden="true">✦</span><span class="acb-launcher-label">Spørg os</span>
    </button>
    <section class="acb-panel" role="dialog" aria-modal="false" aria-label="${TEXT.title}" hidden>
      <header class="acb-header">
        <div><strong class="acb-title">${TEXT.title}</strong><small class="acb-subtitle">${TEXT.subtitle}</small></div>
      </header>
      <div class="acb-messages" aria-live="polite" aria-relevant="additions"></div>
      <form class="acb-form">
        <label class="acb-sr-only" for="acb-input">Spørgsmål</label>
        <input id="acb-input" class="acb-input" maxlength="500" autocomplete="off" placeholder="${TEXT.placeholder}" required />
        <button class="acb-send" type="submit">${TEXT.send}</button>
      </form>
      <p class="acb-disclaimer">${TEXT.disclaimer}</p>
    </section>`;
  document.body.appendChild(root);

  const panel = root.querySelector(".acb-panel");
  const launcher = root.querySelector(".acb-launcher");
  const messages = root.querySelector(".acb-messages");
  const form = root.querySelector(".acb-form");
  const input = root.querySelector(".acb-input");

  function addMessage(kind, text, results = []) {
    const item = document.createElement("div"); item.className = `acb-message acb-${kind}`;
    const body = document.createElement("div"); body.className = "acb-message-text"; body.textContent = text;
    item.appendChild(body);
    if (results.length) {
      const sourceHeading = document.createElement("strong");
      sourceHeading.className = "acb-sources-heading"; sourceHeading.textContent = TEXT.sources;
      item.appendChild(sourceHeading);
      const list = document.createElement("ul"); list.className = "acb-sources";
      results.forEach(({doc}) => {
        const li = document.createElement("li"); const a = document.createElement("a");
        const sourceUrl = new URL(doc.source.url, BASE);
        if (doc.page && /\.pdf$/i.test(doc.source.url)) sourceUrl.hash = `page=${doc.page}`;
        else if (doc.anchor) sourceUrl.hash = doc.anchor;
        a.href = sourceUrl.href;
        const title = doc.title || doc.source.file;
        const location = doc.section && !new RegExp(`punkt\\s*${doc.section}`, "i").test(title)
          ? ` - punkt ${doc.section}`
          : (!doc.section && doc.page && !new RegExp(`side\\s*${doc.page}`, "i").test(title) ? ` - side ${doc.page}` : "");
        a.textContent = title + location; a.target = "_self";
        li.appendChild(a); list.appendChild(li);
      });
      item.appendChild(list);
    }
    messages.appendChild(item); messages.scrollTop = messages.scrollHeight;
  }
  function addTopicMenu() {
    const item = document.createElement("div");
    item.className = "acb-message acb-bot acb-topic-message";
    const heading = document.createElement("strong");
    heading.className = "acb-topic-heading";
    heading.textContent = TEXT.topicsHeading;
    item.appendChild(heading);
    const grid = document.createElement("div");
    grid.className = "acb-topic-grid";
    TOPICS.forEach(topic => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "acb-topic-button";
      button.textContent = topic.label;
      button.addEventListener("click", () => showTopicQuestions(topic.id));
      grid.appendChild(button);
    });
    item.appendChild(grid);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTopicQuestions(topicId) {
    const topic = TOPICS.find(item => item.id === topicId);
    if (!topic) return;
    const item = document.createElement("div");
    item.className = "acb-message acb-bot acb-topic-message";
    const heading = document.createElement("strong");
    heading.className = "acb-topic-heading";
    heading.textContent = `${TEXT.topicPrompt} ${topic.label.toLocaleLowerCase("da")}:`;
    item.appendChild(heading);
    const grid = document.createElement("div");
    grid.className = "acb-question-grid";
    topic.questions.forEach(question => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "acb-question-button";
      button.textContent = question;
      button.addEventListener("click", () => submitQuestion(question));
      grid.appendChild(button);
    });
    item.appendChild(grid);
    const back = document.createElement("button");
    back.type = "button";
    back.className = "acb-topic-back";
    back.textContent = TEXT.backTopics;
    back.addEventListener("click", addTopicMenu);
    item.appendChild(back);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  async function submitQuestion(question) {
    const cleanQuestion = String(question || "").trim();
    if (!cleanQuestion) return;
    addMessage("user", cleanQuestion);
    input.value = "";

    // Generelle spørgsmål om selve chatbotten får korte, faste svar.
    const fixedAnswer = predefinedAnswer(cleanQuestion);
    if (fixedAnswer) {
      addMessage("bot", fixedAnswer);
      return;
    }

    await loadKnowledge();
    // Søgningen er bevidst global: valget af emne må aldrig blokere spørgsmål om andre emner.
    const matches = search(cleanQuestion);
    if (!matches.length) {
      addMessage("bot", TEXT.noMatch);
      return;
    }
    addMessage("bot", formatAnswer(matches, cleanQuestion), matches.slice(0, 1));
  }

  async function loadKnowledge() {
    if (knowledge || loading) return;
    loading = true;
    try {
      const [knowledgeResponse, rulesResponse] = await Promise.all([
        fetch(KNOWLEDGE_URL, { cache: "no-cache" }),
        fetch(RESPONSE_RULES_URL, { cache: "no-cache" }).catch(() => null)
      ]);
      if (!knowledgeResponse.ok) throw new Error(`HTTP ${knowledgeResponse.status}`);
      knowledge = await knowledgeResponse.json();
      if (rulesResponse?.ok) {
        const loadedRules = await rulesResponse.json();
        if (loadedRules && Array.isArray(loadedRules.rules)) responseRules = loadedRules;
      }
    } catch (error) {
      console.error("Chatbot knowledge load failed:", error);
      addMessage("bot", TEXT.error);
    } finally { loading = false; }
  }

  launcher.addEventListener("click", async () => {
    panel.hidden = !panel.hidden;
    launcher.setAttribute("aria-expanded", String(!panel.hidden));
    launcher.setAttribute("aria-label", panel.hidden ? TEXT.open : TEXT.close);
    if (!panel.hidden) {
      await loadKnowledge();
      if (!messages.children.length) {
        addMessage("bot", TEXT.intro);
        addTopicMenu();
      }
      input.focus();
    }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    await submitQuestion(input.value);
  });
})();
