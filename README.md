# Hjemmeside – Ejerforeningen Skyttegård/Vigerslev

Velkommen til det officielle kildekode-repository for **Ejerforeningen Skyttegård/Vigerslev** (Skyttegårdsvej 1-11 og Vigerslevvej 144-148 i Valby).

Hjemmesiden fungerer som den primære informationsportal for nuværende og nye ejere samt beboere i foreningen.

---

## 🌐 Domæne & Hosting
- **Aktivt domæne:** [www.skyttegaardvej.dk](https://www.skyttegaardvej.dk)
- **GitHub Pages:** Integreret med automatisk CNAME-opsætning (`skyttegaardvej.dk`).
- **Ikke købt domæne:** `www.vigerslevvej.dk`

---

## 📄 Sider og Funktioner

### 1. Forside (`/`)
- **Sti:** `index.html`
- Introduktion og genveje til ejerforeningens vigtigste informationer.
- Interaktivt områdekort med relevante faciliteter og lokationer i nærområdet.

### 2. Velkomstbrev (`/velkomstbrev/`)
- **Sti:** `velkomstbrev/index.html`
- Praktisk information, retningslinjer og introduktion for nye tilflyttere og boligejere.

### 3. Husorden og Vedtægter (`/husorden-vedtaegter/`)
- **Sti:** `husorden-vedtaegter/index.html`
- Interaktiv dokumentvisning med **PDF.js** til nem læsning af vedtægter og husorden direkte i browseren uden at skulle downloade filer.

### 4. Nyheder (`/nyhed/`)
- **Sti:** `nyhed/index.html`
- Seneste nyheder, meddelelser og referater.
- Viser automatisk foreningens nyhedsbrev direkte fra Word-format (`.docx`).

### 5. Parkering (`/parkering/`)
- **Sti:** `parkering/index.html`
- **Øverst (2-kolonne layout):**
  - **Venstre kolonne:** Information om parkering i foreningen samt oplysninger om uretmæssig parkering (DinParkering døgnvagt).
  - **Højre kolonne:** Forudfyldt kontaktformular til bestyrelsen (valg mellem *Venteliste* eller *Andre henvendelser*, adresse i foreningen, navn, e-mail og bemærkninger).
- **Nederst:** Livevisning af ejerforeningens opdaterede parkeringsventeliste via Excel/SheetJS-integration.

### 6. Leje af kælderrum (`/kaelderrum/`)
- **Sti:** `kaelderrum/index.html`
- Information om leje af kælderrum, lejevilkår, opkrævning og venteliste.
- Integreret kontaktformular direkte til bestyrelsen, forudfyldt med emnet "Leje af kælderrum".

### 7. Bestilling af nøglebrikker (`/noeglebrikker/`)
- **Sti:** `noeglebrikker/index.html`
- Information om det elektroniske adgangssystem, regler for udlevering, håndtering af mistede/defekte nøglebrikker samt kontaktformular til bestilling og spærring af brikker.

### 8. Kontakt (`/kontakt/`)
- **Sti:** `kontakt/index.html`
- Kontaktside med moderne kort-layout (cards) for:
  - **Bestyrelsen** (`bestyrelse@skyttegaardvej.dk`)
  - **DEAS A/S** (Ejendomsadministration)
  - **ISTA Danmark A/S** (Forbrugs- og varmeregnskab)
  - **HOFOR** (Vand og fjernvarme)
  - **Finn L. & Davidsen A/S** (Fast håndværker & døgnvagt)
  - **DinParkering** (Parkeringskontrol)

### 9. Design- & Komponentreferencer (`/eksempler/`)
- **Sti:** `eksempler/index.html`
- Eksempelside med HTML5 UP Editorial-skabelonens knapper, formularer, tabeller og typografi til fremtidige udvidelser.

---

## 🗺️ Interaktivt områdekort

Områdekortet viser ejerforeningens placering og relevante faciliteter i nærområdet inden for en radius på 1,5 km.

Kortet er bygget med **Leaflet** og **OpenStreetMap** og anvender en GeoJSON-fil til geografiske data.

### Datafil
- **Sti:** `assets/data/ejerforeningen-omraadekort.geojson`
- Indeholder kortets geografiske punkter, herunder skoler, dagligvarebutikker, busstoppesteder, togstationer og parkeringsmuligheder.
- Indeholder også polygonen for ejerforeningens 1,5 km-radius.

### Tilføj eller fjern lokationer

Alle lokationer vedligeholdes i:

`assets/data/ejerforeningen-omraadekort.geojson`

For at tilføje et nyt sted skal der oprettes et nyt `Feature`-objekt under filens `features`-array.

Eksempel på en skole:

```json
{
  "type": "Feature",
  "properties": {
    "name": "Skolens navn",
    "description": "Beskrivelse af skolen",
    "category": "school"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [
      12.485000,
      55.663000
    ]
  }
}
```

**Koordinater:**
- Første koordinat er længdegrad (longitude).
- Andet koordinat er breddegrad (latitude).
- Koordinater angives i decimalgrader.

For at fjerne en lokation slettes det tilhørende `Feature`-objekt fra GeoJSON-filen.

### Eksisterende kategorier

| Kategori i GeoJSON | Visningsnavn |
|---|---|
| `association` | Ejerforeningen |
| `grocery` | Dagligvarebutikker |
| `school` | Skoler |
| `bus` | Busstoppesteder |
| `train` | Togstationer |
| `parkingFree` | Offentlig gadeparkering |
| `parkingLimited` | Tidsbegrænset parkering |
| `parkingPrivate` | Privat parkering |
| `center` | Centrum |
| `radiusCircle` | Afgrænsning af 1,5 km radius |

### Automatisk visning

Når en lokation tilføjes med en eksisterende kategori:
- JavaScript placerer automatisk punktet på kortet.
- Det korrekte ikon og den tilhørende farve anvendes.
- Punktet vises under den relevante kategori i kortets filter.
- Besøgende kan klikke på punktet for at se navn og beskrivelse.

**Der kræves ingen ændringer i JavaScript eller CSS**, når der tilføjes eller fjernes lokationer under eksisterende kategorier.

Hvis der oprettes en helt ny kategori, skal `categoryConfig` i JavaScript-filen også opdateres med kategoriens interne navn, visningsnavn, ikon og farve.

### Kortets funktioner
- Fastlåst kortvisning uden mulighed for at trække eller panorere kortet.
- Ingen zoomknapper, scroll-zoom eller touch-zoom.
- Automatisk tilpasning til 1,5 km-radius ved indlæsning.
- Klikbare markører med navn og beskrivelse.
- Kategorifiltre, så besøgende kan vælge, hvilke steder der vises.
- OpenStreetMap anvendes som kortbaggrund med påkrævet kreditering.

---

## ⚙️ GitHub Actions – Automatisk synkronisering fra OneDrive

Hjemmesiden anvender **GitHub Actions** til automatisk at hente og opdatere udvalgte dokumenter fra Microsoft OneDrive.

Formålet er at holde hjemmesidens dokumenter opdaterede uden manuel download og upload til GitHub.

### Funktionalitet
- Automatisk kørsel efter workflowets fastsatte tidsplan.
- Mulighed for manuel igangsættelse via GitHub Actions (`workflow_dispatch`), hvis workflowet understøtter det.
- Henter de nyeste versioner af de konfigurerede dokumenter fra OneDrive.
- Kontrollerer, om filerne er ændret.
- Opretter automatisk et commit til repositoryet, når der registreres ændringer.
- Undgår unødvendige commits, hvis filerne er uændrede.

### Vedligeholdelse
Hvis filer flyttes eller omdøbes i OneDrive, skal de tilsvarende referencer i synkroniseringsworkflowet opdateres.

Hvis nye dokumenter skal synkroniseres, skal de tilføjes til workflowets konfiguration.

### Godkendelse og sikkerhed
- Adgang til OneDrive håndteres gennem GitHub Secrets.
- Følsomme godkendelsesoplysninger må aldrig indsættes direkte i workflow-filer eller scripts.
- Repositoryets rettigheder skal tillade automatiske commits.

### Administration
GitHub Actions findes under repositoryets **Actions**-fane på GitHub.

Her kan man:
- Se tidligere kørsler og deres status.
- Kontrollere eventuelle fejl.
- Se hvilke filer der er blevet opdateret.
- Starte workflows manuelt, hvis denne funktion er aktiveret.

---

## 📝 Redigering af Indhold

- **Menupunkter og sidebar:** Navigationen vedligeholdes ét centralt sted i `sidebar.html`, som automatisk indlæses på alle undersider via `/assets/js/load-sidebar.js`.
- **Dokumenter:** Nyhedsbreve (`Nyhedsbrev.docx`), vedtægter (`Vedtægter.pdf`), husorden (`Husorden.pdf`) og parkeringsventeliste (`Venteliste Parkering.xlsx`) kan udskiftes direkte i projektmappen eller opdateres via den automatiske OneDrive-synkronisering, hvor det er konfigureret.
- **Områdekort:** Nye og eksisterende lokationer vedligeholdes i `assets/data/ejerforeningen-omraadekort.geojson`.

---

---

## 🗂️ Mappestruktur og lokal dokumentation

De vigtigste mapper har deres egen `README.md`, så formål, indhold og vedligeholdelse kan findes dér, hvor arbejdet foregår. Root-README'en giver det samlede overblik; de lokale README-filer beskriver den enkelte mappe.

| Mappe | Formål |
|---|---|
| `.github/` | GitHub Actions, automatisering og NemAffald-delprojektet. |
| `assets/` | CSS, JavaScript, kortdata, Sass, video og webfonts. |
| `chatbot/` | Chatbotkonfiguration og genereret vidensdatabase. |
| `scripts/` | Scripts til dataopdatering og chatbot. |
| `images/` | Billedressourcer. |
| `velkomstbrev/`, `kontakt/`, `parkering/`, `kaelderrum/`, `noeglebrikker/`, `nyhed/`, `husorden-vedtaegter/` | Hjemmesidens indholdssider. |
| `eksempler/` | Design- og komponentreferencer. |

Undermapper med selvstændigt indhold har også lokale README-filer. De beskriver mappernes faktiske funktion og relevante vedligeholdelsespunkter. README-filerne er dokumentation og ikke officielle regler for foreningen.


*Sidst opdateret: 2026-11-10*


---

## 🤖 Chatbot – automatisk vidensdatabase

Repositoryet indeholder en gratis, statisk informationsassistent til hjemmesiden. Chatbotten søger i en automatisk genereret `chatbot/data/knowledge.json` og viser relevante tekstuddrag med links til kilderne. Første version bruger **ikke** en generativ AI-model eller eksterne API'er.

### Automatisk opdatering
- Workflow: `.github/workflows/update-chatbot-knowledge.yml`.
- Generator: `scripts/chatbot/build-knowledge.py`.
- Kildekonfiguration: `chatbot/config/knowledge-config.json`.
- Genereret vidensfil: `chatbot/data/knowledge.json` (må ikke redigeres manuelt).
- Chatfunktion: `assets/js/chatbot.js` og `assets/css/chatbot.css`.
- Chatten indlæses centralt via `assets/js/load-sidebar.js` og vises på hjemmesidens sider.

Workflowet kører ved relevante ændringer, ugentligt og manuelt via GitHub Actions. Kun filer, der står på den eksplicitte `include`-liste i `knowledge-config.json`, bliver indekseret. Parkeringsventelisten, NemAffald-mappen, interne scripts, konfigurationer og øvrige ikke-godkendte filer holdes udenfor.

### Vedligeholdelse
Se `chatbot/README.md` for lokal test, tilføjelse af kilder, sikkerhedsregler og kendte begrænsninger. Scannede PDF'er uden tekstlag kræver OCR, før deres indhold kan indekseres.
