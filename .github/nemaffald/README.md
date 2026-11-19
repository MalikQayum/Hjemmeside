# NemAffald - GitHub-projekt

Denne mappe indeholder NemAffald-automatiseringen, som er placeret i hjemmeside-repository'et, men fungerer som et selvstændigt delprojekt. Den har sin egen `package.json`, kildekode, konfiguration og dokumentation.

## Struktur
- `src/`: funktionalitet til kontrol, klargøring og håndtering af bestillinger.
- `scripts/`: hjælpe- og installationsscripts.
- `config/`: eksempel- og GitHub-konfiguration.
- `package.json`: kommandoer og Playwright-afhængighed.

## Lokal opsætning
Kør kommandoerne fra denne mappe:

```bash
npm ci
npm run weekly:test
```

`weekly:test` kontrollerer bestillingsforløbet uden at indsende en ordre. Den planlagte GitHub Actions-kørsel må først indsende en rigtig bestilling, når den eksplicitte repository-variabel `NEMAFFALD_ENABLE_SUBMISSION` er sat til `true`. Se `.github/workflows/nemaffald-weekly.yml` for workflowets test- og produktionsbetingelser.

## Vigtigt
Behandl `settings.github.json` og øvrige lokale indstillinger som potentielt følsomme. Tokens, adgangskoder og andre hemmeligheder må ikke committes. ZIP-filerne er distributions-/versionsarkiver og ikke kildekode, der skal redigeres direkte.

[Tilbage til repositoryoversigten](../../README.md)
