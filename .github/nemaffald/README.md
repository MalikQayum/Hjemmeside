# NemAffald – Automatisk bestilling af haveaffald

Denne README beskriver den fungerende NemAffald-automatisering, både den lokale Windows-opsætning og den hostede GitHub Actions-opsætning. GitHub-versionen blev testet på en hostet GitHub-runner i november 2026, og brugeren har efterfølgende bekræftet, at en live-bestilling blev registreret.

## Hvad bestiller automatiseringen?

Den nuværende konfiguration er specifikt beregnet til:

- **Ejendom:** Vigerslevvej 148
- **Service:** Haveaffald – Tømning af materiel
- **Standplads:** VIGERSLEVVEJ 148
- **Materiel:** 240 l havebeholder
- **Forventet samlet pris:** 0,00 kr.
- **Køreplan:** Fredag kl. 04.00, `Europe/Copenhagen`
- **Ønsket afhentningsdato:** Fredagen efter workflowets kørselsdato

GitHub Actions-workflowet er den tiltænkte produktionsplanlægger. Kør ikke workflowet samtidig med den aktive Windows-opgave i Jobplanlægning.

---

# 1. GitHub Actions – opsætning til automatisk bestilling

## 1.1 Filstruktur i GitHub-repositoryet

I Hjemmeside-repositoryet ligger NemAffald-kildekoden i sin egen mappe. Det sikrer, at den ikke overskriver hjemmesidens egen `README.md`, `package.json`, scripts eller Jekyll-filer.

```text
DitRepository/
└── .github/
    ├── workflows/
    │   └── nemaffald-weekly.yml
    └── nemaffald/
        ├── README.md
        ├── .gitignore
        ├── package.json
        ├── package-lock.json
        ├── config/
        │   ├── settings.github.json
        │   └── settings.example.json
        ├── scripts/
        │   └── prepare-github-config.js
        └── src/
            ├── weekly-order.js
            ├── browser.js
            └── ...
```

**Behold disse mapper og filstier uændret**, medmindre du samtidig retter værdierne for `NEMAFFALD_DIR` og `working-directory` i workflow-filen.

Vigtige filer:

- `.github/workflows/nemaffald-weekly.yml` – GitHubs workflow-indgang og fredagsplanen.
- `.github/nemaffald/package.json` – Node.js-afhængigheder og kommandoer.
- `.github/nemaffald/package-lock.json` – påkrævet, fordi workflowet bruger `npm ci`.
- `.github/nemaffald/config/settings.github.json` – ikke-hemmelige oplysninger om ejendom, bestilling og tidsplan.
- `.github/nemaffald/scripts/prepare-github-config.js` – opretter runtime-konfiguration og den private kontaktfil ud fra repositoryets secret.
- `.github/nemaffald/src/` – Playwright-automatiseringen.

Når NemAffald føjes til et andet repository, skal hele mappen `.github/nemaffald/` kopieres sammen med workflow-filen til det nye repository. Flet filerne ind i det eksisterende `.github`-bibliotek; erstat ikke andre workflows. Overskriv ikke repositoryets `README.md` eller `package.json` i roden.

## 1.2 Den lokale fil `config/contact.json`

NemAffald kan bede om en kontaktprofil for den affaldsansvarlige på siden `/Authentication`. Den lokale opsætningskommando opretter kontaktfilen:

```powershell
npm.cmd run setup-contact
```

Kommandoen beder om fornavn, efternavn, e-mailadresse og mobilnummer. Den beder også om to udtrykkelige bekræftelser:

- Bekræft, at personen reelt er bemyndiget til at være affaldsansvarlig for ejendommen.
- Bekræft, at personen accepterer NemAffalds valg om at huske vedkommende på computeren i seks måneder.

Den lokale fil placeres her:

```text
config/contact.json
```

Filen indeholder disse obligatoriske felter:

```json
{
  "firstName": "DIT_FORNAVN",
  "lastName": "DIT_EFTERNAVN",
  "email": "DIN_EMAILADRESSE",
  "phone": "DIT_MOBILNUMMER",
  "isWasteResponsible": true,
  "rememberMe": true
}
```

Den faktiske fil, som `setup-contact` opretter, indeholder også et `savedAt`-tidsstempel. GitHub-konfigurationsscriptet validerer de obligatoriske felter og kræver, at begge booleske værdier er `true`.

**Commit aldrig `config/contact.json`, indsæt ikke indholdet i en chat, og læg den ikke i et offentligt repository.** Filen indeholder personlige kontaktoplysninger. Brug kun `isWasteResponsible: true`, hvis personen reelt er bemyndiget, og brug kun `rememberMe: true`, hvis personen har givet det nødvendige samtykke. Workflowet skal ikke bruge en NemAffald-adgangskode i denne fil.

## 1.3 Tilføj kontaktfilen som GitHub Secret

I hvert repository, hvor automatiseringen installeres, skal der oprettes et repository-secret:

1. Åbn repositoryets **Settings**.
2. Gå til **Secrets and variables → Actions → Secrets**.
3. Vælg **New repository secret**.
4. Angiv præcis dette navn:

   `NEMAFFALD_CONTACT_JSON`

5. Indsæt **hele indholdet** af din lokale `config/contact.json` som værdien.
6. Gem secret'en.

Alternativt kan du bruge GitHub CLI, hvis du er logget ind med `gh auth login`. Kør denne kommando fra den lokale NemAffald-projektmappe i PowerShell:

```powershell
Get-Content -Raw .\config\contact.json | gh secret set NEMAFFALD_CONTACT_JSON
```

Workflowet sender denne secret til `scripts/prepare-github-config.js`. Scriptet validerer JSON-indholdet og opretter en midlertidig runtime-fil på `.github/nemaffald/config/contact.json` på den hostede runner. Kontaktoplysningerne udskrives ikke i loggen, og kontaktfilen uploades ikke som et artifact.

Et secret er knyttet til ét repository. Når automatiseringen installeres i et andet repository, skal `NEMAFFALD_CONTACT_JSON` også oprettes dér. Secrets overføres ikke automatisk mellem repositories. Se [GitHubs dokumentation om krypterede secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions).

## 1.4 Aktivér rigtige bestillinger med en repository-variabel

Live-bestilling er som udgangspunkt deaktiveret. Den aktiveres kun, når følgende repository-variabel er oprettet.

1. Åbn **Settings → Secrets and variables → Actions → Variables**.
2. Vælg **New repository variable**.
3. Angiv præcis dette navn:

   `NEMAFFALD_ENABLE_SUBMISSION`

4. Angiv præcis denne værdi:

   `true`

5. Gem variablen.

Dette er en **repository-variabel**, ikke et secret. Workflowet læser værdien som `${{ vars.NEMAFFALD_ENABLE_SUBMISSION }}`. Værdien skal være den lille tekst `true`, for at produktionskørsler må fortsætte.

- Manglende variabel, tom værdi eller en anden værdi end `true`: Produktionsbestilling blokeres.
- Værdien `true`: Planlagte kørsler og manuelle kørsler med tilstanden `production` må forsøge at bestille, hvis alle øvrige kontroller også består.
- Hvis GitHubs live-bestilling skal deaktiveres, skal variablen slettes eller ændres til en værdi, der ikke er præcis `true`.

Aktivér ikke variablen, før den manuelle hostede test er bestået, og Windows' produktionsopgave (eller en anden bestillingsplanlægger) er deaktiveret.

## 1.5 Test workflowet på GitHub før produktion

Når kildekode, workflow og secret er tilføjet:

1. Push filerne til repositoryets **standardgren** (normalt `main`).
2. Åbn repositoryets **Actions**-fane.
3. Vælg **NemAffald weekly Haveaffald**.
4. Vælg **Run workflow**.
5. Vælg grenen `main` (eller repositoryets standardgren).
6. Vælg tilstanden `test`, og start workflowet.
7. Kontrollér, at loggen indeholder `TEST MODE SUCCEEDED`.

Testtilstanden starter den headless Playwright-browser, åbner NemAffald, søger efter den konfigurerede ejendom, navigerer til bestillingsformularen, kontrollerer aktive Haveaffald-bestillinger og udfylder datoen for den følgende fredag. Den stopper før `VIDERE`, før en vare lægges i kurven og før den endelige `GODKEND`-handling. **Testtilstanden sender ikke en bestilling.**

Manuelle kørsler starter som standard i `test`-tilstand. Lad live-bestillingsvariablen være fraværende eller deaktiveret under den første opsætning og test.

Hvis kildekoden, `settings.github.json`, `package-lock.json`, `prepare-github-config.js` eller workflowet ændres, skal testtilstanden køres igen før produktion. Readiness-filen er knyttet til et fingeraftryk af automatiseringsfilerne. Produktion afvises, hvis den testede version ikke længere svarer til de aktuelle filer.

## 1.6 Flyt produktionen fra Windows til GitHub

Kun én planlægger må sende bestillinger.

På Windows-computeren skal den eksisterende planlagte opgave deaktiveres, før GitHub-produktion aktiveres:

```powershell
Disable-ScheduledTask -TaskName "NemAffald - Weekly Haveaffald"

Get-ScheduledTask -TaskName "NemAffald - Weekly Haveaffald" |
    Select-Object TaskName, State
```

Tilstanden skal vise `Disabled`.

Sæt derefter GitHub-repository-variablen `NEMAFFALD_ENABLE_SUBMISSION` til `true` som beskrevet ovenfor.

Hvis du vil sende en enkelt live-bestilling med det samme fra GitHub, skal du bruge **Actions → NemAffald weekly Haveaffald → Run workflow → mode `production`**. Det er et forsøg på en rigtig bestilling – ikke en test. Det planlagte workflow kører også i produktion, når variablen har præcis værdien `true`.

Den automatiske tidsplan er:

```yaml
on:
  schedule:
    - cron: "0 4 * * 5"
      timezone: "Europe/Copenhagen"
```

Det betyder hver fredag kl. 04.00 dansk lokaltid og følger skiftet mellem sommer- og vintertid. Workflowet anmoder om afhentning den følgende fredag. GitHub oplyser, at planlagte kørsler kan blive forsinkede ved høj belastning på Actions, især omkring starten af en time. Et præcist minut kan derfor ikke garanteres.

## 1.7 Tilstand og beskyttelse mod dobbeltbestillinger

Workflowet gemmer et artifact med navnet:

`nemaffald-state`

Det indeholder følgende ikke-hemmelige runtime-tilstandsfiler:

- `weekly-state.json` – tilstand for datoer, der er forsøgt bestilt eller bekræftet.
- `weekly-route-ready.json` – seneste vellykkede hostede test og dens fingeraftryk af automatiseringen.
- `github-state-marker.txt` – markørfil, så artifactet også kan oprettes ved den første kørsel.

Artifactet gemmes i 90 dage og gendannes fra den seneste afsluttede workflow-kørsel. I et nyt repository uden et tidligere state-artifact starter workflowet med tom tilstand. Det skal stadig gennemføre en vellykket test, før produktion kan aktiveres.

Slet ikke artifactet `nemaffald-state` eller workflowets kørsler, medmindre du er klar over, at du dermed kan fjerne tilstanden for dubletbeskyttelse og testgodkendelse. Hvis et tidligere state-artifact findes, men ikke kan downloades, stopper workflowet i stedet for at fortsætte uden tilstanden. GitHub-artifacts kan slettes manuelt og kan ikke gendannes efter sletning. Se [GitHubs vejledning til håndtering af workflow-artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts).

Før en produktionsbestilling foretager automatiseringen følgende kontroller:

- læser aktive Haveaffald-bestillinger i NemAffald;
- springer en ønsket dato over, hvis den allerede findes;
- afbryder, hvis datoerne ikke kan fortolkes pålideligt;
- kontrollerer forventet service, standplads, materiel, antal varer i kurven og samlet pris;
- skriver den ønskede dato til tilstanden, før den klikker på den endelige godkendelsesknap;
- kontrollerer portalens bekræftelsestekst `Din henvendelse er nu registreret hos Københavns Kommune.`

Hvis den endelige godkendelse muligvis er sendt, men bekræftelsen ikke kan verificeres, forsøger automatiseringen **ikke** automatisk igen. Kontrollér NemAffald og eventuelle bekræftelsesmails, før samme dato forsøges bestilt igen.

Workflowet bruger en concurrency-gruppe, så to NemAffald-workflowkørsler ikke udføres samtidigt.

## 1.8 Offentligt repository og sikkerhed

- Workflow og kildekode kan ses af alle, der har adgang til et offentligt repository. Læg ikke personoplysninger, adgangskoder, kontakt-JSON, cookies eller browsersessioner i kildefilerne.
- Begræns skriveadgang til repositoryet til betroede bidragydere. En person, der kan ændre workflow-kode, kan muligvis ændre, hvordan et tilgængeligt secret bruges.
- Kontakt-secret'en gøres kun tilgængelig for konfigurationsforberedelsen. Tilføj ikke debug-output, der udskriver miljøvariabler eller den genererede kontaktfil.
- Runtime-filerne `config/contact.json`, `config/settings.json`, `artifacts/` og browserprofiler er private/runtime-data og må ikke committes.
- Behold `package-lock.json` ved siden af `package.json`. Workflowet bruger `npm ci`, som fejler, hvis lockfilen mangler.
- Planlagte workflows skal ligge på repositoryets standardgren. GitHub kan deaktivere planlagte workflows i offentlige repositories efter 60 dage uden aktivitet i repositoryet. Kontrollér derfor Actions-fanen med jævne mellemrum. Planlagte workflows kører kun fra repositoryets standardgren. Se [GitHubs dokumentation om schedule-events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## 1.9 Installér den samme automatisering i et andet repository

Hvis et andet repository skal bruge **samme ejendom, service, materiel og tidsplan**:

1. Kopiér hele mappen `.github/nemaffald/` fra den fungerende opsætning.
2. Kopiér `.github/workflows/nemaffald-weekly.yml` til det nye repositories mappe `.github/workflows/`. Flet den sammen med eksisterende workflow-filer; erstat dem ikke.
3. Behold `package.json` og `package-lock.json` sammen.
4. Commit og push begge stier til det nye repositories standardgren.
5. Opret secret'en `NEMAFFALD_CONTACT_JSON` i det nye repository.
6. Kør workflowet manuelt i `test`-tilstand, og kontrollér `TEST MODE SUCCEEDED`.
7. Deaktivér enhver anden aktiv planlægger for de samme bestillinger.
8. Opret først repository-variablen `NEMAFFALD_ENABLE_SUBMISSION=true`, når du er klar til live-bestillinger.

Den nuværende version er **specifikt konfigureret til Vigerslevvej 148**, Haveaffald – Tømning af materiel, 240 l havebeholder, 0,00 kr. og fredage kl. 04.00 Europe/Copenhagen. Der er ejendomsspecifikke sikkerhedskontroller i kildekoden samt i `config/settings.github.json` og `prepare-github-config.js`. Ved en anden ejendom, service, materieltype, pris eller tidsplan er det ikke nok kun at ændre JSON-filen. De tilsvarende kontroller i kildekoden og workflowets tidsplan skal også opdateres. Gennemfør derefter en ny hostet test, før produktion aktiveres.

---

# 2. Lokal Windows-installation og reserveopsætning

Den oprindelige lokale version kan fortsat bruges som reserve og til skrivebeskyttet kontrol. Den tiltænkte produktionsplanlægger er GitHub Actions. Hold Windows-opgaven deaktiveret, mens GitHub står for produktionen.

## 2.1 Installér og konfigurér lokalt

Kør følgende i den lokale NemAffald-projektmappe:

```powershell
npm.cmd install
npm.cmd run setup-contact
```

`setup-contact` opretter `config/contact.json`. Hold filen privat; den er udelukket via `.gitignore`.

Kontrollér aktive bestillinger uden at indsende noget:

```powershell
npm.cmd run inspect-orders
```

Test ruten uden at indsende en bestilling:

```powershell
npm.cmd run weekly:test
```

Kør kun den lokale produktionsautomatisering, når Windows bevidst bruges som den eneste aktive planlægger:

```powershell
npm.cmd run weekly
```

Brug ikke produktionskommandoen, mens GitHub-produktion er aktiveret.

## 2.2 Windows-opgave i Jobplanlægning som reserve

Den eksisterende Windows-opgave hedder:

`NemAffald - Weekly Haveaffald`

Deaktivér den, når GitHub er produktionsplanlægger:

```powershell
Disable-ScheduledTask -TaskName "NemAffald - Weekly Haveaffald"
```

Hvis du skifter tilbage til Windows, skal du først fjerne/deaktivere GitHubs live-produktion ved at ændre eller slette `NEMAFFALD_ENABLE_SUBMISSION`. Aktivér derefter Windows-opgaven:

```powershell
Enable-ScheduledTask -TaskName "NemAffald - Weekly Haveaffald"
```

Kontrollér udløseren i Windows Jobplanlægning, før du tager den i brug. Den tiltænkte konfiguration er fredag kl. 04.00 lokal tid.

## 2.3 Nyttige lokale kommandoer

```powershell
npm.cmd run inspect-orders   # skrivebeskyttet kontrol af aktive Haveaffald-bestillinger
npm.cmd run setup-contact    # opret/opdatér den lokale config/contact.json
npm.cmd run weekly:test      # test af rute og dato; ingen bestilling sendes
npm.cmd run weekly           # lokal live-bestilling; kun hvis Windows er aktiv planlægger
```

---

# 3. Fejlfinding

| Problem | Sandsynlig årsag / løsning |
|---|---|
| `npm ci` melder, at package-lock.json mangler | Upload `.github/nemaffald/package-lock.json` ved siden af `package.json`. Ret ikke hjemmesidens Node-filer i roden. |
| `Missing repository secret NEMAFFALD_CONTACT_JSON` | Opret repository-secret'en med hele JSON-indholdet fra den lokale `config/contact.json`. |
| Kontakt-JSON er ugyldig eller mangler felter | Kør `npm.cmd run setup-contact` lokalt igen, og opdatér secret'en med indholdet fra den nye fil. |
| Produktion siger, at live-bestilling er deaktiveret | Sæt repository-variablen `NEMAFFALD_ENABLE_SUBMISSION` til præcis `true`. |
| Ingen vellykket test-/readiness-registrering | Kør workflowet manuelt i `test`-tilstand på standardgrenen. |
| Automatiseringens fingeraftryk er ændret efter testen | Kør testtilstanden igen efter den seneste ændring af kildekode, konfiguration eller workflow. |
| Tidligere state-artifact mangler | Ved første kørsel i et nyt repository er tom tilstand forventet. Den næste afsluttede kørsel bør oprette `nemaffald-state`. Hvis et eksisterende artifact burde være der, skal den tidligere kørsel undersøges. Omgå ikke en fejlet gendannelse. |
| Den endelige godkendelse kan være sendt, men portalens bekræftelse mangler | Forsøg ikke igen med det samme. Kontrollér aktive bestillinger i NemAffald og se efter en e-mail først. |

NemAffald-portalen: https://nemaffaldsservice.kk.dk/

## Referencer til GitHub-dokumentation

- [Planlagte workflows, tidszoner og standardgren](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Brug af krypterede secrets i GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [Syntaks for workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [Administration af workflow-artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts)
