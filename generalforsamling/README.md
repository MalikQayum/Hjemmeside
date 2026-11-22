# Generalforsamling (`/generalforsamling/`)

Denne mappe indeholder `index.html`, den offentlige portal for generalforsamlinger, referater, årsregnskaber, driftsbudget og gældende gebyrsatser i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Generalforsamlingen er ejerforeningens højeste myndighed og afholdes ordinært hvert år i foråret jf. vedtægterne.

---

## Sidens struktur og sektioner

Siden har hurtig navigation i toppen (`.gf-nav`) med direkte ankre til de 5 sektioner:

### 1. Indkaldelser (`#indkaldelse`)
- Viser den senest udsendte dagsorden og indkaldelse til ordinær eller ekstraordinær generalforsamling.
- Oplyser dato, klokkeslæt, sted samt formelle krav til afstemning, fuldmagter og frister for indlevering af forslag.
- Indeholder direkte åbne- og download-knapper til den officielle PDF-indkaldelse.

### 2. Referater (`#referat`)
- Primært referat for seneste afholdte generalforsamling med godkendte beslutninger, bestyrelsessammensætning og vedtagne forslag.
- **Historisk arkiv (`<details class="archive-details">`):** Sammenfoldelig oversigt over samtlige tidligere referater fra ordinære og ekstraordinære generalforsamlinger.
- Filplacering: `dokumenter/generalforsamling/referater/` med standardiseret navneformat `YYYY-gf-referat.pdf` eller `YYYY-xgf-referat.pdf`.

### 3. Årsregnskab (`#regnskab`)
- Gennemgang af foreningens reviderede årsregnskab udarbejdet i samarbejde med DEAS A/S.
- Nøgletal, driftsomkostninger, henlæggelser til vedligeholdelsesfond og balance.
- **Historisk regnskabsarkiv:** Sammenfoldelig liste over godkendte årsregnskaber helt tilbage til 1996.
- Filplacering: `dokumenter/generalforsamling/regnskab/` med standardiseret format `YYYY-regnskab.pdf` eller `YYYY-YYYY-regnskab.pdf`.
- Direkte link til regnskabsspørgsmål hos DEAS (`/kontakt/#deas`).

### 4. Budget (`#budget`)
- Bestyrelsens driftsbudget for det kommende regnskabsår som godkendt på generalforsamlingen.
- Danner grundlag for fastsættelsen af de månedlige fællesbidrag for de 69 ejerlejligheder fordelt efter tinglyste fordelingstal.
- Beskriver hvad budgettet dækker (administration, ejendomsservice, forsikring, forsyning, teknisk drift m.v.).

### 5. Gældende prisblad (`#prisblad`)
- **Dynamisk tabel:** Alle gældende gebyrer og takster indlæses i tabellen `#price-table-body` via `assets/js/general-price-list.js`.
- **Datakilde:** Data hentes fra det centrale repository `Vigerslev-Skyttegard/bestyrelsen/prisblad/data.json`.
- Viser ydelse, beskrivelse, aktuel pris og dato for seneste opdatering af prisbladet.
- Dækker bl.a. nøglebrikker, parkeringspladser, kælderrum, rykkergebyrer, affaldsbod og selvrisiko.

---

## Retningslinjer for tilføjelse af nye dokumenter

1. **Filplacering:**
   - Referater placeres i `dokumenter/generalforsamling/referater/`.
   - Regnskaber placeres i `dokumenter/generalforsamling/regnskab/`.
2. **Standardiseret filnavn:**
   - Referat: `2026-gf-referat.pdf` (eller `2026-xgf-referat.pdf` ved ekstraordinær).
   - Regnskab: `2025-regnskab.pdf`.
3. **HTML-opdatering:**
   - Opdatér det fremhævede dokument i toppen af sektionen.
   - Flyt det forrige års dokument ned i den respektive arkivliste (`<ul class="doc-list">` inde i `<details class="archive-details">`).
   - Sørg for at begge knapper (både Åbn og Download) peger på den korrekte filsti.
4. **Chatbot-indeksering:**
   - Når nye referater eller regnskaber tilføjes, registreres de i `chatbot/config/knowledge-config.json` hvis de skal kunne søges af chatbotten.

---

## Tilhørende filer

- `index.html`: Sidens HTML-indhold og dokumentlister.
- `../assets/js/general-price-list.js`: Henter og genererer pristabellen dynamisk.
- `../dokumenter/generalforsamling/`: Dokumentmappe for referater og regnskaber.

[Dokumentarkiv: generalforsamling](../dokumenter/generalforsamling/README.md) · [Tilbage til repositoryoversigten](../README.md)

