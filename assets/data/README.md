# Data - Kort- og geografiske filer for lokalområdet

Denne mappe indeholder de geografiske datasæt, som anvendes af det interaktive områdekort på forsiden (`index.html`) samt til ekstern kortlægning og forhåndsvisning.

Kortet giver beboere, tilflyttere og gæster et overblik over ejendommen og de vigtigste faciliteter i Valby inden for en radius af 1,5 km fra **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Filer i mappen

| Fil | Type | Formål og anvendelse |
|---|---|---|
| `ejerforeningen-omraadekort.geojson` | GeoJSON (FeatureCollection) | **Aktiv produktionsfil.** Indlæses asynkront af `assets/js/home-map.js` på forsiden. Indeholder alle godkendte punkter (POI) samt radius-polygonen. Filen genereres automatisk af `scripts/update-geojson.py`. |
| `ejerforeningen-omraadekort-manual.geojson` | GeoJSON (FeatureCollection) | **Manuel kildedata.** Her vedligeholdes foreningens egne registrerede punkter, herunder selve ejendommens matrikel, nærliggende skoler, dagligvarebutikker, togstationer og buslinjer, som altid skal optræde på kortet uanset OpenStreetMap-opdateringer. |
| `ejerforeningen-omraadekort.kml` | Keyhole Markup Language | KML-eksport af kortdata til brug i Google Earth, Google My Maps eller GIS-software. |
| `preview-map.svg` | SVG vektorgrafik | Grafisk forhåndsvisning og fallback-illustration af kortudsnittet. |

---

## Koordinat- og datastandarder

1. **Koordinatsystem:**
   - GeoJSON-standarden (RFC 7946) anvender altid WGS84 koordinater i rækkefølgen:
     `[længdegrad, breddegrad]` (longitude først, latitude derefter).
   - Eksempel for ejendommen: `[12.485123, 55.663456]`.

2. **Struktur for manuelle punkter:**
   Hvert punkt i `ejerforeningen-omraadekort-manual.geojson` skal være et GeoJSON `Feature`-objekt:
   ```json
   {
     "type": "Feature",
     "properties": {
       "name": "Danshøj Station",
       "description": "S-togsstation med linje B, Bx og C",
       "category": "transit_train"
     },
     "geometry": {
       "type": "Point",
       "coordinates": [12.492500, 55.661200]
     }
   }
   ```

3. **Understøttede kategorier:**
   Kortscriptet `home-map.js` genkender følgende kategorier til filtrering og ikonvisning:
   - `property`: Ejerforeningens egne bygninger og adresser.
   - `grocery`: Supermarkeder og dagligvarebutikker (fx Netto, Meny, Lidl).
   - `school`: Skoler, institutioner og dagtilbud.
   - `transit_train`: S-tog og regionaltog (fx Danshøj St., Vigerslev Allé St., Valby St., Hvidovre St.).
   - `transit_bus`: Buslinjer og stoppesteder (fx linje 1A, 23).
   - `parking`: Offentlige parkeringszoner og handicapparkering.

---

## Sådan opdateres kortdata

Den viste produktionsfil `ejerforeningen-omraadekort.geojson` må **ikke** redigeres direkte alene, da den overskrives ved næste kørsel af opdateringsscriptet. Følg denne procedure:

1. **Rediger manuelle steder:**
   Tilføj eller ret punkter i `assets/data/ejerforeningen-omraadekort-manual.geojson`.

2. **Kør genereringsscriptet:**
   Scriptet kombinerer de manuelle punkter med live OpenStreetMap-data via Overpass API inden for en radius på 1,5 km, sorterer dubletter fra og opdaterer produktionsfilen:
   ```bash
   python scripts/update-geojson.py
   ```
   *Bemærk: Kørslen kræver internetadgang for at hente data fra OpenStreetMap.*

3. **Automatisk månedlig opdatering:**
   Workflowet `.github/workflows/update-geojson.yml` kører den første dag i hver måned og kan også startes manuelt fra GitHub Actions fanebladet. Workflowet committer automatisk den opdaterede `ejerforeningen-omraadekort.geojson`.

4. **Verificering:**
   Åbn forsiden i browseren og kontroller, at kortet indlæser alle markører korrekt, at popups viser rigtig information, og at filterknapperne fungerer.

---

[Tilbage til repositoryoversigten](../../README.md)
