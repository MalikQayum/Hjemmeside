# Chatbot – konfiguration

Mappen indeholder konfigurationsfiler til chatbotten:

## `config.json` – vis chatbotten på hjemmesiden

```json
{
  "enabled": true
}
```

Sæt `enabled` til `true` for at vise "Spørg os" og indlæse chatbotten. Sæt den til `false` for at skjule knappen og helt undlade at indlæse chatbotten. Ændringen træder i kraft efter publicering og næste sideindlæsning.

## `knowledge-config.json` – kilder til vidensdatabasen

`knowledge-config.json` styrer, hvilke repository-filer der må læses af generatoren og indgå i den offentligt tilgængelige vidensdatabase.

- `include`: eksplicit allowlist over kilder.
- `exclude`: ekstra udelukkelser og dokumentation af indhold, der ikke skal indekseres.
- `chunk_chars` og `overlap_chars`: styrer opdeling af kildetekst i søgbare afsnit.

Tilføj kun kilder, som må offentliggøres og gengives til hjemmesidens besøgende. Ændringer af officielle regler skal ske i de officielle kildedokumenter – aldrig ved at lade chatbotten omskrive dem. Efter ændringer køres workflowet for opdatering af vidensdatabasen.


## `response-rules.json` – automatisk godkendte spørgsmål

Filen vedligeholdes af workflowet `train-chatbot.yml`. Hver regel indeholder et spørgsmål og ID'et på det kildeafsnit, som chatbotten skal bruge ved præcis samme formulering.

Reglerne bliver kun tilføjet, når chatbotens eksisterende søgemotor finder det forventede kildeafsnit, og det formaterede svar er kort (højst 45 ord). Filen må ikke bruges til at indføre nye fakta eller ændre husorden/vedtægter. Den officielle ordlyd kommer fortsat fra `knowledge.json`.
