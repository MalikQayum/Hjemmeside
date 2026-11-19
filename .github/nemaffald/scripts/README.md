# NemAffald - hjælpe- og installationsscripts

PowerShell- og JavaScript-hjælpeværktøjer til opsætning og vedligeholdelse af NemAffald.

- `prepare-github-config.js`: klargør GitHub-konfigurationen.
- `install-weekly-task.ps1`: installerer den ugentlige opgave i Windows.
- `remove-weekly-task.ps1`: fjerner den installerede ugentlige opgave.

## Vedligeholdelse og brug

Efter `npm ci` skal `npm run weekly:test` gennemføres med succes, før den lokale planlagte opgave installeres. Testen opretter en readiness-fil, som installationsscriptet kræver. Kør fra `.github/nemaffald/` i PowerShell:

```powershell
.\scripts\install-weekly-task.ps1
```

Fjern opgaven med:

```powershell
.\scripts\remove-weekly-task.ps1
```

`prepare-github-config.js` køres af GitHub Actions før en bestilling og bruger secret `NEMAFFALD_CONTACT_JSON`. Skriv aldrig kontaktoplysninger i scripts eller versionsstyrede konfigurationsfiler. Livebestilling er slået fra som standard og kræver eksplicit opt-in med repository-variablen `NEMAFFALD_ENABLE_SUBMISSION=true`. Se projektets README og workflowdokumentationen før større ændringer.

[Tilbage til repositoryoversigten](../../../README.md)
