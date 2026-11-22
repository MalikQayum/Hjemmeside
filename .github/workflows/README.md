# GitHub Actions Workflows - Automatiserede driftsprocesser

Denne mappe indeholder de officielle GitHub Actions YAML-arbejdsgange (workflows) for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Workflows afvikles i isolerede GitHub-hostede virtuelle miljøer (Ubuntu Latest) og varetager synkronisering af eksterne dokumenter, generering af kortdata, opdatering af chatbottens vidensbase og ugentlig affaldsbestilling.

---

## Oversigt over workflows

| Workflow-fil | Udløser (Triggers) | Krævede Secrets / Variabler | Formål og handling |
|---|---|---|---|
| `update-chatbot-knowledge.yml` | Push til kildedokumenter på `main`, samt manuel start (`workflow_dispatch`). | Ingen (kører 100% lokalt i runner). | Parser kilderne i `chatbot/config/knowledge-config.json`, bygger `data/knowledge.json`, validerer skemaet og kører automatisk regressionstest over standardsvar. |
| `train-chatbot.yml` | Dagligt kl. 06:15 UTC (cron) samt manuel start (`workflow_dispatch`). | `GEMINI_API_KEY` (valgfri, hemmelighed). | Genererer nye varianter af beboerspørgsmål, tester dem automatisk mod svarmotoren og gemmer beståede regler i `chatbot/config/response-rules.json`. |
| `sync-onedrive-to-github.yml` | Dagligt samt manuel start (`workflow_dispatch`). | `ONEDRIVE_EMAIL`<br>`ONEDRIVE_PASSWORD` | Logger sikkert på foreningens Microsoft OneDrive, downloader det nyeste godkendte nyhedsbrev (`Nyhedsbrev.docx`) og placerer det i `public/nyhed/`. |
| `nemaffald-weekly.yml` | Ugentligt på fast ugedag samt manuel start (`workflow_dispatch`). | `NEMAFFALD_CONTACT_JSON`<br>`NEMAFFALD_ENABLE_SUBMISSION` (variabel) | Klargør og afprøver ugentlig bestilling af haveaffald/storskrald. Indsender kun live ordre til kommunen, hvis `NEMAFFALD_ENABLE_SUBMISSION` er sat til `"true"`. |
| `update-geojson.yml` | Månedligt (den 1. i måneden kl. 03:00 UTC) samt manuel start. | Ingen (anvender offentlig Overpass API). | Henter opdaterede steder (skoler, togstationer, butikker) fra OpenStreetMap inden for 1,5 km radius, fletter dem med manuelle punkter og opdaterer `assets/data/ejerforeningen-omraadekort.geojson`. |

---

## Detaljeret gennemgang af de enkelte workflows

### 1. `update-chatbot-knowledge.yml`
- **Stifiltrering:** Aktiveres kun, hvis der er ændringer i de kildedokumenter, der indgår i vidensbasen (fx `affald-storskrald/**`, `generalforsamling/**`, `husorden-vedtaegter/**`, `kontakt/**`, `parkering/**` osv.).
- **Trin:**
  1. Opsætter Python 3.11.
  2. Kører `python scripts/chatbot/build-knowledge.py`.
  3. Kører `python scripts/chatbot/validate-knowledge.py`.
  4. Opsætter Node.js og kører `node scripts/chatbot/test-chatbot.js`.
  5. Hvis testen er bestået, oprettes et automatisk commit med den opdaterede `knowledge.json`.

### 2. `train-chatbot.yml`
- **Spørgsmålsgenerering:** Hvis `GEMINI_API_KEY` er konfigureret, anmodes Gemini Flash om op til 50 nye naturlige formuleringer baseret på eksisterende kildeafsnit. Hvis nøglen mangler eller kvoten overskrides, anvendes den lokale Python-baserede variantgenerator uden afbrydelse.
- **Validering:** Hvert spørgsmål evalueres af `train-generated-questions.js`. Kun spørgsmål, hvor chatbottens søgemotor finder det korrekte dokument med kort og præcist svar (under 45 ord), optages i `response-rules.json`.

### 3. `sync-onedrive-to-github.yml`
- **Sikkerhed:** Adgangskoder opbevares i GitHub Secrets.
- **Handling:** Udfører scriptet `.github/scripts/sync-onedrive-to-github.mjs`. Scriptet finder den senest oprettede fil i bestyrelsens delte OneDrive-mappe med præfikset "Nyhedsbrev" og overfører den til webstedets nyhedsside.

### 4. `nemaffald-weekly.yml`
- **To-trins sikkerhedskontrol:**
  - **Trin 1 (Test / Dry-run):** Kører `npm run weekly:test` i mappen `.github/nemaffald/`. Tester adgang til NemAffald-portalen og opretter bestillingskladde uden afsendelse.
  - **Trin 2 (Submission):** Kun hvis variablen `NEMAFFALD_ENABLE_SUBMISSION` har værdien `"true"`, gennemføres den endelige bekræftelse hos kommunen.

### 5. `update-geojson.yml`
- **Formål:** Sikrer, at lokale ændringer i Valbys byrum (nye busruter, ændrede butikker) automatisk reflekteres på forsiden af hjemmesiden uden manuel indgriben.
- Kører `python scripts/update-geojson.py` og committer ændringer direkte til `main`.

---

## Manuel afvikling og fejlfinding

Alle fem workflows har `workflow_dispatch` aktiveret. De kan startes manuelt af bestyrelsen eller udviklere:
1. Gå til repositoryet på GitHub og vælg fanebladet **Actions**.
2. Vælg det ønskede workflow i venstre menu.
3. Klik på **Run workflow** og vælg grenen `main`.
4. Undersøg log outputtet for eventuelle fejl. Hvis et workflow fejler, efterlades kildekoden uændret, og ingen fejlbehæftede filer publiceres.

---

[Tilbage til GitHub-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
