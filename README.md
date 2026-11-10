# Hjemmeside – Ejerforeningen Skyttegård/Vigerslev

Velkommen til det officielle kildekode-repository for **Ejerforeningen Skyttegård/Vigerslev** (Skyttegårdsvej 1-11 og Vigerslevvej 144-148 i Valby).

Hjemmesiden fungerer som den primære informationsportal for nuværende og nye ejere samt beboere i foreningen.

---

## 🌐 Domæne & Hosting
- **Aktivt domæne:** [www.skyttegaardvej.dk](https://www.skyttegaardvej.dk)
- **GitHub Pages:** Integreret med automatisk CNAME opsætning (`skyttegaardvej.dk`).
- **Ikke købt domæne:** `www.vigerslevvej.dk`

---

## 📄 Sider og Funktioner

### 1. Forside (`/`)
- **Sti:** `index.html`
- Introduktion og genveje til ejerforeningens vigtigste informationer.

### 2. Velkomstbrev (`/velkomstbrev/`)
- **Sti:** `velkomstbrev/index.html`
- Praktisk information, retningslinjer og introduktion for nye tilflyttere og boligejere.

### 3. Husorden og Vedtægter (`/husorden-vedtaegter/`)
- **Sti:** `husorden-vedtaegter/index.html`
- Interaktiv dokumentvisning med **PDF.js** til nem læsning af vedtægter og husorden direkte i browseren uden at skulle downloade filer.

### 4. Nyheder (`/nyhed/`)
- **Sti:** `nyhed/index.html`
- Seneste nyheder, meddelelser og referater. Viser automatisk foreningens nyhedsbrev direkte fra Word-format (`.docx`).

### 5. Parkering (`/parkering/`)
- **Sti:** `parkering/index.html`
- **Øverst (2-kolonne layout):**
  - **Venstre kolonne:** Information om parkering i foreningen samt oplysninger om uretmæssig parkering (DinParkering døgnvagt).
  - **Højre kolonne:** Forudfyldt kontaktformular til bestyrelsen (valg mellem *Venteliste* eller *Andre henvendelser*, adresse i foreningen `f.eks. Skyttegårdsvej 1, 4. th`, navn, e-mail og bemærkninger).
- **Nederst:** Live visning af ejerforeningens opdaterede parkeringsventeliste (via Excel/SheetJS integration).

### 6. Leje af kælderrum (`/kaelderrum/`)
- **Sti:** `kaelderrum/index.html`
- **Oversigt:** Information om leje af kælderrum, lejevilkår, opkrævning og venteliste samt integreret kontaktformular direkte til bestyrelsen (forudfyldt med emnet "Leje af kælderrum").

### 7. Bestilling af nøglebrikker (`/noeglebrikker/`)
- **Sti:** `noeglebrikker/index.html`
- **Oversigt:** Information om det elektroniske adgangssystem, regler for udlevering, håndtering af mistede/defekte nøglebrikker samt kontaktformular til bestilling og spærring af brikker.

### 8. Kontakt (`/kontakt/`)
- **Sti:** `kontakt/index.html`
- Overskuelig kontaktside med moderne kort-layout (cards) for:
  - **Bestyrelsen** (`bestyrelse@skyttegaardvej.dk`)
  - **DEAS A/S** (Ejendomsadministration)
  - **ISTA Danmark A/S** (Forbrugs- og varmeregnskab)
  - **HOFOR** (Vand og fjernvarme)
  - **Finn L. & Davidsen A/S** (Fast håndværker & døgnvagt)
  - **DinParkering** (Parkeringskontrol)

### 9. Design- & Komponentreferencer (`/eksempler/`)
- **Sti:** `eksempler/index.html`
- Eksempelside med HTML5 UP Editorial skabelonens knapper, formularer, tabeller og typografi til fremtidige udvidelser.

---

## 📝 Redigering af Indhold

- **Menupunkter og sidebar:** Navigationen vedligeholdes ét centralt sted i `sidebar.html`, som automatisk indlæses på alle undersider via `/assets/js/load-sidebar.js`.
- **Dokumenter:** Nyhedsbreve (`Nyhedsbrev.docx`), vedtægter (`Vedtægter.pdf`), husorden (`Husorden.pdf`) og parkeringsventeliste (`Venteliste Parkering.xlsx`) kan udskiftes direkte i projektmappen.

---
*Sidst opdateret: 2026-11-08 11:59*
