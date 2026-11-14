# Chatbot – bygge- og valideringsscripts

- `build-knowledge.py`: læser de godkendte kilder fra `chatbot/config/knowledge-config.json`, udtrækker tekst, opdeler den i afsnit og skriver `chatbot/data/knowledge.json`. Understøtter HTML, Markdown, PDF og DOCX. Scannede PDF'er kan OCR-behandles, når Poppler og Tesseract er installeret.
- `validate-knowledge.py`: kontrollerer JSON-struktur, unikke ID'er, indhold og kilde-URL'er.

## Lokal kørsel
Kør fra repository'ets rod:

```bash
python -m pip install pypdf python-docx
python scripts/chatbot/build-knowledge.py
python scripts/chatbot/validate-knowledge.py
```

GitHub Actions-workflowet installerer desuden OCR-værktøjer. Ret ikke `knowledge.json` manuelt; generér den på ny.
