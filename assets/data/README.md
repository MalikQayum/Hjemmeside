# Data - kort- og geografiske filer

Indeholder data, som bruges af hjemmesidens områdekort.

- `ejerforeningen-omraadekort.geojson`: GeoJSON-data, som kortet anvender.
- `ejerforeningen-omraadekort-manual.geojson`: manuelt vedligeholdt datagrundlag.
- `ejerforeningen-omraadekort.kml`: KML-version af kortdata.
- `preview-map.svg`: grafisk forhåndsvisning.

Læs også root-README'ens afsnit om områdekort og workflowet `.github/workflows/update-geojson.yml`, før data ændres. Koordinater i GeoJSON angives som længdegrad efterfulgt af breddegrad.

## Sådan vedligeholdes kortdata

Tilføj eller ret manuelt vedligeholdte steder i `ejerforeningen-omraadekort-manual.geojson`. Hver lokation skal være et GeoJSON `Feature` med et punkt, navn, beskrivelse og en kategori, som kortet kender. Koordinater skrives som `[længdegrad, breddegrad]`.

Den viste `ejerforeningen-omraadekort.geojson` genereres af `scripts/update-geojson.py`: scriptet kombinerer de manuelle steder med relevante steder fra OpenStreetMap inden for kortets radius og undgår nærliggende dubletter. Kør fra repository-roden:

```bash
python scripts/update-geojson.py
```

Kørslen kræver netværksadgang til OpenStreetMap. Alternativt kan workflowet `update-geojson.yml` startes manuelt fra GitHub Actions. Kontrollér den genererede GeoJSON og kortvisningen efter opdateringen. Redigér ikke kun den genererede fil, hvis ændringen skal bevares ved næste kørsel. Scriptet opdaterer ikke KML-filen eller SVG-forhåndsvisningen.

[Tilbage til repositoryoversigten](../../README.md)
