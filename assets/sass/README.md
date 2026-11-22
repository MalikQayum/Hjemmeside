# Sass - Stylesheets i kildeform og arkitektur

Denne mappe indeholder den modulære Sass-kildekode (Syntactically Awesome Style Sheets) til det overordnede design på hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Kildekoden er struktureret efter et tilpasset 7-1 Sass-mønster med opdeling i fundament, komponenter, layout og hjælpebiblioteker.

---

## Mappestruktur

| Mappe / Fil | Formål | Beskrivelse |
|---|---|---|
| [`main.scss`](main.scss) | **Hovedindgang.** | Importerer alle moduler i den korrekte rækkefølge og danner kildematerialet til `../css/main.css`. |
| [`base/`](base/README.md) | **Grundopsætning.** | CSS-reset, typografi, fontdefinitioner og generelle sideindstillinger (`_reset.scss`, `_typography.scss`, `_page.scss`). |
| [`layout/`](layout/README.md) | **Strukturelle elementer.** | Overordnede layoutblokke som header, sidebar, menu, banner, footer og wrapper (`_header.scss`, `_sidebar.scss`, `_menu.scss`, `_banner.scss`, `_footer.scss`, `_wrapper.scss`, `_main.scss`). |
| [`components/`](components/README.md) | **Genanvendelige UI-komponenter.** | Modulære designelementer som knapper, formularer, tabeller, bokse, ikoner, lister og sektioner (`_button.scss`, `_form.scss`, `_table.scss`, `_box.scss`, `_icon.scss`, m.fl.). |
| [`libs/`](libs/README.md) | **Værktøjer og variabler.** | Globale SCSS-variabler (farver, fonte), matematiske funktioner, responsive breakpoints, HTML-grid og mixins (`_vars.scss`, `_breakpoints.scss`, `_mixins.scss`, `_functions.scss`, `_html-grid.scss`, `_vendor.scss`). |

---

## Forholdet mellem Sass og kompilerede stylesheets

Hjemmesiden er et statisk websted, og browseren indlæser udelukkende færdigkompileret CSS:

1. **Global CSS (`assets/css/main.css`):**
   - Kompileres direkte fra `assets/sass/main.scss`.
   - Hvis der laves ændringer i en `.scss`-fil i `base/`, `layout/`, `components/` eller `libs/`, **skal** `main.scss` kompileres på ny, for at ændringerne træder i kraft i browseren:
     ```bash
     sass assets/sass/main.scss assets/css/main.css
     ```
     eller ved brug af minificering:
     ```bash
     sass assets/sass/main.scss assets/css/main.css --style compressed
     ```

2. **Modulære sidespecifikke stylesheets (`assets/css/*.css`):**
   - Visse sider har dedikerede stylesheets, fx `kontakt.css`, `parking-overview.css`, `kaelderrum-live.css`, `home.css` og `contact-form.css`.
   - Disse filer vedligeholdes direkte som ren CSS i `../css/` og importeres ikke af `main.scss`. Dette valg er truffet for at holde `main.css` let og sikre hurtig indlæsning på undersider uden unødvendig kodebelastning.

---

## Responsive breakpoints

Designets responsive tilpasning er defineret i `libs/_breakpoints.scss` med følgende faste niveauer:

- **Bredskærm (xlarge):** 1680px og derover.
- **Desktop (large):** 1280px til 1680px.
- **Mellem / Laptop (medium):** 980px til 1280px.
- **Tablet (small):** 736px til 980px (her skifter kontaktgitteret f.eks. til 2 kolonner, og sidebaren foldes sammen).
- **Mobil (xsmall / xxsmall):** Under 736px og under 480px (fuld 1-kolonne visning, optimerede touch-mål og responsive tabeller).

---

[Tilbage til assets-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
