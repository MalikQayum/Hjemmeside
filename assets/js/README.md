# JavaScript - hjemmesidens browserfunktioner

Indeholder scripts, der kører i besøgendes browser. Eksempler er navigation/sidebar, områdekort, kontaktformular, dokumentvisere, parkeringsventeliste og chatbot.

## Vigtige filer
- `load-sidebar.js`: indlæser den fælles sidebar og dens funktioner. Chatbotten indlæses kun, når `chatbot/config/config.json` har `"enabled": true` eller konfigurationsfilen ikke kan hentes.
- `home-map.js`: områdekortet.
- `chatbot.js`: chatbotgrænseflade og søgning i vidensdatabasen.
- `parking-waitlist.js`: visning/behandling af parkeringsventelisten.
- `pdf-viewer.js`, `docx-viewer.js`, `excel-viewer.js`: dokumentvisere.
- `contact-form.js`, `parking-contact.js`: kontaktformularer.

## Sådan vedligeholdes JavaScript

Find først siderne, der indlæser scriptet, og kontrollér om det deles af flere sider. Afgrænsede funktioner bør fortsat være i deres egne scripts i stedet for at blive blandet ind i `main.js`. Efter ændringer skal den tilhørende side prøves i browseren, inklusive mobilvisning og relevante formular- eller fejlsituationer.

Undgå at placere hemmeligheder eller private API-nøgler i browserkode. Alt indhold i disse filer kan læses af besøgende.

[Tilbage til repositoryoversigten](../../README.md)
