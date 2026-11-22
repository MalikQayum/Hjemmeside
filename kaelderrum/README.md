# Leje af kælderrum (`/kaelderrum/`)

Denne mappe indeholder `index.html`, informations- og henvendelsessiden for leje af ekstra kælderrum i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens funktioner og sektioner

### 1. Øverste sektion: Information & Kontaktformular

#### Venstre kolonne: Information & Lejevilkår
- **Generel information:** Foreningen råder over 11 nummererede ekstra kælderrum i ejendommens kældre, som kan lejes af foreningens beboere til personlig opbevaring.
- **Venteliste:** Da alle rum ofte er udlejet, fører bestyrelsen en venteliste efter dato.
- **Lejevilkår:**
  - **Månedlig leje:** Beregnes automatisk pr. kvadratmeter baseret på den gældende takst (`price-008` i prisbladet) og opkræves månedligt via DEAS sammen med fællesudgifterne.
  - **Brugsret:** Må udelukkende anvendes af beboere i foreningen. Fremleje til tredjepart er forbudt.
  - **Sikkerhed:** Rummene skal holdes aflåst, og opbevaring sker på eget ansvar (dækkes af din indbo- eller husstandsforsikring).

#### Højre kolonne: Kontaktformular til bestyrelsen
- Formular med klasse `.info-contact-form` og styling fra `assets/css/contact-form.css`.
- Understøtter emnerne: *Opskrivning til venteliste*, *Spørgsmål om lejevilkår*, *Opsigelse af kælderrum* eller *Andre henvendelser*.
- Formularlogik håndteres af `assets/js/contact-form.js`.

---

### 2. Nederste sektion: Live-oversigt over kælderrum

- Sektionen `#kaelderrum-overview-heading` viser en dynamisk tabel over samtlige 11 ekstra kælderrum:
  - **Lokale 1:** 3 m²
  - **Lokale 2:** 8 m²
  - **Lokale 3:** 20 m²
  - **Lokale 12:** 14 m²
  - **Lokale 33:** 4 m²
  - **Lokale 45:** 25 m²
  - **Lokale 55:** 13 m²
  - **Lokale 68:** 13 m²
  - **Lokale 69:** 25 m²
  - **Lokale 78:** 27 m²
  - **Lokale 80:** 11 m²
- **Dynamisk beregning:** `assets/js/kaelderrum-live.js` indlæser automatisk bestyrelsens seneste lejer- og rumstatus samt den aktuelle kvadratmeterleje fra prisbladet, så den månedlige leje altid er præcis og opdateret.

---

## Tilhørende filer

- `index.html`: Sidens opbygning og formularstruktur.
- `../assets/css/contact-form.css`: Styling for kontaktformular og 2-kolonne boks.
- `../assets/css/kaelderrum-live.css`: Styling af live kælderrumstabellen og status-badges.
- `../assets/js/contact-form.js`: Validering og afsendelse af henvendelser.
- `../assets/js/kaelderrum-live.js`: Hentning og gengivelse af kælderrumsdata.
- `../assets/js/public-price-bindings.js`: Forbindelse til dynamiske priser.

[Tilbage til repositoryoversigten](../README.md)

