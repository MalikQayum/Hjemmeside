# Nøglekort og nøglebrikker (`/noegler/`)

Denne mappe indeholder `index.html`, vejlednings- og bestillingssiden for elektroniske nøglebrikker og nøglekort i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens emner og funktioner

### 1. Det elektroniske adgangssystem
- Adgang til alle opgange, cykelkældre, vaskerum og skralderum sker ved hjælp af elektroniske nøglebrikker (eller nøglekort).
- Hver brik og hvert kort er kodet med et unikt serienummer for at sikre høj adgangssikkerhed i ejendommen.
- På dørtelefonerne ved hoveddørene vises kun adressen uden beboernavn af hensyn til privatliv og sikkerhed.

### 2. Bestilling og berettigelse
- Nye eller supplerende nøglebrikker og nøglekort kan bestilles af lejlighedens ejere eller faste beboere.
- **Dynamisk pris:** Enhedsprisen pr. brik/kort indlæses dynamisk fra det officielle prisblad (`price-001`).
- **Betaling:** Beløbet opkræves direkte sammen med de månedlige fællesudgifter via DEAS.
- **Levering & Samtykke:** Bestillingen kræver obligatorisk afkrydsning af beboersamtykke til, at bestyrelsen må aflevere de programmerede brikker i beboerens postkasse.

### 3. Mistede eller defekte brikker
- **Mistet brik (akut spærring):** Beboere opfordres til straks at indsende en henvendelse med brikkens nummer, så den kan slettes/spærres i adgangskontrollen af hensyn til hele ejendommens sikkerhed.
- **Defekte brikker:** Brikker der ikke længere reagerer på læserne, kan ombyttes ved henvendelse til bestyrelsen.

---

## Kontaktformularens funktion

Formularen på siden tilpasser sig automatisk efter den valgte henvendelsestype:
- **Bestilling:** Viser vælgere for antal nøglebrikker (0-10 stk.) og antal nøglekort (0-10 stk.), beregner live den samlede pris og kræver postkassesamtykke.
- **Mistet brik / Defekt brik / Spørgsmål:** Skjuler bestillings- og prisvælgere og viser et tekstfelt til beskrivelse, evt. briknummer eller spørgsmål.
- **Script:** Formularlogikken og live-prisberegningen styres af `assets/js/contact-form.js` i samspil med `assets/js/public-price-bindings.js`.

---

## Tilhørende filer

- `index.html`: Sidens HTML-struktur.
- `../assets/css/contact-form.css`: Styling af formular, prisboks og statusbeskeder.
- `../assets/js/contact-form.js`: Klientvalidering, dynamisk feltstyring og prisberegning.
- `../assets/js/public-price-bindings.js`: Dynamisk binding af enhedsprisen fra prisbladet.

[Tilbage til repositoryoversigten](../README.md)

