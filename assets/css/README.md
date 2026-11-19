# CSS - hjemmesidens stylesheets

Her ligger de færdige CSS-filer, som browseren indlæser. `main.css` indeholder det overordnede Editorial-design, mens de øvrige stylesheets indeholder side- eller komponentafgrænset styling, herunder kort, dokumentvisere, kontaktformularer, parkering og chatbot.

## Sådan vedligeholdes CSS

1. Find siden i HTML, og se hvilke CSS-filer den indlæser i `<head>`. Start med den mest specifikke fil, så en ændring ikke utilsigtet påvirker andre sider.
2. Brug `../sass/` til ændringer i det fælles Editorial-design, der er defineret i Sass. Side- og funktionsspecifik CSS, som ikke indgår i `main.scss`, vedligeholdes direkte her.
3. Bevar eksisterende filnavne og stier, eller opdatér alle HTML-referencer samtidig.
4. Kontrollér den berørte side på både mobil- og desktopbredde, samt at formularer, menuer eller andre berørte komponenter stadig virker.

`main.css` er det fælles stylesheet, der indlæses på de fleste sider. De øvrige CSS-filer dækker afgrænsede funktioner, eksempelvis kort, dokumentvisere, kontaktformularer og chatbot.

[Tilbage til repositoryoversigten](../../README.md)
