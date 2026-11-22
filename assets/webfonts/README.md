# Webfonts - Ikoner og typografiske skrifttyper

Denne mappe indeholder de kompilerede webfont-filer, der leverer ikongrafik til **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**. Ikonerne stammer fra Font Awesome-biblioteket og indgår i hjemmesidens stylesheets.

---

## Filoversigt og skrifttype-familier

Mappen indeholder tre primære ikon-familier opdelt i fem forskellige webformater:

| Skrifttype-familie | Vægt / Stil | Inkluderede filformater | Anvendelse på hjemmesiden |
|---|---|---|---|
| **Font Awesome Solid** | 900 (Solid / Fyldt) | `fa-solid-900.woff2`<br>`fa-solid-900.woff`<br>`fa-solid-900.ttf`<br>`fa-solid-900.eot`<br>`fa-solid-900.svg` | Primære funktionsikoner: telefon, e-mail, nøgler, bil, cykel, skrald, advarsler, PDF/Word-dokumenter, navigationstoggler (hamburgermenu) og pil-indikatorer. |
| **Font Awesome Regular** | 400 (Regular / Kontur) | `fa-regular-400.woff2`<br>`fa-regular-400.woff`<br>`fa-regular-400.ttf`<br>`fa-regular-400.eot`<br>`fa-regular-400.svg` | Sekundære konturikoner, infobokse, kalenderikoner og dokumentstatuser. |
| **Font Awesome Brands** | 400 (Brands / Varemærker) | `fa-brands-400.woff2`<br>`fa-brands-400.woff`<br>`fa-brands-400.ttf`<br>`fa-brands-400.eot`<br>`fa-brands-400.svg` | Tredjeparts- og platformikoner, herunder GitHub (`fa-github`), Microsoft Word/Office og andre digitale integrationer. |

---

## Formater og browserprioritering

Webfontene deklareres i `assets/css/main.css` (og via Sass i `assets/sass/components/_icon.scss`) med `@font-face`-regler:

1. **WOFF2 (`.woff2`):**
   - Den mest moderne og komprimerede standard (Brotli-komprimering). Indlæses først af alle moderne browsere for minimal indlæsningstid og båndbredde.
2. **WOFF (`.woff`):**
   - Standard webfont-format til browsere uden WOFF2-understøttelse.
3. **TTF (`.ttf`):**
   - Rå TrueType-vektorfont til ældre enheder.
4. **EOT (`.eot`):**
   - Embedded OpenType til bagudkompatibilitet med ældre udgaver af Microsoft Internet Explorer.
5. **SVG (`.svg`):**
   - Vektor-glyph fallback til ældre mobile browsere (fx ældre iOS Safari).

---

## Retningslinjer for opdatering og ændring

1. **Konsistens i versioner:**
   - Hvert ikonsæt (`solid`, `regular`, `brands`) er tæt knyttet sammen via unicodenumre (f.eks. `\f095` for telefon). Hvis der tilføjes eller opgraderes fonte, skal alle fem filformater (`.woff2`, `.woff`, `.ttf`, `.eot`, `.svg`) opdateres fra samme Font Awesome udgivelse.
2. **Relative stier i CSS:**
   - Stylesheets i `assets/css/` refererer til skrifttyperne via den relative sti `../webfonts/[filnavn]`. Mappestrukturen må derfor ikke flyttes eller omdøbes.
3. **Test efter opdatering:**
   - Kontroller altid, at ikoner i sidebaren, kontaktsektionerne, knapperne og oversigterne vises korrekt, og at der ikke opstår manglende tegn (firkantede "tofu"-symboler).

---

[Tilbage til repositoryoversigten](../../README.md)
