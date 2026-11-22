# Sass - Base (Fundament og grundregler)

Denne mappe indeholder fundamentet for hjemmesidens visuelle stil. Reglerne her fastlægger typografi, browser-nulstilling (CSS reset) og overordnede sideegenskaber for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Enhver ændring i disse filer påvirker alle sider på hele websitet og kræver genkompilering af `main.scss` til `../../css/main.css`.

---

## Moduler i mappen

### 1. `_reset.scss`
- **Formål:** Etablerer et ensartet udgangspunkt på tværs af alle browsere (Chrome, Firefox, Safari, Edge) ved at nulstille standardmarginer, polstring (padding), kantlinjer (borders) og boksmodeller.
- **Vigtige regler:**
  - Sætter `box-sizing: border-box` for alle elementer (`*`, `*::before`, `*::after`).
  - Nulstiller standard margin og padding på `html`, `body`, overskrifter, lister og formularer.
  - Sikrer, at HTML5 blok-elementer (`article`, `aside`, `details`, `figcaption`, `figure`, `footer`, `header`, `main`, `menu`, `nav`, `section`) vises som `display: block`.

### 2. `_page.scss`
- **Formål:** Definerer grundlæggende sidestyling for `body` og overordnede containere.
- **Vigtige regler:**
  - Baggrundsfarve og standard tekstfarve.
  - Grundlæggende linjeafstand og scroll-adfærd (`-webkit-overflow-scrolling: touch`).
  - Håndtering af print-layouts (`@media print`) for overskuelig udskrift af generalforsamlingsreferater, regnskaber og vedtægter.
  - Linkfarver (`a`, `a:hover`, `a:active`, `a:focus`) og overgangseffekter (transitions).

### 3. `_typography.scss`
- **Formål:** Styrer skrifttyper, overskriftsniveauer (`h1` til `h6`), brødtekst og citater.
- **Vigtige regler:**
  - Skrifttypehierarki (sans-serif systemfonte med fallback til standard Open Sans / Helvetica / Arial).
  - Skalering af overskrifter:
    - `h1`: Sidens hovedtitel.
    - `h2`: Primære sektionsoverskrifter (fx Samarbejdspartnere, Områdekort, Lejevilkår).
    - `h3`: Korttitler og undersektioner.
    - `h4`, `h5`, `h6`: Mindre overskrifter og infobokse.
  - Brødtekst (`p`), forhåndsformateret tekst (`pre`, `code`), citater (`blockquote`) og vægtning (`strong`, `b`, `em`).
  - Responsiv typografisk skalering via relative enheder (`rem` og `em`).

---

## Kompilering efter ændringer

Når en af disse filer redigeres, skal hovedstylesheetet kompileres fra repository-roden:

```bash
sass assets/sass/main.scss assets/css/main.css
```

Kontroller derefter både desktop- og mobilvisningen for at sikre, at typografien eller linjeafstanden ikke skaber uønsket tekstoverløb på mindre skærme.

---

[Tilbage til Sass-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../README.md)
