# Chatbot - genererede data

`knowledge.json` er chatbotens genererede vidensdatabase. Den bygges ud fra kilderne i `../config/knowledge-config.json` af `../../scripts/chatbot/build-knowledge.py`.

**Redigér ikke filen manuelt.** Ret i stedet kildedokumentet eller kildekonfigurationen, og kør derefter GitHub Actions-workflowet for at generere filen igen. Vidensfilen offentliggøres sammen med hjemmesiden.

- `knowledge.json`: automatisk genereret, officiel vidensbase fra kilderne i `knowledge-config.json`.
- `learning-results.json`: seneste resultat fra den automatiske spørgsmålstræning, herunder godkendte og afviste testspørgsmål.
- Midlertidige AI-genererede kandidater oprettes under workflow-kørslen og bruges ikke som officiel viden.
