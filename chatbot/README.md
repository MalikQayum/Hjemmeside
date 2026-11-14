# Chatbot – vidensbaseret informationsassistent

Chatbotten er en statisk løsning, der hostes sammen med hjemmesiden på GitHub Pages. Den første version søger i en automatisk genereret vidensdatabase og viser kildebaserede tekstuddrag. Den bruger ikke en betalt AI-API eller en ekstern backend.

## Struktur
- `config/`: styring af hvilke kilder der må indgå.
- `data/`: genereret vidensdatabase.
- `../assets/js/chatbot.js` og `../assets/css/chatbot.css`: brugergrænseflade og styling.
- `../scripts/chatbot/`: generator og validering.
- `../.github/workflows/update-chatbot-knowledge.yml`: automatisk opdatering.

Læs denne README og undermappernes README før ændringer. Chatbotten må gengive kilder, men må ikke selv fortolke, ændre eller opfinde foreningens regler. Ved uklare eller modstridende kilder skal den tydeligt gøre opmærksom på usikkerheden og henvise til bestyrelsen.
