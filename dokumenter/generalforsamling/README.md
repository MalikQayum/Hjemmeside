# Generalforsamlingsdokumenter - Referater, regnskaber og takster

Denne mappe danner det centrale dokumentarkiv for generalforsamlingerne i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**. Her arkiveres alle formelle referater, årsregnskaber og historiske prisblade, som offentliggøres via hjemmesidens side `/generalforsamling/`.

---

## Mappestruktur

| Undermappe / Fil | Format | Beskrivelse og indhold |
|---|---|---|
| [`referater/`](referater/README.md) | PDF | Referater fra ordinære generalforsamlinger (`YYYY-gf-referat.pdf`) og ekstraordinære generalforsamlinger (`YYYY-xgf-referat.pdf`). |
| [`regnskab/`](regnskab/README.md) | PDF | Komplet historisk regnskabsarkiv fra 1996 til 2027 (31 årsregnskaber) revideret i samarbejde med DEAS og statsautoriseret revisor. |
| `prisblad-2026.pdf` | PDF | **Arkiveret underskrevet prisblad.** Fastfrosset dokumentversion af takstbladet for 2026. |

---

## Aktuelle priser og dynamisk integration

Hjemmesidens side `/generalforsamling/` og de øvrige selvbetjeningssider (nøgler, kælderrum, parkering) viser altid de **aktuelle og gældende gebyrer**:

- **Datakilde:** Priserne hentes dynamisk fra `generalforsamling/prisblad.json` i bestyrelsens datalager (`Vigerslev-Skyttegard/bestyrelsen`).
- **Klient-script:** Scriptet `assets/js/general-price-list.js` indlæser automatisk tabellen med gebyrkoder (`price-001` til `price-008`), beløb og opkrævningsfrekvens.
- **Rolle for `prisblad-2026.pdf`:** PDF-filen i denne mappe fungerer som juridisk og historisk dokumentation for den version, der blev godkendt på generalforsamlingen, men er ikke længere den tekniske datakilde for hjemmesidens live-visning.

---

## Procedure ved afholdelse af generalforsamling

For at sikre korrekt dokumentation og opdatering af hjemmesiden skal bestyrelsen og administrator følge denne proces:

1. **Indkaldelse og dagsorden:**
   - Udsendes til alle ejere i overensstemmelse med vedtægternes frister (senest 3 uger før ordinær generalforsamling).
2. **Godkendt årsregnskab:**
   - Årsregnskabet uploades til `dokumenter/generalforsamling/regnskab/` med navnet `[AAR]-regnskab.pdf`.
   - Den historiske oversigt på `/generalforsamling/index.html` opdateres i den foldbare arkivboks (`<details class="archive-details">`).
3. **Referat:**
   - Det underskrevne referat (godkendt af dirigent og referent) scannes og uploades til `dokumenter/generalforsamling/referater/` som `[AAR]-gf-referat.pdf` (eller `[AAR]-xgf-referat.pdf` ved ekstraordinær generalforsamling).
   - Linket indsættes under "Seneste generalforsamling" på `/generalforsamling/index.html`.
4. **Opdatering af takster:**
   - Vedtagne ændringer i gebyrer for nøglebrikker, parkeringspladser eller kælderrumsleje opdateres i bestyrelsens administrationsportal (`/bestyrelsen/`), hvorefter prisbladets JSON-fil synkroniseres automatisk.

---

[Tilbage til dokumentarkivet](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
