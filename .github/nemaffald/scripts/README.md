# NemAffald Scripts - Drifts- og installationsværktøjer

Denne mappe indeholder hjælpeværktøjer, Node.js-scripts og PowerShell-automatiseringsscripts til opsætning og daglig afvikling af NemAffald-modulet for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Filer i mappen

| Script | Type | Miljø | Beskrivelse og formål |
|---|---|---|---|
| `prepare-github-config.js` | Node.js | GitHub Actions | Læser repository secrets, validerer kontaktdata og danner de nødvendige runtime-konfigurationsfiler (`settings.json` og `contact.json`) forud for bestilling. |
| `install-weekly-task.ps1` | PowerShell | Windows PC / Server | Installerer og aktiverer en ugentlig automatiseret opgave i Windows Opgavestyring (Task Scheduler) til lokal drift. |
| `remove-weekly-task.ps1` | PowerShell | Windows PC / Server | Afregistrerer og sletter den automatiserede opgave i Windows Opgavestyring uden at berøre projektfilerne. |

---

## Detaljeret gennemgang af scripts

### 1. `prepare-github-config.js`
- **Udførelse:** Kaldes som det første trin i GitHub Actions-workflowet `.github/workflows/nemaffald-weekly.yml`.
- **Valideringsrutine:**
  - Undersøger om miljøvariablen `NEMAFFALD_CONTACT_JSON` er til stede.
  - Parser JSON-strukturen og verificerer, at de obligatoriske felter (`fullName`, `phoneNumber`, `emailAddress`) er udfyldt med gyldige formater.
  - Sammenholder adressen i `settings.github.json` med foreningens godkendte adresser i Valby.
  - Skriver de midlertidige filer `settings.json` og `contact.json` i rodmappen for `.github/nemaffald/`.
- **Sikkerhed:** Scriptet logger udelukkende statusmeddelelser (fx "Kontaktprofil valideret") og udskriver aldrig selve telefonnumrene eller e-mailadresserne til GitHub Actions loggen.

### 2. `install-weekly-task.ps1`
- **Forudsætning:**
  Før scriptet kan afvikles, skal `npm ci` og en succesfuld testkørsel være gennemført:
  ```powershell
  cd .github/nemaffald
  npm ci
  npm run weekly:test
  ```
  Testkørslen opretter en tidsstemplet readiness-fil. Hvis readiness-filen mangler, eller hvis den seneste test fejlede, vil PowerShell-scriptet afbryde installationen for at forhindre fejlbehæftede automatiske kørsler.
- **Kørsel i PowerShell (som administrator):**
  ```powershell
  .\scripts\install-weekly-task.ps1
  ```
  Dette opretter en planlagt opgave i Windows Task Scheduler med navnet `NemAffald Weekly Order`, der kører en gang ugentligt i baggrunden.

### 3. `remove-weekly-task.ps1`
- **Formål:** Hvis foreningen skifter til ren GitHub Actions-afvikling eller ønsker at suspendere de lokale automatiske kørsler, slettes den planlagte opgave nemt med:
  ```powershell
  .\scripts\remove-weekly-task.ps1
  ```
  Scriptet stopper eventuelt kørende instanser og fjerner opgavens registrering fra Windows.

---

[Tilbage til NemAffald-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../../README.md)
