# NemAffald - Konfiguration og indstillinger

Denne mappe indeholder skabeloner og konfigurationsfiler, som styrer NemAffald-modulets automatiserede bestillinger hos Københavns Kommune for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Filer i mappen

| Fil | Type | Beskrivelse og formål |
|---|---|---|
| `settings.example.json` | JSON (Skabelon) | **Strukturskabelon.** Indeholder samtlige understøttede konfigurationsfelter med eksempelværdier. Anvendes som udgangspunkt ved ny lokal installation på en pc eller server. |
| `settings.github.json` | JSON (Miljøkonfiguration) | **GitHub Actions-indstillinger.** Indeholder de faste, ikke-følsomme driftsparametre for ejendommen (adresse, foreningsnavn og ugedage), som anvendes i cloud-miljøet. |

---

## Konfigurationsparametre i `settings.example.json`

En typisk opsætning omfatter følgende kernefelter:

```json
{
  "address": {
    "street": "Skyttegårdvej",
    "houseNumber": "5",
    "postalCode": "2500",
    "city": "Valby"
  },
  "wasteTypes": [
    "garden_waste",
    "bulky_waste"
  ],
  "schedule": {
    "preferredDay": "Monday",
    "orderLeadTimeDays": 5
  },
  "notifications": {
    "emailConfirmation": true,
    "smsNotification": false
  }
}
```

- **`address`:** Den præcise matrikeladresse, som registreres hos kommunen for afhentningen.
- **`wasteTypes`:** Angiver de affaldsfraktioner, som skal bestilles (haveaffald, storskrald).
- **`schedule`:** Foretrukken ugedag for afhentning samt frist for bestilling (lead time).
- **`notifications`:** Valg af modtagelse af bekræftelseskvittering fra kommunen.

---

## Håndtering af følsomme data og runtime-filer

1. **Ingen personoplysninger i git:**
   - Navne, private telefonnumre og e-mailadresser på bestyrelsesmedlemmer må **ikke** gemmes i versionsstyrede JSON-filer.
2. **Klargøring via `prepare-github-config.js`:**
   - Under afvikling på GitHub Actions indlæses kontaktdata fra hemmeligheden `NEMAFFALD_CONTACT_JSON`.
   - Scriptet `scripts/prepare-github-config.js` opretter dynamisk to lokale filer i runtime-miljøet:
     - `settings.json`: Den samlede konfiguration for den aktuelle kørsel.
     - `contact.json`: Den verificerede kontaktprofil for affaldsansvarlig.
   - Begge filer er tilføjet til `.gitignore` og efterlades aldrig i repositoryet.
3. **Formularkrav og bekræftelser:**
   - Konfigurationen sikrer, at modulet automatisk afkrydser de lovpligtige bekræftelser på NemAffald-portalen:
     - Erklæring om, at bestilleren er bemyndiget affaldsansvarlig for ejendommen.
     - Samtykke til, at kommunen må sende driftsmeddelelser vedrørende afhentningen.

---

[Tilbage til NemAffald-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../../../README.md)
