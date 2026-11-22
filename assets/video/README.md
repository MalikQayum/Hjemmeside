# Video - Visuelle drone- og ejendomsoptagelser

Denne mappe indeholder de officielle videofiler, som anvendes til dynamisk og visuel præsentation af **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Aktive videofiler

| Fil | Varighed & Opløsning | Placering og funktion på hjemmesiden |
|---|---|---|
| `ejerforeningen-3d.mp4` | MP4 (H.264), 1080p | **Primær 3D-præsentationsvideo.** Vises i hero/banner-sektionen på forsiden (`index.html`). Giver en roterende 3D-luftvisning af hele karréen med de 69 ejerlejligheder, gårdrummet og de grønne fællesarealer. |
| `skyttegaardvej.mp4` | MP4 (H.264), 1080p | Drone- og oversigtsvideo af facaden, opgangene og omgivelserne langs Skyttegårdvej 1-11, herunder adgangsforhold til cykelkælder og storskraldsrum. |
| `vigerslevvej.mp4` | MP4 (H.264), 1080p | Oversigtsvideo af ejendommens vestvendte facade langs Vigerslevvej 144-148 med fokus på adgangsveje, fortov og skralderum. |

---

## Tekniske retningslinjer og browserkompatibilitet

1. **Formater og videocodec:**
   - Formatet skal altid være **MP4** med **H.264** video codec (High Profile eller Baseline Profile) for maksimal understøttelse i alle browsere (Chrome, Safari, Edge, Firefox og mobile browsere).
   - Videoerne skal være kodet uden aktivt lydspor eller med en helt tavs AAC-lydkanal, så browserens automatiske afspilning ikke forhindres.

2. **HTML5-attributter:**
   Videoer på hjemmesiden integreres altid med følgende obligatoriske attributter:
   ```html
   <video autoplay loop muted playsinline preload="auto">
     <source src="assets/video/ejerforeningen-3d.mp4" type="video/mp4">
     Din browser understøtter ikke HTML5-video.
   </video>
   ```
   - `autoplay`: Starter afspilning automatisk ved indlæsning.
   - `loop`: Kører videoen i uendelig løkke.
   - `muted`: Påkrævet af moderne mobil- og desktopbrowsere for at tillade autoplay uden brugerinteraktion.
   - `playsinline`: Forhindrer at mobile browsere (især iOS Safari) tvinger videoen op i fuldskærm.

3. **Responsiv styling og layout:**
   - I `home.css` er videoerne styret via containere med `position: relative`, `overflow: hidden` og videoen sat til `width: 100%`, `height: 100%`, `object-fit: cover`.
   - Dette sikrer, at videoen automatisk tilpasser sig skærmens dimensioner uden at bryde sidens layout.

4. **Filstørrelse og weboptimering:**
   - Da videoerne indlæses direkte af besøgende på forsiden, skal filstørrelsen optimeres nøje. Det anbefales at komprimere med værktøjer som HandBrake eller `ffmpeg` (fx `ffmpeg -i input.mp4 -vcodec libx264 -crf 24 -an output.mp4`) for at holde filerne under rimelig båndbredde.

5. **GDPR og personoplysninger:**
   - Droneoptagelser og udendørs videoklip må ikke indeholde genkendelige ansigter eller bilers nummerplader uden samtykke. Kontroller altid nyt videomateriale for utilsigtede personoplysninger før offentliggørelse.

---

[Tilbage til repositoryoversigten](../../README.md)
