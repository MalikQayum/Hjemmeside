# Nyheder og nyhedsbrev (`/nyhed/`)

Denne mappe indeholder `index.html`, siden for aktuelle meddelelser og direkte visning af bestyrelsens nyhedsbreve i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens funktioner og visning

Bestyrelsen udsender løbende nyhedsbreve til foreningens beboere med orientering om drift, planlagte projekter, havearbejdsdage og praktisk information.

For at gøre det så nemt som muligt for beboerne, vises det seneste nyhedsbrev direkte på siden:
- **Dokument:** Viser `Nyhedsbrev.docx` (placeret i repository-roden).
- **Beholder:** Dokumentet indlæses asynkront i `#docx-container`.

---

## Teknisk implementering (DOCX Preview)

Dokumentet konverteres og gengives udelukkende klientside i browseren uden eksterne servere eller cloud-services:
1. **Biblioteker:**
   - **JSZip** (`cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`): Udpakker `.docx`-arkivet (som i virkeligheden er en zip-komprimeret XML-struktur).
   - **docx-preview** (`unpkg.com/docx-preview@0.3.6/dist/docx-preview.js`): Fortolker formatering, overskrifter, tabeller, lister og typografi direkte til HTML/CSS.
2. **Viewer-script:** `assets/js/docx-viewer.js` initierer hentningen og opretter visningen i browseren.
3. **Styling:** `assets/css/docx-viewer.css` leverer en elegant hvid dokumentside med diskret skygge på lys baggrund, optimeret til både mobil og desktop.
4. **Fejlhåndtering & noscript:** Hvis en browser har JavaScript slået fra, vises en oplysende `<noscript>`-advarsel. Fejler filhentningen, vises en overskuelig fejlmeddelelse (`.docx-error`).

---

## Procedure for opdatering af nyhedsbrev

1. **Manuel udskiftning:**
   - Gem det nye nyhedsbrev i Word-format med det præcise navn `Nyhedsbrev.docx` i repository-roden (eller i mappen `public/`).
   - Når ændringen pushes til GitHub, vises det nye nyhedsbrev automatisk på `/nyhed/`.
2. **Automatisk OneDrive-synkronisering:**
   - Hvis workflowet `sync-onedrive-to-github.yml` er aktiveret med de nødvendige GitHub Secrets, kan bestyrelsen gemme nyhedsbrevet i sin delte OneDrive-mappe, hvorefter GitHub Actions automatisk downloader filen og opretter et commit.
3. **Chatbot-indeksering:**
   - Nyhedssiden og `Nyhedsbrev.docx` er medtaget i `chatbot/config/knowledge-config.json`, så chatbotten kan svare på spørgsmål vedrørende nyligt udmeldte projekter og datoer.

---

## Tilhørende filer

- `index.html`: Sidens HTML-indhold og container.
- `../assets/js/docx-viewer.js`: Klientside-hentning og dokumentgengivelse.
- `../assets/css/docx-viewer.css`: Styling for det indlejrede nyhedsbrev.
- `../Nyhedsbrev.docx`: Kildenyhedsbrevet i roden.

[Tilbage til repositoryoversigten](../README.md)

