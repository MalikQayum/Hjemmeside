# NemAffald Kildekode - Browserautomatisering med Playwright

Denne mappe indeholder den modulære JavaScript-kildekode, der varetager browserautomatiseringen mod Københavns Kommunes affaldsportal (NemAffald) for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Modulerne er bygget med **Playwright** og arbejder sammen om at navigere, validere adresser, inspicere formularer og oprette bestillinger for ejendommens haveaffald og storskrald.

---

## Moduloversigt

| Modul | Primær funktion | Rolle i bestillingsforløbet |
|---|---|---|
| `weekly-order.js` | **Hovedcontroller.** | Samler hele forløbet. Initialiserer browseren, kontrollerer forudsætninger, kalder rute- og ordrekladde, udfører testvalidering og beslutter om ordren må indsendes eller afsluttes som test. |
| `draft-order.js` | **Ordrekladde.** | Navigerer til bestillingssektionen på portalen, vælger ejendommens adresse i Valby, markerer de ønskede affaldsfraktioner (fx haveaffald) og vælger næste ledige afhentningsdato i kalenderen. |
| `approve-order.js` | **Ordregodkendelse.** | Håndterer det afsluttende godkendelsestrin. **Sikkerhedsspærre:** Modulet afvikles kun, hvis miljøvariablen `NEMAFFALD_ENABLE_SUBMISSION` er eksplicit sat til `"true"`. I testtilstand afbrydes forløbet sikkert her forud for bekræftelsen. |
| `setup-contact.js` | **Kontaktprofil.** | Udfylder formularfelterne for den affaldsansvarlige (navn, telefonnummer, e-mailadresse) baseret på `contact.json` og afkrydser samtykke til bekræftelses-e-mail. |
| `inspect-form.js` | **Formularinspektion.** | Scanner portalens DOM-struktur for inputfelter, knapper og fejlmeddelelser. Sikrer mod systemnedbrud, hvis kommunen ændrer CSS-klasser eller feltnavne på NemAffald-portalen. |
| `inspect-orders.js` | **Ordrestatus & historik.** | Undersøger om der allerede er oprettet en aktiv bestilling for samme adresse i den pågældende uge for at forhindre utilsigtede dobbeltbestillinger. |
| `inspect-route.js` | **Rute- og kalendertjek.** | Verificerer kommunens tømningsrute for 2500 Valby og henter de specifikke datoer, hvor renovationsbilerne betjener Skyttegårdvej og Vigerslevvej. |
| `browser.js` | **Playwright-opsætning.** | Central opsætning af Chromium-browserinstansen i headless tilstand med dansk sprog (`da-DK`), standard viewport (1280x800) og netværks-timeout. |

---

## Samlet eksekveringsflow

Når workflowet kører, gennemløbes følgende sekvens:

1. **`browser.js`** starter headless Chromium og åbner NemAffald.
2. **`inspect-route.js`** slår ejendommens adresse op og kontrollerer tilgængelige afhentningsdage.
3. **`inspect-orders.js`** tjekker for eksisterende reservationer for at undgå dubletter.
4. **`draft-order.js`** vælger de konfigurerede affaldstyper og reserverer datoen.
5. **`setup-contact.js`** indtaster kontaktpersonens data og accepterer vilkår.
6. **`weekly-order.js`** evaluerer resultatet:
   - Hvis det er en testkørsel (`npm run weekly:test`): Forløbet afsluttes med succes, og der genereres en readiness-rapport.
   - Hvis live-bestilling er aktiveret: **`approve-order.js`** klikker på den endelige godkendelse og gemmer kvitteringsnummeret.

---

## Fejlfinding og diagnosticering

- **Skærmbilleder ved fejl:**
  Hvis et formularfelt ikke findes, eller portalen returnerer en fejl, optager Playwright automatisk et skærmbillede (`screenshot`) og gemmer det lokalt i en fejlmappe, så fejlen hurtigt kan identificeres.
- **Lokal test:**
  Kør altid testen lokalt før ændringer i kildekoden committes:
  ```bash
  npm run weekly:test
  ```

---

[Tilbage til NemAffald-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../../README.md)
