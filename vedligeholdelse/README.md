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
- **Rør & forgreninger:** Vand- og afløbsrør fra tilslutningspunktet på de lodrette hovedstrenge/faldstammer og ind i lejligheden.
- **Sanitet & radiatorer:** Armaturer, blandingsbatterier, toiletter, cisterner, radiatorer og varmemålere. Direkte link til VVS (Finn L. & Davidsen) samt målerservice (ISTA).

#### Højre kolonne: Udvendig og fælles vedligehold (Foreningens ansvar)
Ejerforeningen varetager den udvendige bygningsvedligeholdelse og fællesanlæg:
- **Klimaskærm:** Tag, tagrender, nedløbsrør, ydermure, facader, gesimser og sokkel.
- **Hovedforsyningslinjer:** Fælles lodrette stigstrenge til vand og varme samt lodrette faldstammer, som betjener flere lejligheder.
- **Udvendige døre & vinduer:** Yderdøre, opgangsdøre og udvendig maling/vedligeholdelse af vinduer.
- **Fællesarealer & opgange:** Trappeopgange, cykelkældre, vaskerum, kældergange og grønne arealer (renholdelse udføres af Hebsoe Rengøring).
- **Adgangskontrol & dørtelefoner:** Hoveddørlåse, elektroniske dørtelefoner og nøglebrik-læsere. Henviser til bestyrelsen og siden for nøglekort og nøglebrikker (`/noegler/`).

---

### 2. Procedure for lukning af vand

Klare trin og krav, hvis en ejer eller håndværker skal lukke for vandet til en streng eller opgang:
1. **Koordinering med autoriseret VVS:** Arbejde på stigerør skal udføres eller koordineres med autoriseret VVS. Foreningens faste partner er Finn L. & Davidsen A/S (FLD), tlf. 70 12 20 20.
2. **Skriftlig varsling i opgangen:** Krav om ophængning af tydelige sedler i de berørte opgange i god tid (**minimum 3-5 dage forinden**). Sedlen skal oplyse dato, præcist tidsrum, berørte lejligheder samt kontaktnummer på håndværker/beboer.
3. **Akutte brud og rørskader:** Afspærringshanen lukkes omgående. FLD Døgnvagt kontaktes straks (tlf. 70 12 20 20) sammen med bestyrelsen. Ved selvforskyldt skade gælder foreningens gældende selvrisiko (`price-007` fra prisbladet).

---

### 3. Forsikring og skadeanmeldelse (`#forsikring`)

Gennemgår forskellen på bygnings- og indboforsikring samt fremgangsmåde ved skader:
1. **Ejendommens bygningsforsikring:** Tegnet hos **Protector Forsikring** (policenr. 3175850). Dækker selve bygningen, faste bygningsdele og fælles installationer ved pludselige rør-, vand-, brand- eller bygningsskader.
2. **Egen indboforsikring:** Enhver ejer eller lejer skal have sin egen indboforsikring til dækning af private ejendele i lejlighed og kælderrum samt eventuelle glas- og sanitetsudvidelser.
3. **Anmeldelse og selvrisiko:**
   - Skader på bygningen kan anmeldes direkte via **DEAS Selvbetjening** ([anmeld skade](https://foreninger.deas.dk/selvbetjening/ejer/anmeld-forsikringsskade/)).
   - Vejledning og betingelser kan læses hos **Protector Forsikring** ([vejledning](https://protectorforsikring.dk/forsikringstager/sadan-anmelder-du-en-skade/)).
   - Ved selvforskyldt skade dækket af ejendommens forsikring opkræves en selvrisiko via DEAS, som dynamisk indlæses fra prisbladet (`price-007`).

---

## Teknisk implementering

- **Dynamiske priser:** Selvrisiko og nøglebrikpriser indlæses via `assets/js/public-price-bindings.js` ved opslag i data-repositoryet `Vigerslev-Skyttegard/bestyrelsen/prisblad/data.json`.
- **Styling:** Anvender `assets/css/main.css` suppleret med `assets/css/contact-form.css` for kolonnelayout og inline-badges (`.maint-owner-pill`, `.maint-board-pill`, `.maint-callout-box`).
- **Chatbot:** Indekseret i `chatbot/config/knowledge-config.json` for emner vedrørende vedligeholdelse, VVS, vandlukning og forsikring.

[Tilbage til repositoryoversigten](../README.md)

