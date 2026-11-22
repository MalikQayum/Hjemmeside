# GitHub Actions Scripts - Automatiseret filsynkronisering

Denne mappe indeholder hjælpescripts, der afvikles af foreningens GitHub Actions-workflows under `.github/workflows/`.

---

## Filer i mappen

| Script | Type | Tilknyttet workflow | Formål |
|---|---|---|---|
| `sync-onedrive-to-github.mjs` | Node.js (ES-modul) | `sync-onedrive-to-github.yml` | Logger sikkert på foreningens fælles Microsoft OneDrive, lokaliserer de nyeste godkendte dokumenter og downloader dem til de relevante mapper i repositoryet. |

---

## Detaljeret gennemgang af `sync-onedrive-to-github.mjs`

### 1. Konfiguration af filer (`FILES`)
Øverst i scriptet findes konfigurationstabellen `FILES`, som styrer hvilke mapper på OneDrive der overvåges, og hvor de downloadede filer skal placeres lokalt:

```javascript
const FILES = [
  {
    folder: 'Nyhedsbreve',
    target: 'public/nyhed/Nyhedsbrev.docx',
    latestByDate: true,
    extension: '.docx'
  }
];
```

- **`folder`:** Mappenavnet i bestyrelsens delte OneDrive-lager.
- **`target`:** Den lokale sti i repositoryet, hvor den synkroniserede fil skal gemmes.
- **`latestByDate`:** Når denne er sat til `true`, scanner scriptet mappen for filer, sorterer dem kronologisk efter oprettelses- eller ændringsdato og vælger automatisk den nyeste udgave.
- **`extension`:** Filtrerer filer efter format (fx `.docx` eller `.pdf`).

### 2. Autentificering og sikkerhed
- Scriptet forventer to miljøvariabler for at kunne logge ind:
  - `ONEDRIVE_EMAIL`: Bestyrelsens officielle Microsoft-konto e-mailadresse.
  - `ONEDRIVE_PASSWORD`: Adgangskoden til kontoen.
- Disse variabler injiceres under kørslen af GitHub Actions via repository secrets. Værdierne maskeres automatisk i konsoloutputtet, så adgangskoder aldrig fremgår af logfilerne.

### 3. Fejlhåndtering og stabilitet
- **Ingen overskrivning ved fejl:** Hvis forbindelsen til Microsoft fejler, eller der opstår netværksudfald under download, afbryder scriptet kontrolleret med en fejlmeddelelse uden at berøre den eksisterende fil på hjemmesiden. Dette garanterer, at den eksisterende `Nyhedsbrev.docx` forbliver intakt.
- **Tidsudløb og sessionsstyring:** Scriptet har indbygget timeout for sidetilgang og understøtter Microsofts standard login-flow for virksomheds- og privatkonti.

---

## Manuel test af synkroniseringsscriptet

Hvis scriptet skal testes lokalt på en udviklercomputer:

```bash
export ONEDRIVE_EMAIL="bestyrelsen@skyttegaardvej.dk"
export ONEDRIVE_PASSWORD="din-sikre-adgangskode"
node .github/scripts/sync-onedrive-to-github.mjs
```

Kontroller efterfølgende, at den opdaterede fil er placeret i `public/nyhed/Nyhedsbrev.docx`, og at filen kan åbnes i browseren via `/nyhed/index.html`.

---

[Tilbage til GitHub-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
