# Kontakt (`/kontakt/`)

Denne mappe indeholder `index.html`, den centrale kontaktside for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Siden indeholder opdaterede kontaktoplysninger til foreningens bestyrelse og faste samarbejdspartnere samt direkte adgangslinks til foreningens digitale login-platforme.

---

## Sidens struktur

Siden er opbygget i to hovedsektioner med et ensartet, moderne kort-layout (CSS Card Grid):

### 1. Faste samarbejdspartnere
Oversigt over de 9 primære aktører omkring foreningens drift, administration og vedligehold:

| Anker-ID | Aktør | Rolle & Henvendelse | Primære handlinger |
|---|---|---|---|
| `#bestyrelsen` | **Bestyrelsen** | Overordnet drift, husorden, generalforsamling og parkering | Send e-mail (`bestyrelse@skyttegaardvej.dk`) |
| `#deas` | **DEAS A/S** | Ejendomsadministration, regnskab og skadeanmeldelse | Send e-mail (`SANW@deas.dk`), Ring op (`70 30 20 20`), Anmeld skade (DEAS Selvbetjening) |
| `#protector` | **Protector Forsikring** | Bygningsforsikring (policenr. 3175850) | Vejledning til skadeanmeldelse, Besøg hjemmeside |
| `#ista` | **ISTA Danmark A/S** | Målere, vand- og varmeregnskab | Send e-mail (`ista@ista.dk`), Ring op (`77 32 33 34`) |
| `#hofor` | **HOFOR** | Fjernvarme og vandforsyning | Send e-mail (`kundeservice@hofor.dk`), Ring op (`33 95 33 95`) |
| `#fld` | **Finn L. & Davidsen A/S** | VVS, el, autoriseret håndværkerservice og døgnvagt | Send e-mail (`salg@fld.dk`), Ring op (`70 12 20 20`) |
| `#fiva` | **FIVA Ejendomsadm.** | Foreningens tidligere administrator (historisk reference) | Send e-mail (`fiva@fiva.dk`), Download arkivoplysninger |
| `#hebsoe` | **Hebsoe Rengøring** | Trappevask og renholdelse af fællesarealer (kun bestyrelseskontakt) | Læs om virksomheden |
| `#dinparkering` | **DinParkering** | Parkeringskontrol og uretmæssig parkering på området | Døgnvagt opkald (`70 20 89 70`) |

### 2. Digitale platforme (`#platforme`)
Oversigt over 9 direkte genveje til beboernes og bestyrelsens online værktøjer:

1. **PHM Digital (`#phm`):** Beboerportal til opgange og drift.
2. **DEAS Onlineadgang (`#deas-online`):** Beboeradgang til dokumenter, forbrugsopgørelser og opkrævninger.
3. **DanDomain (`#dandomain`):** Samlet kort med direkte adgang til Kundecenter og Webmail for foreningens domæne.
4. **GitHub (`#github`):** Direkte login samt link til organisationen [Vigerslev-Skyttegard](https://github.com/Vigerslev-Skyttegard).
5. **Bestyrelsens login (`#bestyrelsen-login`):** Genvej til den interne administrationsside på `/bestyrelsen/`.
6. **DinParkering (`#dinparkering-login`):** Loginportal til udstedelse og administration af digitale parkeringstilladelser.
7. **OneDrive (`#onedrive`):** Beboer- og bestyrelseslogin til Microsoft OneDrive for fildeling.
8. **TTLock (`#ttlock`):** Cloud-platform til administration af elektroniske adgangslåse.
9. **Tapo (`#tapo`):** Kameraoversigt til monitorering af udvalgte fællesområder.

---

## Responsivt layout & CSS-arkitektur

Styling styres af `assets/css/kontakt.css`:
- **Gitterstyring (`.contact-grid`):**
  - **Desktop (bred skærm):** Præcis 3 kolonner (`repeat(3, minmax(0, 1fr))`). Da der er 9 kort i hver sektion, opnås et symmetrisk 3x3 layout.
  - **Tablet (op til 980px):** 2 kolonner (`repeat(2, minmax(0, 1fr))`).
  - **Mobil (op til 640px):** 1 kolonne (`1fr`) med reduceret padding (1.25em).
- **Tekst- og boksbeskyttelse:** Alle kort (`.contact-card`), overskrifter og infolinks har `min-width: 0`, `max-width: 100%` og `overflow-wrap: break-word` / `overflow-wrap: anywhere`, så e-mailadresser og telefonnumre aldrig flyder ud over kortenes rammer.
- **Målmarkering (`:target`):** Når en bruger ankommer via et ankerlink (f.eks. `/kontakt/#fld` fra vedligeholdelsessiden), fremhæves det relevante kort med en blid rød puls-animation (`cardTargetPulse`).

---

## Retningslinjer ved opdatering

1. **Bevar anker-ID'er:** Mange undersider (f.eks. `/vedligeholdelse/`, `/generalforsamling/`, `/affald-storskrald/` og sidebar-menuen) linker direkte til ankre på kontaktsiden. Ændr ikke eksisterende ID'er uden at opdatere de interne links.
2. **Kildestyrke:** E-mailadresser, telefonnumre og selvbetjeningslinks skal altid verificeres mod gældende aftaler eller officielle administratoroplysninger.
3. **Chatbot-indeksering:** Siden er optaget i `chatbot/config/knowledge-config.json` som autoritativ kilde til foreningens kontaktoplysninger.

[Tilbage til repositoryoversigten](../README.md)

