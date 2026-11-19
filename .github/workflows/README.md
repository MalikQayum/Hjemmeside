# GitHub Actions-workflows

Her ligger YAML-filerne, der bestemmer, hvornår automatiseringerne kører, og hvilke scripts de bruger.

## Workflows
- `update-chatbot-knowledge.yml`: bygger og validerer chatbotens vidensdatabase.
- `train-chatbot.yml`: genererer dagligt op til 50 spørgsmål, tester dem mod chatbotens søge- og svarmotor og gemmer beståede spørgsmål. Gemini kræver repository-secret `GEMINI_API_KEY`; uden nøglen bruges den lokale generator.
- `sync-onedrive-to-github.yml`: henter dokumenter fra OneDrive dagligt eller ved manuel start. Kræver `ONEDRIVE_EMAIL` og `ONEDRIVE_PASSWORD`.
- `nemaffald-weekly.yml`: ugentlig bestilling af haveaffald. Manuel test indsender ikke en bestilling; livebestilling kræver særskilt opt-in via repository-variablen `NEMAFFALD_ENABLE_SUBMISSION`.
- `update-geojson.yml`: opdaterer områdekortets GeoJSON månedligt eller ved manuel start.

## Vedligeholdelse
Kontrollér udløser, tilladelser, samtidighed, secrets/variabler og kaldte scripts, før et workflow ændres. Start workflows manuelt fra repositoryets **Actions**-fane, når de understøtter manuel kørsel.

[Tilbage til repositoryoversigten](../../README.md)
