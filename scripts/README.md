# Scripts - vedligeholdelse og databehandling

Denne mappe indeholder scripts, der bruges til at vedligeholde hjemmesidens data og automatiseringer.

- `update-geojson.py`: hjælpescript til opdatering af områdekortets GeoJSON.
- `chatbot/`: scripts til generering og validering af chatbotens vidensdatabase.

Kør scripts fra repository-roden, så de forventede relative filstier fungerer. GeoJSON-scriptet opdaterer kortdata fra den manuelle kilde og OpenStreetMap; workflowet til månedlig kørsel ligger i `.github/workflows/update-geojson.yml`. Chatbotværktøjer, afhængigheder og testkommandoer er beskrevet i `chatbot/README.md`.

[Tilbage til repositoryoversigten](../README.md)
