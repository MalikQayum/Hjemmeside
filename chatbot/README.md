# Chatbot - vidensbaseret informationsassistent

Chatbotten kombinerer en hurtig kildebaseret søgemotor med valgfri server-side Gemini-integration (`/api/chatbot/query`) og fuld lokal browser-fallback på statisk hosting (GitHub Pages). To GitHub Actions-workflows opbygger henholdsvis vidensdatabasen (med struktureret paragraf-parsing og semantisk berigelse) og træner nye hverdags- og scenariespørgsmål.

## Struktur
- `config/config.json`: central til/fra-indstilling for chatbotten på hjemmesiden.
- `config/knowledge-config.json`: styring af hvilke kilder der må indgå.
- `config/response-rules.json`: automatisk godkendte spørgsmål, der peger på kildeafsnit.
- `data/`: genereret vidensdatabase.
- `../assets/js/chatbot.js` og `../assets/css/chatbot.css`: brugergrænseflade og styling.
- `../scripts/chatbot/`: generator og validering.
- `../.github/workflows/update-chatbot-knowledge.yml`: bygger og validerer vidensdatabasen.
- `../.github/workflows/train-chatbot.yml`: foreslår og tester spørgsmål.

Læs denne README og undermappernes README før ændringer. Chatbotten må gengive kilder, men må ikke selv fortolke, ændre eller opfinde foreningens regler. Ved uklare eller modstridende kilder skal den tydeligt gøre opmærksom på usikkerheden og henvise til bestyrelsen.


## Slå chatbotten til eller fra

Chatbottens synlige "Spørg os"-knap styres af `config/config.json`:

```json
{
  "enabled": true
}
```

- `true`: Chatbotten indlæses, og "Spørg os" vises på hjemmesidens sider.
- `false`: Chatbotten indlæses ikke, og knappen vises ikke.

Ret kun værdien til `true` eller `false`, og publicér ændringen på GitHub. Indstillingen hentes ved hver sideindlæsning uden almindelig browsercache, så det er ikke nødvendigt at ændre HTML eller JavaScript. Hvis filen midlertidigt ikke kan hentes, indlæses chatbotten som standard aktiv, så en netværksfejl ikke utilsigtet skjuler funktionen.

## Sådan finder chatbotten svar

- Vidensdatabasen bygges fra kilderne i `config/knowledge-config.json`.
- Husordenens nummererede punkter gemmes hver for sig med punktnummer og PDF-side, så svar kan linke til det relevante sted i dokumentet.
- Frontenden bruger danske synonymer og emnegenkendelse til at finde relevante afsnit. Kendte emner som husdyr, fodring, støj/nattero og parkering prioriterer det relevante kildeafsnit.
- Ved første åbning vises emner og forslag til typiske spørgsmål. Forslagene er genveje; et valgt emne begrænser ikke den efterfølgende søgning.
- De generelle spørgsmål om chatbotten har korte, prædefinerede svar i `PREDEFINED_ANSWERS` i `assets/js/chatbot.js`. Spørgsmål om foreningens forhold bruger fortsat den almindelige kildebaserede søgning.
- Emnenavne og forslag vedligeholdes i `TOPICS` i `assets/js/chatbot.js`. Tilføj kun spørgsmål, som kan besvares ud fra de inkluderede kilder.
- Chatbotten viser et kort, kildebaseret svar og den mest relevante kilde. PDF-links åbner på den registrerede side.
- Synonymer og emnegenkendelse er kun søgehjælp. De giver ikke chatbotten ret til at udlede nye regler. Selve ordlyden kommer fra kilden.
- Hvis der ikke findes et tilstrækkeligt relevant afsnit, svarer chatbotten, at den ikke kan finde et sikkert svar, og henviser til bestyrelsen.
- Regressionstest af de vigtigste spørgsmål kan køres fra repository-roden med `node scripts/chatbot/test-chatbot.js`.

## Vigtigt ved ændringer

Når husordenen eller andre kilder ændres, skal vidensdatabasen bygges igen via workflowet. Kontroller altid, at hvert svar linker til det rigtige dokument og punkt. Chatbotten må aldrig ændre de officielle dokumenter eller selv godkende foreslåede regelændringer.


## Automatisk spørgsmålstræning

Workflowet `.github/workflows/train-chatbot.yml` genererer dagligt nye naturlige danske hverdags- og scenariespørgsmål ud fra `data/knowledge.json`. Det kan også startes manuelt under **Actions → Træn chatbot med nye spørgsmål → Run workflow**. Workflowet bruger `gemini-4-hydrogen` (med automatisk fallback til `gemini-3.1-flash-lite`) og falder tilbage til en lokal Python-generator, hvis Gemini ikke kan bruges. Opbygningen af viden i `.github/workflows/update-chatbot-knowledge.yml` kan ligeledes berige nye afsnit med hverdags-søgeord via Gemini og kører automatisk både `validate-knowledge.py` og `test-chatbot.js`.

### Gemini-opsætning

1. Opret en API-nøgle i [Google AI Studio](https://aistudio.google.com/apikey).
2. Tilføj den i repositoryets **Settings → Secrets and variables → Actions** med navnet `GEMINI_API_KEY`.
3. Kør workflowet manuelt første gang.

Gemini Developer API har kvoter og hastighedsbegrænsninger, som Google kan ændre. Der er ingen garanti for ubegrænset eller gratis adgang.

API-nøglen bruges kun af GitHub Actions og må aldrig placeres i JavaScript, HTML eller `config.json`.

### Hvis Gemini ikke er tilgængelig

Hvis `GEMINI_API_KEY` mangler, eller Gemini returnerer en fejl/kvotegrænse, falder scriptet automatisk tilbage til en lokal Python-generator uden API-kald. Den lokale generator laver spørgsmålsvarianter ud fra eksisterende kildeoverskrifter. Disse spørgsmål skal stadig bestå den samme JavaScript-test, før de godkendes.

### Sådan bliver spørgsmål godkendt

- Gemini må kun generere spørgsmål ud fra de eksisterende kildeafsnit og skal angive det præcise `document_id`.
- `train-generated-questions.js` tester hvert spørgsmål mod chatbotens faktiske søge- og svarfunktion.
- Spørgsmålet godkendes kun, hvis søgemotoren finder det angivne kildeafsnit (eller samme kategori/sektion) som bedste resultat, kilden har indhold og URL, og svaret er højst 120 ord.
- Godkendte spørgsmål gemmes i `config/response-rules.json`. Reglen peger kun på et eksisterende kildeafsnit; den indeholder ikke nye foreningsregler eller selvstændige fakta.
- Chatbotten indlæser reglerne og bruger dem til at finde det rigtige kildeafsnit ved præcis samme spørgsmål.
- Afviste spørgsmål gemmes i `data/learning-results.json`.
- Nye spørgsmål bliver ikke automatisk til officielle svar. Det er stadig `knowledge.json` og hjemmesidens kilder, der bestemmer indholdet.

Workflowet kører dagligt kl. 06:15 UTC og kan startes manuelt. Det ændrer aldrig husorden, vedtægter eller andre officielle kilder.

[Tilbage til repositoryoversigten](../README.md)
