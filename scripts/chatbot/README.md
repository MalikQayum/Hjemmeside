# Chatbot - bygge- og valideringsscripts

- `build-knowledge.py`: læser de godkendte kilder fra `chatbot/config/knowledge-config.json`, udtrækker tekst, opdeler den i afsnit og skriver `chatbot/data/knowledge.json`. Formularfelter og knapper ignoreres i HTML. Parkeringssiden opdeles i særskilte afsnit om overblik, venteliste og uretmæssig parkering. Understøtter HTML, Markdown, PDF og DOCX. Scannede PDF'er kan OCR-behandles, når Poppler og Tesseract er installeret.
- `validate-knowledge.py`: kontrollerer JSON-struktur, unikke ID'er, indhold og kilde-URL'er samt regressionstjek af husdyr, nattero og parkeringssiden.
- `test-chatbot.js`: tester de vigtigste søgninger og svar i frontend med Node.js standardbibliotek; kræver ingen npm-pakker.

## Lokal kørsel
Kør fra repository'ets rod:

```bash
python -m pip install pypdf python-docx
python scripts/chatbot/build-knowledge.py
python scripts/chatbot/validate-knowledge.py
node scripts/chatbot/test-chatbot.js
```

GitHub Actions-workflowet installerer desuden OCR-værktøjer. Ret ikke `knowledge.json` manuelt; generér den på ny.


## Automatisk spørgsmålstræning

- `generate-questions.py`: bruger Google Gemini API via `GEMINI_API_KEY` til at generere op til 50 nye danske spørgsmål ud fra `chatbot/data/knowledge.json`. Standardmodel: `gemini-2.5-flash-lite`.
- Hvis nøglen mangler, eller Gemini fejler/rammer en kvotegrænse, bruges en lokal Python-generator uden API-kald.
- `train-generated-questions.js`: tester hvert spørgsmål med chatbotens faktiske JavaScript-søgemotor og svarformatering. Kun spørgsmål, der finder det angivne kildeafsnit og giver et svar på højst 45 ord, tilføjes til `chatbot/config/response-rules.json`.
- `.github/workflows/train-chatbot.yml`: kører dagligt eller manuelt og gemmer resultatet i `chatbot/data/learning-results.json`.

Gemini Developer API har en begrænset gratis kvote for udvalgte modeller; Google kan ændre tilgængelighed og grænser. Scriptet bruger ikke betalingsfunktioner og falder tilbage til lokal generering ved API-fejl. API-nøglen skal kun ligge som GitHub Actions secret `GEMINI_API_KEY`.
