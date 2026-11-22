# Scripts - Vedligeholdelse og automatisering (`/scripts/`)

Denne mappe indeholder hjælpescripts i Python og JavaScript til databehandling, vedligeholdelse af kortdata og opdatering af foreningens vidensdatabase.

---

## Oversigt over scripts

### 1. `update-geojson.py` - Områdekortets datagrundlag
- **Formål:** Opdaterer og beriger GeoJSON-dataene for områdekortet på forsiden.
- **Funktion:**
  - Læser de manuelt registrerede steder i `assets/data/ejerforeningen-omraadekort-manual.geojson`.
  - Forespørger OpenStreetMap (Overpass API) efter relevante offentlige faciliteter (skoler, togstationer, busstoppesteder, supermarkeder m.v.) inden for 1,5 km fra ejerforeningen.
  - Filtrerer nærliggende dubletter og samler alt i `assets/data/ejerforeningen-omraadekort.geojson`.
- **Kørsel:**
  ```bash
  python scripts/update-geojson.py
  ```
- **Automatisering:** Workflowet `.github/workflows/update-geojson.yml` kører månedligt på GitHub Actions.

### 2. `chatbot/` - Chatbot-værktøjer og validering
Undermappen indeholder værktøjer til styring af chatbottens vidensbase og svarregler:
- **`build-knowledge.py`:** Ekstraherer tekst fra godkendte HTML-sider, Markdown-, PDF- og Word-dokumenter angivet i `chatbot/config/knowledge-config.json` og danner `chatbot/data/knowledge.json`.
- **`validate-knowledge.py`:** Sikrer dataintegritet, gyldige URL'er og regressionstjekker centrale emner (husdyr, nattero, parkering).
- **`test-chatbot.js`:** Klientside-test af søgemotoren i Node.js uden eksterne afhængigheder.
- **`generate-questions.py` & `train-generated-questions.js`:** Automatisk spørgsmålstræning via Gemini API eller lokal generator.

---

## Retningslinjer for kørsel

1. **Arbejdskatalog:** Kør altid scripts fra repositoryets rodmappe, så relative stier (`assets/`, `chatbot/`) opløses korrekt.
2. **Afhængigheder:**
   - GeoJSON-scriptet kræver standard Python 3 med `urllib`/`json`.
   - Chatbot-byggeren kræver `pypdf` og `python-docx` (samt Poppler og Tesseract ved OCR af scannede filer).
3. **Ingen direkte redigering af genererede filer:** Redigér ikke `knowledge.json` eller `ejerforeningen-omraadekort.geojson` direkte; kør det respektive generatorscript for at bevare sporbarhed og kildedata.

[Chatbot-scripts: detaljeret vejledning](chatbot/README.md) · [Tilbage til repositoryoversigten](../README.md)

