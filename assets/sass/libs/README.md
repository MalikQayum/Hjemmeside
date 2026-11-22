# Sass - Libs (Hjælpefunktioner, mixins og variabler)

Denne mappe indeholder de understøttende Sass-værktøjer, mixins, matematiske funktioner og globale variabler, som anvendes af resten af Sass-arkitekturen for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Modulerne genererer ikke selvstændig CSS, men stiller beregninger og genanvendelige mønstre til rådighed for `base/`, `components/` og `layout/`.

---

## Moduloversigt

| Modul | Formål | Vigtigste indhold og funktioner |
|---|---|---|
| `_vars.scss` | **Globale variabler.** | Farvekoder (primær blå, sekundær grå, advarselsfarver, baggrundstoner), skrifttype-stakke (font-family for brødtekst og overskrifter), standard skrifttypestørrelser, linjehøjder og overgangshastigheder (`transition-duration`). |
| `_breakpoints.scss` | **Medieforespørgsler.** | Kort over skærmstørrelser (`$breakpoints`), herunder `xlarge`, `large`, `medium`, `small`, `xsmall`, `xxsmall`, samt breakpoint-mixins til `@include breakpoint(<=medium)` m.v. |
| `_functions.scss` | **Hjælpefunktioner.** | Matematiske Sass-funktioner til konvertering af pixels til `rem`/`em`, beregning af farvekontraster, lysstyrkejustering (`lighten`, `darken`) og strengmanipulation. |
| `_mixins.scss` | **Genanvendelige mixins.** | Mixins til flexbox-justering, pseudo-elementer (`::before`/`::after`), absolut centrering, knapstile og standard skyggeeffekter (`box-shadow`). |
| `_html-grid.scss` | **Grid-system.** | Beregning af det responsive 12-kolonners HTML-grid (`.row`, `.col-1` til `.col-12`) og indbyrdes afstande (gutters). |
| `_vendor.scss` | **Vendor prefixes.** | Håndtering af browser-præfikser (`-webkit-`, `-moz-`, `-ms-`) for ældre browsere ved overgange, animationer og transformationer. |

---

## Retningslinjer ved ændringer

1. **Farver og typografi (`_vars.scss`):**
   - Hvis foreningens officielle farver eller fontvalg skal justeres, sker det udelukkende her. Dette sikrer ensartethed på hele hjemmesiden.
2. **Breakpoints (`_breakpoints.scss`):**
   - Breakpoint-værdierne er nøje kalibreret til at passe sammen med sidebarens skiftepunkt (1280px) og kontaktgitterets skiftepunkter (980px og 640px). Ændr kun værdierne, hvis der er opstået et generelt layoutproblem på specifikke enhedstyper.
3. **Kompilering:**
   - Efter ændringer i `libs/` skal `main.scss` kompileres:
     ```bash
     sass assets/sass/main.scss assets/css/main.css
     ```

---

[Tilbage til Sass-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../README.md)
