# Parkering

Denne mappe indeholder den offentlige parkeringsside på `/parkering/`.

Parkeringssiden viser foreningens parkeringsinformation, kontaktformular og den aktuelle oversigt over venteliste/parkeringspladser. Tabellen henter data direkte fra det offentlige repository `Vigerslev-Skyttegard/bestyrelsen`, filen `parkering/data.json` via GitHubs Contents API.

Data administreres af bestyrelsen på `/bestyrelsen/`. Bestyrelsens side starter workflowet `.github/workflows/update-data.yml` i data-repositoryet. Workflowet validerer de 69 faste adresser og opdaterer kun `parkering/data.json`.

Den offentlige parkeringsside bruger ikke `Venteliste Parkering.xlsx`, SheetJS eller de gamle Excel-visningsscripts. Excel-filen kan fortsat ligge i hjemmesidens repository som arkiv/OneDrive-synkroniseret fil, men den er ikke datakilde for parkeringsoversigten.

Parkeringsoversigten er offentligt tilgængelig. Nummerplader og ventelistedatoer i `parkering/data.json` kan derfor ses af alle besøgende. Vurder offentliggørelsen af personoplysninger særskilt.

[Tilbage til repositoryoversigten](../README.md)
