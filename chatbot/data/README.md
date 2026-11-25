# Chatbot Data - Vidensbase og træningsresultater

Denne mappe indeholder den kompilerede vidensdatabase samt resultater fra den automatiske spørgsmålstræning for chatbotten i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Filerne i denne mappe genereres automatisk af scripts og GitHub Actions-workflows og publiceres direkte som en del af det statiske websted på GitHub Pages.

---

## Filer i mappen

| Fil | Type | Funktion og indhold |
|---|---|---|
| `knowledge.json` | JSON (Genereret database) | **Chatbottens primære vidensbase.** Indeholder indekserede tekstafsnit fra foreningens godkendte websider og husorden. Hvert afsnit har et unikt ID, titel, URL, sidetal (for PDF-kilder), sektionsnummer og forbehandlet tekst til søgning. |
| `learning-results.json` | JSON (Evalueringsrapport) | **Resultat af automatisk træning.** Gemmer status over seneste testkørsel fra `train-chatbot.yml`, herunder liste over godkendte spørgsmål og afviste spørgsmål med begrundelse (fx for langt svar eller usikker kildematching). |

---

## Struktur af `knowledge.json`

Vidensbasen er struktureret således, at den browserbaserede søgemaskine i `assets/js/chatbot.js` lynhurtigt kan foretage vægtet scoring (BM25/TF-IDF) uden serverkald:

```json
{
  "version": "1.0",
  "generated_at": "2026-11-22T06:15:00Z",
  "documents": [
    {
      "id": "husorden-pkt-4",
      "title": "Husorden - Husdyr",
      "category": "husorden",
      "url": "husorden-vedtaegter/Husorden.pdf#page=2",
      "section_number": "4",
      "text": "Det er tilladt at holde én hund eller én indekat pr. lejlighed...",
      "keywords": ["hund", "kat", "husdyr", "kæledyr"]
    }
  ]
}
```

---

## Bygge- og valideringspipeline

Vidensbasen må **aldrig** redigeres manuelt. Den opdateres altid gennem følgende stringente pipeline:

1. **Tekstudtrækning (`build-knowledge.py`):**
   - Læser kilderne specificeret i `chatbot/config/knowledge-config.json`.
   - Parser HTML, PDF (`Husorden.pdf`, `Vedtægter.pdf` §§ 1–33) og DOCX (`Nyhedsbrev.docx`), beriger med domænespecifikke søgeord (samt valgfri Gemini-tagging i Actions) og danner `chatbot/data/knowledge.json`.
   - Kommando:
     ```bash
     python scripts/chatbot/build-knowledge.py
     ```

2. **Skemavalidering (`validate-knowledge.py`):**
   - Kontrollerer, at alle afsnit har gyldige URL-referencer, at ingen ID'er er dublerede, og at teksterne opfylder kvalitetskriterierne.
   - Kommando:
     ```bash
     python scripts/chatbot/validate-knowledge.py
     ```

3. **Regressionstest (`test-chatbot.js`):**
   - Kører et omfattende sæt af faste beboerspørgsmål (fx om nattero, storskrald, parkering og husdyr) mod søgemotoren for at verificere, at svarpræcisionen er bevaret.
   - Kommando:
     ```bash
     node scripts/chatbot/test-chatbot.js
     ```

---

## Sikkerhed og integritet

- Vidensbasen er 100% statisk og offentlig. Der må aldrig forekomme fortrolige oplysninger, personnumre eller bestyrelsesinterne notater i kildedokumenterne.
- Chatbotten opfinder aldrig fakta. Hvis en besøgende stiller et spørgsmål, som ikke kan besvares med høj statistisk sikkerhed ud fra `knowledge.json`, vil chatbotten altid svare ærligt, at informationen ikke findes i det officielle materiale, og henvise til bestyrelsen eller administrator.

---

[Tilbage til chatbot-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
