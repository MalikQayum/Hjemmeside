# Parkering (`/parkering/`)

Denne mappe indeholder `index.html`, den offentlige informations- og ventelisteside for parkering i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens opbygning

### 1. Øverste sektion: Information og henvendelse (2-kolonne layout)

#### Venstre kolonne:
- **Cykelparkering:** Information om gratis parkering for beboernes cykler i cykelkældre og i udendørs cykelstativer.
- **Priser for parkeringspladser:**
  - Plads til personbil: Dynamisk indlæst sats (`price-002`) pr. måned via DEAS.
  - Plads til motorcykel / scooter: Dynamisk indlæst sats (`price-003`) pr. måned via DEAS.
  - Priserne synkroniseres direkte fra foreningens prisblad via `assets/js/public-price-bindings.js`.
- **Generel information:** Bestyrelsen administrerer foreningens egne parkeringspladser og fører den officielle venteliste efter anciennitet.
- **Uretmæssig parkering:** DinParkering varetager parkeringskontrollen. Hvis uvedkommende holder på en tildelt plads, kontaktes DinParkering direkte på døgnvagten tlf. <a href="tel:+4570208970">70 20 89 70</a>.

#### Højre kolonne: Kontaktformular til bestyrelsen
- Formular med id `#parking-contact-form` og stylesheet `assets/css/parking-overview.css`.
- Understøtter emnerne *Venteliste* eller *Andre henvendelser*.
- Felter: Beboeradresse i foreningen, fulde navn, e-mailadresse samt valgfrit beskedfelt (f.eks. bilmærke, registreringsnummer m.v.).
- Formularhåndtering styres af `assets/js/parking-contact-form.js`.

---

### 2. Nederste sektion: Live venteliste til parkering

- **Live data:** Tabellen indlæses dynamisk i browseren via `assets/js/parking-overview.js`.
- **Datakilde:** Data hentes direkte fra bestyrelsens officielle data-repository på GitHub:
  `https://raw.githubusercontent.com/Vigerslev-Skyttegard/bestyrelsen/main/parkering/data.json`
- **Ingen lokal Excel-afhængighed:** Den offentlige side benytter ikke tunge klientsidebiblioteker som SheetJS eller lokale regneark. Al datavisning er letvægts-JSON med øjeblikkelig indlæsning og fuld mobiltilpasning.
- **Dataindhold:** Viser tilmeldingsdato, beboeradresse/lejlighed samt anonymiseret/registreret køretøjsstatus.

---

## Administration og opdatering

1. Bestyrelsen administrerer og ajourfører ventelisten via det beskyttede modul på `/bestyrelsen/`.
2. Ved ændringer kalder administrationsmodulet workflowet `.github/workflows/update-data.yml` i data-repositoryet `Vigerslev-Skyttegard/bestyrelsen`, som validerer foreningens 69 adresser og committer den opdaterede `parkering/data.json`.
3. Den offentlige parkeringsside på `skyttegaardvej.dk` afspejler ændringerne med det samme uden behov for ny deployment af selve hjemmesiden.

---

## Tilhørende filer

- `index.html`: Sidens HTML-struktur.
- `../assets/css/parking-overview.css`: Styling af kortbokse, tabeller og statusfelter.
- `../assets/js/parking-overview.js`: Asynkron hentning og rendering af JSON-ventelisten.
- `../assets/js/parking-contact-form.js`: Validering og afsendelse af kontaktformularen.
- `../assets/js/public-price-bindings.js`: Forbindelse til dynamiske priser.

[Tilbage til repositoryoversigten](../README.md)

