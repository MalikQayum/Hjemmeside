# CSS - Hjemmesidens stylesheets (`/assets/css/`)

Denne mappe indeholder alle færdige CSS-filer, som browseren indlæser for at style **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Oversigt over stylesheets og komponenter

### 1. Hoved-stylesheet
- **`main.css`:**
  - Grundlæggende Editorial-design af HTML5 UP tilpasset ejerforeningens visuelle identitet.
  - Typografi: Roboto Slab (overskrifter og knapper) og Open Sans (brødtekst).
  - Farvepalette: Primær rød signaturfarve (`#f56a6a`), dæmpet mørkegrå tekst (`#3d4449`), lys grå baggrunde (`#f5f6f7`) og bløde kantlinjer (`rgba(210, 215, 217, 0.75)`).
  - Knapper (`.button`): Responsiv højde, centrering og tekstombrydning med `max-width: 100%`, så lange danske titler aldrig flyder ud over kort og bokse.
  - Flex/Grid beskyttelse: `.row > *`, `#main`, `#banner` og `.box` har alle `min-width: 0` for at eliminere horisontalt overløb på små skærme.

### 2. Side- og modulafrænset styling
- **`kontakt.css`:**
  - Styling for `/kontakt/` med kort-layout (`.contact-card`).
  - Responsivt gitter (`.contact-grid`): Begrænset til præcis 3 kolonner på desktop, 2 på tablet (`<= 980px`) og 1 på mobil (`<= 640px`).
  - Puls-animation (`cardTargetPulse`) ved ankomst via ankerlinks (`:target`).
  - Tekstbeskyttelse (`overflow-wrap: anywhere`) for e-mails, telefonnumre og eksterne adresser.
- **`contact-form.css`:**
  - Genanvendelig 2-kolonne struktur (`.contact-equal-row`, `.contact-card-box`) brugt på `/noegler/`, `/kaelderrum/`, `/vedligeholdelse/` og `/udlejning/`.
  - Fleksible prisbokse (`.info-contact-price-box`), der automatisk tilpasser højden og ombryder priser.
  - Feedback- og statuspaneler (`.info-contact-status`).
- **`parking-overview.css`:**
  - Specialstyling til parkeringssiden (`/parkering/`).
  - Dækker kontaktformularen, ledighedskort (`.parking-status-card`) og den offentlige ventelistetabel (`.parking-table`).
- **`kaelderrum-live.css`:**
  - Styling til den dynamiske kælderrumstabel (`.kaelderrum-live-table`).
  - Status-badges for udlejede lokaler (`.kaelderrum-live-status-pill.is-rented`) og ledige lokaler.
- **`home.css`:**
  - Forsidens 3D-videocontainer (`.home-video-container`) og Leaflet-områdekort (`.home-area-map`).
  - Affaldssorteringssidens grid-layout (`.waste-layout`) med 40/60 opdeling mellem tekst og multimedie.
- **`chatbot.css`:**
  - Flydende "Spørg os"-launcher i nederste højre hjørne.
  - Dialogpanel (`.acb-panel`), beskedbobler, emneknapper og fuld mobiltilpasning.
- **`bestyrelsen.css`:**
  - Styling for den interne administrationsside på `/bestyrelsen/` (login, ventelisteredigering, prisblads-editor og kælderrumsstyring).
- **`pdf-viewer.css` & `docx-viewer.css`:**
  - Formatering af de indlejrede dokumentvisere for PDF.js og docx-preview.
- **`fontawesome-all.min.css`:**
  - Font Awesome 5 Free ikonfont (solid og brands).

---

## Retningslinjer for CSS-vedligeholdelse

1. **Undgå `white-space: nowrap` på knapper og bokse:** Tekster på dansk kan være lange (f.eks. "Spørgsmål til regnskab (DEAS)"). Tillad altid tekstombrydning med `max-width: 100%`.
2. **Bevar `min-width: 0` på flex- og grid-børn:** Dette forhindrer browsere i at beregne børneelementers bredde ud fra deres længste uafbrudte tekststreng, hvilket ellers skaber horisontale rullebjælker på mobiler.
3. **Placér modulstyling i den rette fil:** Ændringer, der kun vedrører ét modul (f.eks. kontaktkort eller kælderrum), skal foretages i det pågældende stylesheet frem for at overbelaste `main.css`.

[Tilbage til repositoryoversigten](../../README.md)

