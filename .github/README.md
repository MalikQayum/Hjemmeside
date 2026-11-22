# GitHub - Automatisering, CI/CD og driftsmiljø

Denne mappe indeholder konfigurationer, scripts og automatiserede workflows, der sikrer den tekniske drift, dataintegritet og synkronisering for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Indholdet herunder afvikles af GitHub Actions eller lokale driftsværktøjer og er ikke direkte en del af hjemmesidens synlige HTML-præsentation for beboerne.

---

## Mappestruktur

| Undermappe | Formål og indhold | Primære teknologier |
|---|---|---|
| [`workflows/`](workflows/README.md) | **GitHub Actions workflows.** YAML-definitionsfiler, der styrer automatiske kørsler på skemalagte tidspunkter (cron) eller ved hændelser (push, pull request, manual dispatch). | YAML, GitHub Actions runners (Ubuntu). |
| [`scripts/`](scripts/README.md) | **Støttescripts til workflows.** Node.js- og hjælpescripts til fildownload og synkronisering. | Node.js (ES-moduler), Puppeteer/Playwright. |
| [`nemaffald/`](nemaffald/README.md) | **NemAffald-automatiseringsmodul.** Et selvstændigt delprojekt med egen `package.json` og Playwright-scripts til ugentlig bestilling af haveaffald og storskrald via Københavns Kommunes affaldsportal. | Node.js, Playwright, PowerShell. |

---

## Sikkerhedspolitik for hemmeligheder og variabler

Automatiseringerne håndterer eksterne integrationer (OneDrive, Google AI Studio, Københavns Kommune). For at beskytte foreningen og beboerne gælder strenge sikkerhedsprincipper:

1. **Ingen hemmeligheder i kildekoden:**
   - Adgangskoder, tokens, private API-nøgler eller personfølsomme kontaktoplysninger må **aldrig** skrives direkte i scripts, JSON-filer eller YAML-workflows.
2. **Repository Secrets:**
   Følgende hemmeligheder konfigureres i GitHub under **Settings → Secrets and variables → Actions**:
   - `GEMINI_API_KEY`: API-nøgle til Gemini Flash for automatisk generering af beboerspørgsmål under chatbot-træning. Hvis den udelades, falder systemet sikkert tilbage til en lokal generator.
   - `ONEDRIVE_EMAIL` og `ONEDRIVE_PASSWORD`: Tjenesteadgang til foreningens fælles Microsoft OneDrive til download af seneste nyhedsbreve og dokumenter.
   - `NEMAFFALD_CONTACT_JSON`: Sikker JSON-streng med kontaktpersonens navn, telefon og e-mail til brug for kommunens kvitteringer ved affaldsbestillinger.
3. **Repository Variables (Sikkerhedslåse):**
   - `NEMAFFALD_ENABLE_SUBMISSION`: Sikkerhedsafbryder for affaldsbestilling. Er denne variabel ikke eksplicit sat til `"true"`, vil workflowet udelukkende køre i testtilstand (dry-run) uden at indsende bindende bestillinger til kommunen.

---

## Sammenhæng med foreningens GitHub-organisation

Repositoryet er en del af foreningens officielle GitHub-organisation:
- **Organisation:** [github.com/Vigerslev-Skyttegard](https://github.com/Vigerslev-Skyttegard)
- **Data-repository:** `Vigerslev-Skyttegard/bestyrelsen` leverer live-data til parkeringsventelisten (`parkering/data.json`) og generalforsamlingens prisblad (`generalforsamling/prisblad.json`).

---

[Tilbage til repositoryoversigten](../README.md)
