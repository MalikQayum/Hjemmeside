# GitHub Actions-scripts

Scripts i denne mappe kaldes af workflows under `.github/workflows/`.

## Filer
- `sync-onedrive-to-github.mjs`: logger ind på OneDrive og henter de konfigurerede dokumenter. Workflowet `.github/workflows/sync-onedrive-to-github.yml` kører scriptet dagligt og kan også startes manuelt.

## Vedligeholdelse
Filer, mapper, filnavne og destinationsstier konfigureres i `FILES` øverst i scriptet. Tilføj en fil med dens OneDrive-mappe og destination, eller brug `latestByDate` for at vælge den nyeste daterede fil med et bestemt præfiks og filformat. Efter en konfigurationsændring skal destinationsfilen og den side, der viser den, kontrolleres.

Workflowet bruger GitHub Secrets `ONEDRIVE_EMAIL` og `ONEDRIVE_PASSWORD`; adgangsoplysninger må aldrig skrives i scriptet eller logges. Test ændringer via workflowets manuelle kørsel på GitHub, og kontrollér jobloggen samt de opdaterede filer, før ændringen regnes som færdig.

[Tilbage til repositoryoversigten](../../README.md)
