# Sass - Layout (Strukturelle rammer for hjemmesiden)

Denne mappe indeholder de overordnede layoutmoduler, der definerer strukturen, sideopsætningen og den responsive opbygning på hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Modulerne sikrer, at header, sidebar, navigationsmenu, hovedindhold og sidefod fungerer harmonisk på tværs af samtlige undersider.

---

## Moduloversigt

| Modul | Primære ID'er og klasser | Rolle og funktionalitet |
|---|---|---|
| `_wrapper.scss` | `#wrapper` | **Hovedomslag.** Omslutter hele sidens DOM-træ og styrer den overordnede flexbox- eller grid-struktur, der placerer `#main` (indholdet) og `#sidebar` (navigationsmenuen) side om side på desktop eller stablet på mindre skærme. |
| `_header.scss` | `#header` | **Tophoved.** Viser hjemmesidens logo/titel ("Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148"), links og åbne-/lukke-ikon til sidebaren på mobile enheder og tablets. |
| `_main.scss` | `#main` | **Hovedindholdsareal.** Container for det primære indhold på hver side. Indeholder typisk sidetitel, brødtekst, tabeller, kontaktbokse eller kortvisning. |
| `_sidebar.scss` | `#sidebar`, `.toggle` | **Sidebar-navigation.** Skuffe-/sidemenu, der indeholder logo, søgefelt, navigationslinks, kontaktgenveje og bestyrelsesoplysninger. Indlæses dynamisk på alle undersider via `assets/js/load-sidebar.js`. |
| `_menu.scss` | `#menu` | **Navigationsmenustruktur.** Formatering af menupunkter i sidebaren med underpunkter (dropdowns), fremhævelse af aktiv side og hover-effekter. |
| `_banner.scss` | `#banner` | **Hero-sektion.** Store velkomstbannere og videobaggrunde, primært anvendt på forsiden til at indramme 3D-videoen af ejendommen samt den indledende præsentationstekst. |
| `_footer.scss` | `#footer` | **Sidefod.** Nederste afsnit i sidebaren og på siderne med officiel copyright: `© Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148`, links til administrator (DEAS) og tidsstempel. |

---

## Responsiv opførsel af layoutet

1. **Desktop (> 1280px):**
   - Sidebaren er synlig og fastlåst i venstre eller højre side, mens hovedindholdet optager den resterende bredde.
2. **Tablet og mindre skærme (<= 1280px):**
   - Sidebaren foldes automatisk sammen og glider ud af synsfeltet.
   - En synlig "toggle"-knap (hamburgermenu) i `#header` tillader brugeren at åbne sidebaren med en glidende overgang (slide-in).
   - Ved klik uden for den åbne sidebar eller på et link lukkes sidebaren igen.

---

## Kompilering efter ændringer

Efter redigering af layoutmodulerne kompileres hovedstylesheetet:

```bash
sass assets/sass/main.scss assets/css/main.css
```

Efter kompilering skal du altid teste layoutet på mindst tre skærmstørrelser:
1. Almindelig computerskærm (1920x1080 eller 1440x900).
2. Tablet (iPad i stående og liggende format, ca. 768px-1024px).
3. Mobiltelefon (iPhone/Android, 375px-414px).

---

[Tilbage til Sass-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../README.md)
