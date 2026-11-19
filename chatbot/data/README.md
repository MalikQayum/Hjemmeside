# Chatbot - genererede data

`knowledge.json` er chatbotens genererede vidensdatabase. Den bygges ud fra kilderne i `../config/knowledge-config.json` af `../../scripts/chatbot/build-knowledge.py`.

**Redigér ikke filen manuelt.** Ret i stedet kildedokumentet eller kildekonfigurationen, og kør derefter GitHub Actions-workflowet for at generere filen igen. Vidensfilen offentliggøres sammen med hjemmesiden.

- `knowledge.json`: automatisk genereret, officiel vidensbase fra kilderne i `knowledge-config.json`.
- `learning-results.json`: seneste resultat fra den automatiske spørgsmålstræning, herunder godkendte og afviste testspørgsmål.
- Midlertidige AI-genererede kandidater oprettes under workflow-kørslen og bruges ikke som officiel viden.

Ved lokal vedligeholdelse køres generatoren fra repository-roden med `python scripts/chatbot/build-knowledge.py`, efterfulgt af `python scripts/chatbot/validate-knowledge.py` og `node scripts/chatbot/test-chatbot.js`. Kontrollér workflowets ændringer og testresultater, før den genererede database publiceres.

[Tilbage til repositoryoversigten](../../README.md)
