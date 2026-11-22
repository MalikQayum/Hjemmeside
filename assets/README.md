# Assets - Statiske ressourcer og frontend-aktiver

Denne mappe indeholder alle de statiske klient-ressourcer, som hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148** indlæser i browseren: stylesheets, JavaScript-moduler, geografiske data til områdekortet, Sass-kilder, videooptagelser og webfonts.

Alle filer i denne mappe leveres som statiske filer og caches af browseren. Derfor gælder det som en fast regel, at eksisterende filstier og filnavne skal bevares, da HTML-siderne på hele sitet refererer direkte til dem via relative eller absolutte stier.

---

## Mappestruktur

| Undermappe | Formål og indhold | Primære kildedokumenter |
|---|---|---|
| [`css/`](css/README.md) | Færdige, kompilerede stylesheets til browseren. | `main.css`, `kontakt.css`, `contact-form.css`, `parking-overview.css`, `kaelderrum-live.css`, `home.css`, `chatbot.css`, `bestyrelsen.css`, `pdf-viewer.css`, `docx-viewer.css`. |
| [`js/`](js/README.md) | Browserbaserede JavaScript-moduler til dynamisk funktionalitet. | `load-sidebar.js`, `public-price-bindings.js`, `general-price-list.js`, `parking-overview.js`, `kaelderrum-live.js`, `contact-form.js`, `parking-contact-form.js`, `home-map.js`, `pdf-viewer.js`, `docx-viewer.js`, `chatbot.js`, `bestyrelsen.js`. |
| [`data/`](data/README.md) | Geografiske datasæt til forsiden og eksterne GIS-værktøjer. | `ejerforeningen-omraadekort.geojson`, `ejerforeningen-omraadekort-manual.geojson`, `ejerforeningen-omraadekort.kml`, `preview-map.svg`. |
| [`sass/`](sass/README.md) | Kildekode til stylesheets opdelt efter 7-1 mønstret. | `base/`, `components/`, `layout/`, `libs/` samt hovedfilen `main.scss`. |
| [`video/`](video/README.md) | Web-optimerede videofiler af ejendommen og omgivelserne. | `ejerforeningen-3d.mp4`, `skyttegaardvej.mp4`, `vigerslevvej.mp4`. |
| [`webfonts/`](webfonts/README.md) | Ikonfonte og typografiske skrifttyper. | Font Awesome (brands, regular, solid) i formaterne `.woff2`, `.woff`, `.ttf`, `.eot` og `.svg`. |

---

## Retningslinjer for vedligeholdelse

1. **Stier og caching:**
   - HTML-siderne refererer direkte til filerne under `/assets/`. Ændr aldrig filnavne uden samtidig at opdatere alle HTML-filer, stylesheets og scripts i repositoryet.
   - Ved opdatering af CSS eller JS kan der tilføjes versionsparametre (fx `main.css?v=2`) i HTML-filerne for at tvinge genindlæsning hos brugere med ældre cachede versioner.

2. **Kompileret CSS vs. modulær CSS:**
   - Det globale fundament genereres fra `sass/main.scss` til `css/main.css`.
   - Sidespecifik funktionsstyling (fx `kontakt.css`, `parking-overview.css`, `kaelderrum-live.css`) vedligeholdes direkte i de dedikerede CSS-filer for at undgå unødvendigt store filer på undersider.

3. **Performance og komprimering:**
   - Videoer og billeder skal være komprimerede og optimerede til hurtig webvisning.
   - Webfonts skal altid tilbyde WOFF2 som førsteprioritet for minimal båndbredde.

---

[Tilbage til repositoryoversigten](../README.md)
