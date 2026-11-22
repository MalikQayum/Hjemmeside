# Husorden og vedtægter (`/husorden-vedtaegter/`)

Denne mappe indeholder `index.html`, den centrale side til interaktiv visning af foreningens gældende husorden og vedtægter for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens dokumenter og visning

Siden præsenterer foreningens to vigtigste juridiske og adfærdsmæssige regelsæt:

1. **Husorden (`#husorden-pdf`):**
   - Viser `Husorden.pdf` (placeret i repository-roden).
   - Indeholder gældende regler om nattero, støjende adfærd, husdyrhold, have- og gårdanlæg, vaskerier, trappeopgange og affaldshåndtering.
   - De enkelte nummererede punkter i husordenen udgør også et af de primære kildegrundlag for foreningens chatbot.
2. **Vedtægter (`#vedtaegter-pdf`):**
   - Viser `Vedtægter.pdf` (placeret i repository-roden).
   - Ejerforeningens tinglyste vedtægter, som fastlægger foreningens formål, medlemsforhold, fordelingstal, generalforsamling, bestyrelsesbeføjelser, budget, regnskab og revisionsforhold samt regler for udlejning (§ 30).

---

## Teknisk implementering (PDF.js)

I stedet for at tvinge beboeren til at downloade PDF-filerne eller være afhængig af browserens indbyggede PDF-plugin, renderes dokumenterne direkte på siden:
- **Bibliotek:** [PDF.js](https://mozilla.github.io/pdf.js/) v3.11 indlæses via CDN i `index.html`.
- **Renderer:** `assets/js/pdf-viewer.js` parser PDF-filerne og tegner hver side sekventielt på et responsivt `<canvas class="pdf-page">`-element.
- **Styling:** `assets/css/pdf-viewer.css` sikrer, at dokumentsiderne skalerer smukt på både desktop, tablets og mobile smartphones med blød skyggevirkning og centrering.

---

## Retningslinjer for opdatering af dokumenter

1. **Placering og filnavne:**
   - De officielle filer skal hedde nøjagtig `Husorden.pdf` og `Vedtægter.pdf` og ligge i roden af mappen `public/`.
   - Hvis en fil omdøbes, skal referencerne i `assets/js/pdf-viewer.js` og i `chatbot/config/knowledge-config.json` opdateres tilsvarende.
2. **Autoritative kilder:**
   - Ændringer i husordenen eller vedtægterne kan kun ske ved gyldig vedtagelse på en generalforsamling.
   - Hjemmesidetekster eller README-filer må aldrig afvige fra de officielt vedtagne ordlyde i disse PDF-filer.
3. **Chatbot-synkronisering:**
   - Når `Husorden.pdf` eller `Vedtægter.pdf` opdateres, skal chatbottens vidensdatabase genopbygges via GitHub Actions-workflowet `update-chatbot-knowledge.yml` (eller lokalt via `scripts/chatbot/build-knowledge.py`), så chatbotten citerer de seneste regler og korrekte sidetal.

---

## Tilhørende filer

- `index.html`: Sidens HTML-struktur og PDF-beholdere.
- `../assets/js/pdf-viewer.js`: Asynkron indlæsning og sidevisning med PDF.js.
- `../assets/css/pdf-viewer.css`: Styling for PDF-container og canvas-elementer.
- `../Husorden.pdf`: Den autoritative husorden.
- `../Vedtægter.pdf`: De autoritative vedtægter.

[Tilbage til repositoryoversigten](../README.md)

