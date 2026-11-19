# GitHub Actions-scripts

Scripts i denne mappe kaldes af workflows under `.github/workflows/`.

## Filer
- `sync-onedrive-to-github.mjs`: logger ind på OneDrive og henter de konfigurerede dokumenter. Workflowet `.github/workflows/sync-onedrive-to-github.yml` kører scriptet dagligt og kan også startes manuelt.

## Vedligeholdelse
Kontrollér workflowets forventede GitHub Secrets, filtyper og destinationsstier, før scriptet ændres. Adgangsoplysninger må kun ligge i GitHub Secrets. Test ændringer via workflowets manuelle kørsel.

[Tilbage til repositoryoversigten](../../README.md)
