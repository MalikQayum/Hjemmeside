# Sass - stylesheets i kildeform

Sass-kilderne er opdelt i `base/`, `layout/`, `components/` og `libs/`. De beskriver designets grundelementer og moduler. Den kompilerede CSS ligger i `../css/`.

## Sådan vedligeholdes Sass

1. Redigér den relevante fil i `base/`, `components/` eller `layout/`; fælles variabler og hjælpefunktioner ligger i `libs/`.
2. `main.scss` er indgangspunktet for det fælles stylesheet. Kompilér den til `../css/main.css` med Sass, hvis den kompilerede fil skal opdateres:

   ```bash
   sass assets/sass/main.scss assets/css/main.css
   ```

   Kør kommandoen fra repository-roden, hvor Sass CLI er installeret.
3. Sammenlign ændringen i den kompilerede CSS, og kontrollér mindst én desktop- og én mobilvisning af de berørte sider.

Hjemmesiden indlæser CSS direkte, så en Sass-ændring uden opdateret `assets/css/main.css` bliver ikke vist. Sideafgrænset CSS, som ikke importeres af `main.scss`, skal vedligeholdes i sin egen CSS-fil; se `../css/README.md`.

[Tilbage til repositoryoversigten](../../README.md)
