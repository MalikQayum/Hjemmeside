# Hjemmeside - Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148

Velkommen til det officielle kildekode-repository for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148** (Skyttegårdvej 1-11 og Vigerslevvej 144-148 i Valby, 69 ejerlejligheder).

Hjemmesiden fungerer som den primære informationsportal og selvbetjeningsplatform for nuværende ejere, beboere, tilflyttere og bestyrelsen.

---

## Domæne & Hosting
- **Aktivt domæne:** [www.skyttegaardvej.dk](https://www.skyttegaardvej.dk)
- **GitHub Pages:** Integreret med automatisk CNAME-opsætning (`skyttegaardvej.dk`).
- **Primære filial:** `main`
- **Tilknyttet organisation:** [GitHub - Vigerslev-Skyttegard](https://github.com/Vigerslev-Skyttegard)

---

## Sider og Funktioner

### 1. Forside (`/`)
- **Sti:** `index.html`
- **Funktion:** Velkomst, introduktion til foreningens 69 lejligheder, hverdagen i ejendommen og 3D-luftvisning af ejendommen (`ejerforeningen-3d.mp4`).
- **Områdekort:** Interaktivt kort (Leaflet + OpenStreetMap) med faciliteter inden for en radius på 1,5 km (skoler, togstationer, buslinjer, indkøb og offentlige parkeringszoner).

### 2. Affald og storskrald (`/affald-storskrald/`)
- **Sti:** `affald-storskrald/index.html`
- **Funktion:** Placering af skralderum (Vigerslevvej 148 samt Skyttegårdvej 5-7), miljøskab til farligt affald og storskraldsrum ved Skyttegårdvej 5.
- **Regler:** Retningslinjer for affaldshåndtering, gebyr for ureglementeret henstilling af affald samt oplysninger om rengøring og trappevask varetaget af Hebsoe Rengøring.
- **Multimedie:** Billedguide over storskraldsrum samt to videoer med adgangsforhold.

### 3. Husorden og vedtægter (`/husorden-vedtaegter/`)
- **Sti:** `husorden-vedtaegter/index.html`
- **Funktion:** Interaktiv dokumentvisning med **PDF.js** til nem læsning af foreningens gældende vedtægter (`Vedtægter.pdf`) og husorden (`Husorden.pdf`) direkte i browseren på både computer og mobil.

### 4. Generalforsamling (`/generalforsamling/`)
- **Sti:** `generalforsamling/index.html`
- **Funktion:** Ejerforeningens øverste myndighed.
- **Indhold:**
  - Seneste ordinære og ekstraordinære generalforsamlinger (indkaldelser og referater).
  - Årsregnskaber og revisionspåtegning udarbejdet i samarbejde med DEAS.
  - Samlet driftsbudget for det kommende regnskabsår.
  - Historisk dokumentarkiv med referater og regnskaber tilbage til 1996.
  - Gældende prisblad med dynamisk indlæsning af gebyrer og takster via `assets/js/general-price-list.js`.

### 5. Nyheder (`/nyhed/`)
- **Sti:** `nyhed/index.html`
- **Funktion:** Seneste nyhedsbreve fra bestyrelsen.
- **Teknologi:** Viser foreningens nyhedsbrev direkte fra Microsoft Word-format (`Nyhedsbrev.docx`) i browseren via `docx-preview` og `JSZip`.

### 6. Parkering (`/parkering/`)
- **Sti:** `parkering/index.html`
- **Struktur:**
  - **Cykelparkering:** Information om gratis cykelkælder og udendørs cykelstativer.
  - **Priser:** Dynamiske satser for bil og motorcykel/scooter hentet automatisk via prisbladet.
  - **Uretmæssig parkering:** Retningslinjer og direkte opkaldslink til DinParkering døgnvagt.
  - **Kontaktformular:** Tilmelding til venteliste eller andre parkeringshenvendelser til bestyrelsen.
  - **Venteliste:** Live-visning af den officielle venteliste til parkeringspladser indlæst dynamisk fra data-repositoryet `Vigerslev-Skyttegard/bestyrelsen/parkering/data.json` via `assets/js/parking-overview.js`.

### 7. Leje af kælderrum (`/kaelderrum/`)
- **Sti:** `kaelderrum/index.html`
- **Funktion:** Information om foreningens 11 ekstra kælderrum, lejevilkår og opkrævning via DEAS.
- **Dynamisk oversigt:** Live-tabel over alle 11 lokaler med faste arealer (fra 3 m² til 27 m²), lejestatus og automatisk beregnet månedlig leje baseret på prisbladets kvadratmetersats (`assets/js/kaelderrum-live.js`).
- **Formular:** Integreret kontaktformular til opskrivning på venteliste eller opsigelse.

### 8. Nøglekort og nøglebrikker (`/noegler/`)
- **Sti:** `noegler/index.html`
- **Funktion:** Det elektroniske adgangssystem til opgange og fællesarealer.
- **Pris og bestilling:** Dynamisk stykpris for nøglebrikker og nøglekort via prisbladet, automatisk beregning af samlet pris samt lovpligtigt postkassesamtykke.
- **Håndtering:** Hurtig spærring af mistede nøglebrikker eller ombytning af defekte brikker.

### 9. Udlejning (`/udlejning/`)
- **Sti:** `udlejning/index.html`
- **Regler:** Procedure for udlejning af ejerlejligheder, forbud mod erhverv/hoteldrift samt begrænsninger for korttidsudlejning (Airbnb) jf. vedtægternes § 30 (maksimalt 4 udlejninger og højst 30 dage sammenlagt pr. kalenderår med obligatorisk skriftlig varsling til bestyrelsen).
- **Blanket:** Download af foreningens officielle udlejningsblanket i både PDF og Word (.docx) samt e-mail link til bestyrelsen.

### 10. Vedligeholdelse (`/vedligeholdelse/`)
- **Sti:** `vedligeholdelse/index.html`
- **Ansvarsfordeling:** Tydelig opdeling mellem ejerens indvendige vedligeholdelsesansvar (vinduer indvendigt, overflader, el, individuelle indvendige rørforgreninger, sanitet) og foreningens fælles ansvar (klimaskærm, fælles lodrette hovedstigstrenge og faldstammer frem til den individuelle forgrening jf. vedtægterne § 7, stk. 2, facader, opgange, dørtelefoner).
- **Vandlukning:** Procedure for lukning af vand, krav om koordinering med autoriseret VVS (Finn L. & Davidsen) samt varsling i opgangen min. 3-5 dage forinden.
- **Forsikring:** Gennemgang af ejendommens bygningsforsikring hos Protector Forsikring (hvor konkret dækning altid afgøres af selskabet ud fra skadens placering, årsag og policens vilkår) over for beboerens private indboforsikring, selvrisiko ved dækket selvforskyldt skade samt direkte links til skadeanmeldelse via DEAS Selvbetjening og Protectors skadesportal.

### 11. Kontakt (`/kontakt/`)
- **Sti:** `kontakt/index.html`
- **Layout:** Responsivt gitter begrænset til maksimalt 3 kort side om side på desktop, 2 på tablet og 1 på mobil.
- **Samarbejdspartnere:**
  - **Bestyrelsen:** Overordnet drift, husorden og parkering (`#bestyrelsen`).
  - **DEAS A/S:** Ejendomsadministration, regnskab og skadeanmeldelse (`#deas`).
  - **Protector Forsikring:** Bygningsforsikring og skadesvejledning (`#protector`).
  - **ISTA Danmark A/S:** Målere, vand- og varmeregnskab (`#ista`).
  - **HOFOR:** Fjernvarme og vandforsyning (`#hofor`).
  - **Finn L. & Davidsen A/S:** VVS, el, døgnvagt og autoriseret håndværkerservice (`#fld`).
  - **Andelsvaskeriforeningen FIVA:** Selvstændig andelsvaskeriforening i kælderen på Skyttegårdvej 9 (`#fiva`).
  - **Hebsoe Rengøring:** Trappevask og renholdelse af fællesarealer (`#hebsoe`).
  - **DinParkering:** Parkeringskontrol og uretmæssig parkering (`#dinparkering`).
- **Digitale platforme (`#platforme`):**
  - **PHM Digital:** Ejendomsportal til dokumenter, meddelelser og opkrævninger (`#phm-digital`).
  - **DEAS Onlineadgang:** Dokumenter, forbrug og opkrævninger (`#deas-onlineadgang`).
  - **DanDomain:** Samlet kundecenter og webmail for foreningens domæne (`#dandomain`).
  - **GitHub:** Kildekode, organisation og automatisering (`#github`).
  - **Bestyrelsens login:** Nem tilgang til intern administration (`#bestyrelsen-login`).
  - **DinParkering:** Udstedelse og håndtering af digitale parkeringstilladelser (`#dinparkering-login`).
  - **OneDrive:** Fildeling og fælles bestyrelsesdrev (`#onedrive-login`).
  - **TTLock:** Elektronisk adgangskontrol til fælleslåse (`#ttlock-login`).
  - **Tapo:** Kameraovervågning af udvalgte fællesrum (`#tapo-login`).

---

## Interaktivt områdekort

Områdekortet på forsiden viser ejerforeningens placering og relevante faciliteter i nærområdet inden for en radius på 1,5 km.

Kortet er bygget med **Leaflet** og **OpenStreetMap** og anvender GeoJSON som datagrundlag.

### Datafil
- **Sti:** `assets/data/ejerforeningen-omraadekort.geojson`
- Indeholder kortets geografiske punkter (skoler, dagligvarer, busstoppesteder, togstationer og parkeringsmuligheder) samt polygonen for 1,5 km-radius.

### Tilføj eller fjern lokationer
Manuelt oprettede punkter vedligeholdes i:
`assets/data/ejerforeningen-omraadekort-manual.geojson`

Nye steder oprettes som et GeoJSON `Feature`-objekt:
```json
{
  "type": "Feature",
  "properties": {
    "name": "Stedets navn",
    "description": "Beskrivelse af stedet",
    "category": "grocery"
  },
  "geometry": {
    "type": "Point",
    "coordinates": [12.485000, 55.663000]
  }
}
```
*Koordinater skrives som `[længdegrad, breddegrad]` i decimalgrader.*

Scriptet `scripts/update-geojson.py` kombinerer de manuelle punkter med OpenStreetMap-data og danner `assets/data/ejerforeningen-omraadekort.geojson`.

---

## GitHub Actions og Automatisering

Repositoryet anvender **GitHub Actions** til vedligeholdelse og opdatering:

1. **`update-data.yml`:** Sikrer dataintegritet ved ændringer i bestyrelsens datalager.
2. **`update-geojson.yml`:** Månedlig opdatering af OpenStreetMap-faciliteter i nærområdet.
3. **`update-chatbot-knowledge.yml`:** Bygger og validerer chatbottens vidensdatabase ud fra godkendte HTML- og kildedokumenter.
4. **`train-chatbot.yml`:** Træningsworkflow til forbedring af chatbottens svar via godkendte spørgsmålsregler.
5. **`sync-onedrive-to-github.yml`:** Automatisk synkronisering af udvalgte dokumenter (f.eks. nyhedsbrev) fra OneDrive.
6. **`nemaffald-weekly.yml`:** Ugentlig bestilling og kontrol af haveaffald og storskrald via Københavns Kommunes portal.

---

## Chatbot - Vidensbaseret Assistent

Hjemmesiden har en integreret, browserbaseret chatbot til beboerspørgsmål:
- **Konfiguration:** `chatbot/config/config.json` med `"enabled": true` eller `false`.
- **Vidensbase:** `chatbot/data/knowledge.json` genereret fra tilladte sider i `chatbot/config/knowledge-config.json`.
- **Svarregler:** `chatbot/config/response-rules.json` indeholder verificerede spørgsmålsformater, der peger direkte på kildeafsnit.
- **Sikkerhed:** Chatbotten kører 100% lokalt i browseren mod vidensfilen. Den bruger ingen eksterne API-kald under almindelig browsing, og den opfinder aldrig regler ud over hvad der fremgår af kildedokumenterne.

---

## Mappestruktur

| Mappe | Formål |
|---|---|
| `.github/` | GitHub Actions-workflows, hjælpescripts og NemAffald-modul. |
| `assets/` | CSS, JavaScript, GeoJSON-data, Sass-kilder, video og fonte. |
| `chatbot/` | Konfiguration, svarmodeller og indekseret vidensdatabase. |
| `dokumenter/` | PDF- og Word-dokumenter for forening, generalforsamling og udlejning. |
| `images/` | Billedressourcer og grafik (herunder `Storskraldrum.png`). |
| `scripts/` | Python- og Node.js-scripts til GeoJSON og chatbot. |
| `affald-storskrald/` | Siden om affald, miljøskab og storskraldsrum. |
| `generalforsamling/` | Siden for generalforsamling, referater, regnskab og prisblad. |
| `husorden-vedtaegter/` | Siden for husorden og vedtægter med PDF.js. |
| `kaelderrum/` | Siden for leje af kælderrum med live-oversigt. |
| `kontakt/` | Kontaktsiden med samarbejdspartnere og digitale platforme. |
| `noegler/` | Siden for nøglebrikker, nøglekort og postkassesamtykke. |
| `nyhed/` | Nyhedssiden med DOCX-visning af nyhedsbrev. |
| `parkering/` | Parkeringssiden med live venteliste og kontaktformular. |
| `udlejning/` | Siden om udlejningsregler, Airbnb-begrænsninger og blanketter. |
| `vedligeholdelse/` | Siden om indvendig/udvendig vedligeholdelse, vandlukning og forsikring. |

*Sidst opdateret: 2026-11-22*

