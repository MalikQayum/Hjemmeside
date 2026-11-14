# Chatbot – kildekonfiguration

`knowledge-config.json` styrer, hvilke repository-filer der må læses af generatoren og indgå i den offentligt tilgængelige vidensdatabase.

- `include`: eksplicit allowlist over kilder.
- `exclude`: ekstra udelukkelser og dokumentation af indhold, der ikke skal indekseres.
- `chunk_chars` og `overlap_chars`: styrer opdeling af kildetekst i søgbare afsnit.

Tilføj kun kilder, som må offentliggøres og gengives til hjemmesidens besøgende. Ændringer af officielle regler skal ske i de officielle kildedokumenter – aldrig ved at lade chatbotten omskrive dem. Efter ændringer køres workflowet for opdatering af vidensdatabasen.
