# Generel vedligeholdelse (`/vedligeholdelse/`)

Denne mappe indeholder `index.html`, vejlednings- og informationssiden om vedligeholdelsesansvar, procedure for vandlukning samt forsikringsforhold i **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

---

## Sidens opbygning og emner

### 1. Ansvarsfordeling: Indvendig vs. Udvendig vedligeholdelse

Siden stiller to ligeværdige kolonner op, som tydeliggør ansvarsfordelingen jf. foreningens vedtægter:

#### Venstre kolonne: Indvendig vedligeholdelse (Ejerens eget ansvar)
Ejerlejlighedsejeren har pligt til for egen regning at vedligeholde, reparere og forny alt indvendigt:
- **Vinduer & døre (indvendigt):** Indvendig maling, gerigter, låsekasser, dørgreb og vinduesrammer.
- **Gulve, vægge & lofter:** Trægulve, fliser/klinker, puds, tapet og lofter.
- **Elinstallationer:** Ledningsnet, stikkontakter, afbrydere og lejlighedens gruppetavle. Direkte link til autoriseret el-partner (Finn L. & Davidsen).
- **Indvendige rør & forgreninger:** Alle individuelle forgreninger på vand-, varme- og afløbsrør inde i lejligheden (fra og med forgreningen efter de fælles lodrette hovedstigstrenge og faldstammer).
- **Sanitet & radiatorer:** Armaturer, blandingsbatterier, toiletter, cisterner, radiatorer og varmemålere. Direkte link til VVS (Finn L. & Davidsen) samt målerservice (ISTA).

#### Højre kolonne: Udvendig og fælles vedligehold (Foreningens ansvar)
Ejerforeningen varetager den udvendige bygningsvedligeholdelse og fællesanlæg:
- **Klimaskærm:** Tag, tagrender, nedløbsrør, ydermure, facader, gesimser og sokkel.
- **Hovedforsyningslinjer:** Ejendommens fælles lodrette hovedstigstrenge til vand og varme samt lodrette faldstammer, som betjener flere lejligheder, frem til den individuelle forgrening til den enkelte lejlighed (jf. vedtægterne § 7, stk. 2).
- **Udvendige døre & vinduer:** Yderdøre, opgangsdøre og udvendig maling/vedligeholdelse af vinduer.
- **Fællesarealer & opgange:** Trappeopgange, cykelkældre, vaskerum, kældergange og grønne arealer (renholdelse udføres af Hebsoe Rengøring).
- **Adgangskontrol & dørtelefoner:** Hoveddørlåse, elektroniske dørtelefoner og nøglebrik-læsere. Henviser til bestyrelsen og siden for nøglekort og nøglebrikker (`/noegler/`).

---

### 2. Procedure for lukning af vand

Klare trin og krav, hvis en ejer eller håndværker skal lukke for vandet til en streng eller opgang:
1. **Koordinering med autoriseret VVS:** Arbejde på stigerør skal udføres eller koordineres med autoriseret VVS. Foreningens faste partner er Finn L. & Davidsen A/S (FLD), tlf. 70 12 20 20.
2. **Skriftlig varsling i opgangen:** Krav om ophængning af tydelige sedler i de berørte opgange i god tid (**minimum 3-5 dage forinden**). Sedlen skal oplyse dato, præcist tidsrum, berørte lejligheder samt kontaktnummer på håndværker/beboer.
3. **Akutte brud og rørskader:** Afspærringshanen lukkes omgående. FLD Døgnvagt kontaktes straks (tlf. 70 12 20 20) sammen med bestyrelsen. Ansvar og forsikringsdækning afhænger af, om skaden stammer fra fælles lodrette hovedrør/faldstammer eller lejlighedens egne indvendige forgreninger. Ved dækket selvforskyldt skade gælder foreningens gældende selvrisiko (`price-007` fra prisbladet).

---

### 3. Forsikring og skadeanmeldelse (`#forsikring`)

Gennemgår forskellen på bygnings- og indboforsikring samt fremgangsmåde ved skader:
1. **Ejendommens bygningsforsikring:** Tegnet hos **Protector Forsikring**. Omfatter selve bygningen, faste bygningsdele og fælles installationer (såsom fælles lodrette hovedstigstrenge og faldstammer) efter forsikringspolicens gældende vilkår. Konkret dækning afgøres altid af forsikringsselskabet ud fra skadens placering, årsag og policens betingelser (dækker f.eks. ikke manglende vedligeholdelse eller almindeligt slid på ejerens egne indvendige rørforgreninger, sanitet og armaturer).
2. **Egen indboforsikring:** Enhver ejer eller lejer skal have sin egen indboforsikring til dækning af private ejendele/løsøre i lejlighed og kælderrum samt eventuelle særskilte tilvalgsdækninger efter egen police.
3. **Anmeldelse og selvrisiko:**
   - Skader, der hører under bygningsforsikringen, kan anmeldes direkte via **DEAS Selvbetjening** ([anmeld skade](https://foreninger.deas.dk/selvbetjening/ejer/anmeld-forsikringsskade/)).
   - Vejledning og betingelser kan læses hos **Protector Forsikring** ([vejledning](https://protectorforsikring.dk/forsikringstager/sadan-anmelder-du-en-skade/)).
   - Ved selvforskyldt skade, der behandles under ejendommens bygningsforsikring, opkræves en selvrisiko via DEAS, som dynamisk indlæses fra prisbladet (`price-007`).

---

## Teknisk implementering

- **Dynamiske priser:** Selvrisiko og nøglebrikpriser indlæses via `assets/js/public-price-bindings.js` ved opslag i data-repositoryet `Vigerslev-Skyttegard/bestyrelsen/prisblad/data.json`.
- **Styling:** Anvender `assets/css/main.css` suppleret med `assets/css/contact-form.css` for kolonnelayout og inline-badges (`.maint-owner-pill`, `.maint-board-pill`, `.maint-callout-box`).
- **Chatbot:** Indekseret i `chatbot/config/knowledge-config.json` for emner vedrørende vedligeholdelse, VVS, vandlukning og forsikring.

[Tilbage til repositoryoversigten](../README.md)

