# Sass - Components (Genanvendelige UI-komponenter)

Denne mappe indeholder alle genanvendelige visuelle UI-komponenter til hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**. Komponenterne danner byggeklodserne til knapper, formularer, tabeller, bokse, ikoner og indholdslister.

Efter enhver ændring i disse filer skal `main.scss` kompileres til `../../css/main.css`.

---

## Komponentoversigt

| Modul | Primære CSS-klasser | Anvendelse og formål |
|---|---|---|
| `_button.scss` | `.button`, `.primary`, `.large`, `.small`, `.fit`, `.disabled` | Standard-, primære og sekundære handlingsknapper, inklusiv hover-, focus- og active-tilstande samt fuldbreddeknapper (`.fit`). |
| `_actions.scss` | `.actions`, `.stacked`, `.fit` | Gruppering og layout af knapsekvenser, fx "Send besked" og "Nulstil", vandret eller stablet lodret på mobil. |
| `_box.scss` | `.box`, `.alt` | Indrammede indholdsbokse med polstring, baggrundstone og let kantlinje til fremhævede meddelelser. |
| `_contact.scss` | `.contact`, `.contact-method` | Standard kontaktblokke og adresser med ikoner for telefon, e-mail og åbningstider. |
| `_features.scss` | `.features` | Gitter med fremhævede funktioner (ikon, overskrift og kort tekst), fx på forsiden. |
| `_form.scss` | `form`, `input`, `textarea`, `select`, `.field` | Inputfelter, tekstområder, dropdown-menuer, radioknapper, afkrydsningsfelter og valideringsstatus for kontakt- og bestillingsformularer. |
| `_icon.scss` | `.icon`, `.solid`, `.regular`, `.brands` | Grundlæggende ikonpositionering og pseudo-elementer (`::before`) til visning af Font Awesome-ikoner. |
| `_icons.scss` | `.icons` | Vandrette rækker af ikoner, fx sociale links eller links til eksterne samarbejdspartnere. |
| `_image.scss` | `.image`, `.fit`, `.main`, `.left`, `.right` | Billedformatering, centrering, float-placering, afrundede hjørner og responsive billedcontainere. |
| `_list.scss` | `ul`, `ol`, `.alt`, `.icons`, `.actions` | Formatering af punktlister, nummererede vejledninger og definitionslister. |
| `_mini-posts.scss` | `.mini-posts`, `.mini-post` | Små nyheds- og dokument-teasere, fx brugt i sidebaren. |
| `_pagination.scss` | `.pagination`, `.page`, `.next`, `.previous` | Sidenavigation og frem/tilbage-knapper til flersidede lister. |
| `_posts.scss` | `.posts`, `.post` | Flerkolonne-layouts til artikler og nyhedsoversigter. |
| `_row.scss` | `.row`, `.col` | Grid-rækker og kolonneinddelinger til traditionel float- eller flexbox-placering. |
| `_section.scss` | `section`, `.main`, `.special` | Indholdssektioner med overskriftsbånd, baggrundsfarver og afstande. |
| `_table.scss` | `table`, `.alt`, `thead`, `tbody`, `tfoot` | Responsive tabeller til regnskabstal, prisoversigter og arkiver med skiftende rækkefarver (zebra-striping). |

---

## Samspil med sidespecifikke stylesheets

Bemærk, at avancerede og dynamiske sider benytter specialiserede CSS-moduler uden om disse Sass-komponenter for at isolere funktionel logik:
- `kontakt.css`: Styrer det responsive 3-kolonners gitter for samarbejdspartnere og platforme samt `:target`-animationer.
- `parking-overview.css`: Styrer den dynamiske ventelistetabel og statusbadges for bil og motorcykel.
- `kaelderrum-live.css`: Styrer live-oversigten over de 11 kælderrum og lejestatus.
- `contact-form.css`: Styrer moderne formularer med floating labels og tilbagemeldinger.

---

## Kompilering

Kompiler `main.scss` efter redigering af en komponent:

```bash
sass assets/sass/main.scss assets/css/main.css
```

Kontroller derefter mindst to forskellige sider, der benytter den pågældende komponent.

---

[Tilbage til Sass-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../README.md)
