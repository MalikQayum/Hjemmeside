# JavaScript - Browserfunktioner og scripts (`/assets/js/`)

Denne mappe indeholder alle klientside-scripts, der driver den interaktive funktionalitet på hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Scripts kører direkte i den besøgendes browser og er optimeret til høj ydeevne uden unødvendige tunge frameworks.

---

## Moduler og scripts

### 1. Fælles navigation og sideopsætning
- **`load-sidebar.js`:**
  - Henter og indsætter den centrale `sidebar.html` asynkront på samtlige undersider.
  - Håndterer aktiv menumarkering (`aria-current="page"`) ud fra `window.location.pathname`.
  - Styrer mobilmenuens åbne/lukke-tilstand samt accordion-undergrupper.
  - Tjekker `chatbot/config/config.json` og indlæser automatisk chatbottens script og stylesheet, når `enabled` er `true`.
- **`util.js` & `browser.min.js` & `breakpoints.min.js`:**
  - HTML5 UP Editorial-hjælpefunktioner til breakpoint-registrering, scroll-håndtering og browserkompatibilitet.
- **`jquery.min.js`:**
  - Understøttende jQuery-bibliotek til Editorial-skabelonens overgangs- og menuanimationer.

### 2. Dynamiske priser og live dataintegrationer
- **`public-price-bindings.js`:**
  - Søger efter elementer med attributten `data-price-id` på tværs af undersiderne (`/noegler/`, `/parkering/`, `/kaelderrum/`, `/vedligeholdelse/`).
  - Henter foreningens officielle priser asynkront fra GitHub-repositoryet `Vigerslev-Skyttegard/bestyrelsen/generalforsamling/prisblad.json`.
  - Erstatter automatisk pladsholdere med opdaterede formaterede priser (f.eks. `100 kr.`, `Kr. 300,- / md.` eller `kr. 2.500,-`).
- **`general-price-list.js`:**
  - Specifikt script til generalforsamlingssiden (`/generalforsamling/`).
  - Genererer og indsætter hele pristabellen (`#price-table-body`) med ydelser, beskrivelser, beløb og tidsstempel for seneste opdatering.
- **`kaelderrum-live.js`:**
  - Henter bestyrelsens kælderrumsdata for de 11 lokaler og kobler dem sammen med den aktuelle kvadratmetersats (`price-008`).
  - Beregner live månedlig leje for hvert rums faste areal og renderer statustabellen på `/kaelderrum/`.
- **`parking-overview.js`:**
  - Henter den officielle parkeringsventeliste direkte fra `Vigerslev-Skyttegard/bestyrelsen/parkering/data.json`.
  - Renderer tilmeldingsdato, registreringsstatus og anonymiseret adresse med fejl- og indlæsningstilstande.

### 3. Kontaktformularer og brugerinteraktion
- **`contact-form.js`:**
  - Fælles formularhåndtering for nøglebrikbestilling (`/noegler/`) og kælderrumshenvendelser (`/kaelderrum/`).
  - Dynamisk visning/skjulning af felter baseret på henvendelsestype (f.eks. bestilling vs. spærring).
  - Live beregning af samlet pris for nøglebrikker og nøglekort inkl. postkassesamtykke.
- **`parking-contact-form.js`:**
  - Håndterer kontaktformularen på parkeringssiden med validering af adresse, navn og e-mail.

### 4. Dokumentvisere og interaktive moduler
- **`home-map.js`:**
  - Initialiserer det interaktive områdekort på forsiden vha. Leaflet.js og GeoJSON.
  - Opsætter kategorifiltre (skoler, tog, bus, indkøb, parkering) og klikbare infobokse.
- **`pdf-viewer.js`:**
  - Indlæser og renderer `Husorden.pdf` og `Vedtægter.pdf` direkte i browseren med Mozilla PDF.js.
- **`docx-viewer.js`:**
  - Udpakker og renderer `Nyhedsbrev.docx` klientside ved hjælp af JSZip og docx-preview.
- **`chatbot.js`:**
  - Den klientside søgemaskine og chatgrænseflade for foreningens chatbot. Søger mod `chatbot/data/knowledge.json`.
- **`bestyrelsen.js`:**
  - Internt script til bestyrelsens administrationsmodul på `/bestyrelsen/`.

---

## Retningslinjer for JavaScript-udvikling

1. **Ingen hemmeligheder i browseren:** Alle scripts kører på klienten. Placér aldrig personfølsomme data, private nøgler eller adgangskoder i JavaScript.
2. **Modulær opbygning:** Hold specifikke funktioner (f.eks. parkering, kælderrum, kort) i deres egne afgrænsede filer frem for at samle alt i ét stort script.
3. **Fejlhåndtering:** Sørg for at netværkskald til GitHub API håndterer rate limits og fejl pænt med en brugervenlig besked i stedet for at gå ned.

[Tilbage til repositoryoversigten](../../README.md)

