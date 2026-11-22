# Chatbot - Konfigurationsfiler og kildestyring

Denne mappe indeholder de centrale konfigurationsfiler, som styrer adfærden, synligheden og vidensgrundlaget for den browserbaserede chatbot på hjemmesiden for **Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148**.

Chatbotten er designet til at give beboere hurtige, præcise og kildebaserede svar på praktiske spørgsmål om husorden, affald, parkering, nøgler, kælderrum og vedligeholdelse direkte i browseren.

---

## Filer i mappen

| Konfigurationsfil | Format | Rolle og funktion |
|---|---|---|
| `config.json` | JSON | **Aktiveringsflag.** Styrer om chatbot-knappen "Spørg os" skal vises på hjemmesiden. |
| `knowledge-config.json` | JSON | **Kildestyring.** Definerer hvilke sider, PDF-dokumenter og tekstblokke der må indekseres i vidensdatabasen. |
| `response-rules.json` | JSON | **Godkendte hurtigsvar.** Indeholder verificerede spørgsmål, som peger direkte på specifikke kildeafsnit. |

---

## Detaljeret gennemgang af konfigurationsfilerne

### 1. `config.json` - Global aktivering
Filen indeholder en simpel boolsk værdi:
```json
{
  "enabled": true
}
```
- **`"enabled": true`:** Chatbot-knappen "Spørg os" vises i nederste højre hjørne på alle sider, og chatbot-modulet `assets/js/chatbot.js` initialiseres.
- **`"enabled": false`:** Chatbotten deaktiveres helt. Knappen skjules, og der indlæses ingen ekstra scripts i browseren.
- **Teknisk implementering:** Både `load-sidebar.js` og `chatbot.js` henter `config.json` ved sideindlæsning med `fetch('/chatbot/config/config.json', { cache: 'no-store' })`. Dette sikrer, at ændringen slår igennem straks efter commit på GitHub Pages uden forsinkelse fra browsercache. Hvis netværket fejler, forbliver knappen synlig som sikker fallback.

### 2. `knowledge-config.json` - Kilder til vidensdatabasen
Denne fil fungerer som en streng allowlist over, hvilke filer i repositoryet generatoren `scripts/chatbot/build-knowledge.py` må læse:
```json
{
  "include": [
    "affald-storskrald/index.html",
    "generalforsamling/index.html",
    "husorden-vedtaegter/index.html",
    "kaelderrum/index.html",
    "kontakt/index.html",
    "noegler/index.html",
    "nyhed/index.html",
    "parkering/index.html",
    "udlejning/index.html",
    "vedligeholdelse/index.html",
    "husorden-vedtaegter/Husorden.pdf"
  ],
  "exclude": [
    "generalforsamling/referater/**",
    "dokumenter/forening/**"
  ],
  "chunk_chars": 500,
  "overlap_chars": 80
}
```
- **`include`:** Kun offentligt godkendte sider og dokumenter må medtages.
- **`exclude`:** Udelukker historiske referater og uofficielle kladder, så forældede regler ikke optræder som gældende viden.
- **`chunk_chars` og `overlap_chars`:** Styrer tekstsegmenteringen, så kildeteksten opdeles i naturlige, søgbare afsnit med tilstrækkelig kontekst.

### 3. `response-rules.json` - Trænede og verificerede spørgsmål
Filen vedligeholdes automatisk af træningsworkflowet `.github/workflows/train-chatbot.yml`:
- Hver regel forbinder en specifik spørgsmålsformulering med et entydigt kilde-ID i vidensbasen (`data/knowledge.json`).
- **Strenge godkendelseskrav:**
  - Søgemotoren skal med høj præcision udpege det korrekte kildeafsnit som første prioritet.
  - Det genererede svar skal være kort og præcist (maksimalt 45 ord).
  - Reglerne må **aldrig** indeholde selvstændigt opfundne regler eller fakta. De peger udelukkende på kildedokumentets eksisterende tekst.

---

## Retningslinjer ved ændringer

1. **Officielle regelændringer:**
   - Hvis husordenen eller vedtægterne vedtages ændret på en generalforsamling, skal ændringen altid foretages i kildedokumenterne (`Husorden.pdf` eller den relevante HTML-side) - aldrig direkte i chatbot-konfigurationen.
2. **Genopbygning af viden:**
   - Efter ændring af kilder eller `knowledge-config.json` skal vidensbasen genopbygges via workflowet `update-chatbot-knowledge.yml` eller lokalt med `python scripts/chatbot/build-knowledge.py`.

---

[Tilbage til chatbot-oversigten](../README.md) · [Tilbage til repositoryoversigten](../../README.md)
