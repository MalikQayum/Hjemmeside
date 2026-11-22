# NemAffald - Automatiseret affaldshåndtering og bestillingsmodul

Dette delprojekt håndterer automatiseret bestilling af haveaffald og storskrald via Københavns Kommunes digitale affaldsportal (NemAffald) for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Modulet er placeret i hjemmesidens repository, men fungerer som en fuldstændig uafhængig applikation med egen `package.json`, kildekode, konfiguration og testmiljø.

---

## Projektets formål og baggrund

Københavns Kommune kræver forudgående bestilling for afhentning af haveaffald og visse typer storskrald fra etageejendomme. For at sikre, at foreningens gårdanlæg og storskraldsrum under Skyttegårdvej 5 altid tømmes rettidigt uden manuel ugentlig administration for bestyrelsen, anvendes NemAffald-automatiseringen:

1. Modulet kontrollerer kommunens affaldskalender for ledige tømningsdage.
2. Det validerer ejendommens adresse (Skyttegårdvej 1-11 / Vigerslevvej 144-148).
3. Det opretter en afhentningsordre for de relevante affaldsfraktioner (fx haveaffald i sæsonen).
4. Det fremsender bekræftelse til foreningens affaldsansvarlige via den registrerede kontaktprofil.

---

## Mappestruktur

| Undermappe / Fil | Formål og indhold |
|---|---|
| [`src/`](src/README.md) | **Kildekode for browserautomatisering.** Playwright-moduler til navigering på NemAffald, ordreoprettelse, inspektion af formularer og godkendelse. |
| [`scripts/`](scripts/README.md) | **Hjælpe- og installationsscripts.** Klargøring af GitHub-konfiguration (`prepare-github-config.js`) samt PowerShell-scripts til installation af ugentlige opgaver på Windows (`install-weekly-task.ps1`). |
| [`config/`](config/README.md) | **Konfigurationsskabeloner.** `settings.example.json` og `settings.github.json`. |
| `package.json` | Definition af afhængigheder (Playwright m.fl.) og kørselsskripter (`npm run weekly:test`, `npm run weekly:order`). |
| `NemAffald-Windows-v0.7.4-da.zip` | Distributionspakke til lokal afvikling på Windows-pc eller server via Opgavestyring (Task Scheduler). |
| `NemAffald-GitHub-Actions-v0.8.1-da.zip` | Distributionspakke til kørsel i GitHub Actions-miljøet. |

---

## Sikkerhedsmodel og beskyttelse mod utilsigtede bestillinger

For at forhindre fejlbestillinger hos kommunen arbejder projektet med en streng to-trins sikkerhedsmodel:

1. **Testtilstand (Dry-run / Standard):**
   - Kommandoen `npm run weekly:test` åbner portalen, udfylder felterne, finder næste mulige afhentningsdato og validerer hele ruten - **uden** at klikke på den afsluttende "Bekræft bestilling"-knap.
   - Dette danner en readiness-fil, der bekræfter, at systemet fungerer fejlfrit.
2. **Produktionstilstand (Live submission):**
   - En reel ordre kan **kun** indsendes, hvis den hemmelige repository-variabel `NEMAFFALD_ENABLE_SUBMISSION` er sat eksplicit til `"true"` i GitHub Actions eller i lokal konfiguration.
   - Uden denne variabel vil systemet altid afbryde før indsendelse.

---

## Lokal installation og test

For at afprøve modulet lokalt på en maskine:

```bash
cd public/.github/nemaffald
npm ci
npm run weekly:test
```

Efter kørslen kontrolleres konsolloggen for at bekræfte, at Københavns Kommunes formularfelter blev identificeret korrekt, og at næste afhentningsdato blev fundet.

---

[Tilbage til GitHub-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../README.md)
