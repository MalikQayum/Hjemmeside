# Hjemmeside – Ejerforeningen Skyttegård/Vigerslev

Dette repository indeholder ejerforeningens offentlige hjemmeside. Siden er
bygget som statisk HTML, CSS og JavaScript og hostes på GitHub Pages.

## Sider og adresser

- `/` – Forside
- `/velkomstbrev/` – Velkomstbrev til nye ejere
- `/husorden-og-vedtaegter/` – Husorden og vedtægter
- `/nyheder/` – Nyheder og nyhedsbreve
- `/parkering/` – Parkeringsinformation og venteliste

De tidligere `.html`-adresser bevares som viderestillinger til de nye adresser.

## Filer og redigering

- `index.html` – Forside
- `sidebar.html` – Fælles navigation og kontaktoplysninger
- `assets/css/main.css` – Aktivt stylesheet
- `assets/js/` – Navigation, skabelonfunktioner og nødvendige biblioteker
- `assets/sass/` – Sass-kildefiler fra Editorial-skabelonen
- `images/` – Billeder
- PDF-, Word- og Excel-dokumenter ligger i repositoryets rodmappe.

Redigér indholdet i den relevante side under dens mappe. Navigation og
kontaktoplysninger vedligeholdes ét sted i `sidebar.html`.

## Dokumentvisning

- PDF-dokumenter vises med PDF.js og indlæses sidevis gradvist.
- Word-dokumentet vises med docx-preview.
- Parkeringsventelisten læses fra Excel-filen og vises som en tilgængelig HTML-tabel.
- Hvis en ekstern visningskomponent ikke kan indlæses, vises et direkte downloadlink.

## Kør lokalt

Start en statisk webserver fra repositoryets rodmappe:

```sh
python3 -m http.server 5000
```

Åbn derefter `http://localhost:5000/`. Åbn ikke HTML-filerne direkte med
`file://`, da fælles navigation og dokumenter indlæses via HTTP.

## Hosting

Webstedet er konfigureret til GitHub Pages med custom domain:

https://skyttegaardvej.dk/

`CNAME`-filen skal fortsat indeholde `skyttegaardvej.dk`.

## OneDrive-synkronisering

De eksisterende GitHub Actions-workflows og scripts under `.github/` er
bevaret. De synkroniserer dokumenter fra OneDrive til repositoryets rodmappe.
Workflows kræver fortsat repository secrets `ONEDRIVE_EMAIL` og
`ONEDRIVE_PASSWORD`.

## Vedligeholdelse

- Test ændringer lokalt via en webserver før push.
- Bevar dokumentfilernes navne, medmindre både synkroniseringsscripts og
  visningssider opdateres.
- Opdatér `sitemap.xml`, hvis der tilføjes eller fjernes offentlige sider.
