# Chatbot Scripts - Bygge-, validerings- og træningspipeline

Denne mappe indeholder de eksekverbare Python- og Node.js-scripts, der driver den vidensbaserede søge- og træningsarkitektur for chatbotten i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Moduloversigt

| Script | Sprog | Funktion og rolle |
|---|---|---|
| `build-knowledge.py` | Python 3 | Parser alle tilladte kilder i `chatbot/config/knowledge-config.json` (inkl. `Husorden.pdf`, `Vedtægter.pdf` §§ 1–33, `Nyhedsbrev.docx` og HTML-sider), udtrækker ren tekst uden HTML- eller UI-støj, beriger afsnit med domænespecifikke søgeord (og valgfri Gemini-tagging via `GEMINI_API_KEY`) og genererer den officielle vidensdatabase `chatbot/data/knowledge.json`. Fjerner automatisk forældede svarregler, hvis kilden er slettet. |
| `validate-knowledge.py` | Python 3 | Udfører skemavalidering og logisk kontrol på `knowledge.json`. Verificerer entydige dokument-ID'er, valide URL-fragmenter, strukturerede vedtægtsparagraffer, minimale tekstlængder og udfører regressionstest på centrale regler (husdyr, nattero, storskrald og parkering). |
| `test-chatbot.js` | Node.js | Kører enhedstest og søgetest direkte mod chatbottens frontend-algoritmer. Testen afvikles uden eksterne npm-afhængigheder ved hjælp af Node.js standardbibliotek (Node 22). |
| `generate-questions.py` | Python 3 | Genererer op til 50 naturlige hverdags- og scenariespørgsmål ud fra de eksisterende kildedokumenter. Anvender Google Gemini API (`gemini-4-hydrogen` med automatisk fallback til `gemini-3.1-flash-lite`), hvis hemmeligheden `GEMINI_API_KEY` er tilgængelig, og falder automatisk tilbage til en regelbaseret lokal Python-generator, hvis API-kaldet udelades eller rammer kvoteloftet. |
| `train-generated-questions.js` | Node.js | Evalueringsmotor for genererede spørgsmål. Tester hvert kandidatspørgsmål mod chatbottens søgemotor. Kun spørgsmål, der med høj sikkerhed matcher kilde-ID (eller samme kategori/sektion) og giver et konsekvent svar under 120 ord, godkendes og tilføjes til `chatbot/config/response-rules.json`. |

---

## Lokal afvikling af byggepipelinen

For at bygge, validere og teste chatbotten lokalt på en maskine:

```bash
# 1. Installer nødvendige Python-afhængigheder til tekstudtrækning
python -m pip install pypdf python-docx

# 2. Generer vidensdatabasen
python scripts/chatbot/build-knowledge.py

# 3. Kør skema- og integritetsvalidering
python scripts/chatbot/validate-knowledge.py

# 4. Kør regressionstest af søgemotoren
node scripts/chatbot/test-chatbot.js
```

---

## Træningsworkflow og sikkerhedsgarantier

1. **Ingen opdigtede fakta:**
   - Hverken Gemini eller den lokale spørgsmålsgenerator må generere svartekster. De genererer udelukkende spørgsmål baseret på overskrifter og afsnit i `knowledge.json`. Svaret hentes altid direkte fra kildedokumentet.
2. **Krav til optagelse i `response-rules.json`:**
   - Søgemotoren skal pege på præcis det tiltænkte dokument (eller samme kategori og paragraf/punkt).
   - Svarlængden må ikke overstige 120 ord.
   - Kilden skal indeholde en gyldig URL med sidetal eller anker.
3. **Logning i `learning-results.json`:**
   - Alle afviste spørgsmål registreres med årsagskode, så bestyrelsen kan gennemgå træningsforløbet.

---

[Tilbage til chatbot-oversigten](../../chatbot/README.md) · [Tilbage til repositoryoversigten](../../README.md)
