# GitHub-scripts

Scripts i denne mappe kaldes af workflows under `.github/workflows/`. De udfører repository-relaterede opgaver, blandt andet synkronisering af filer fra OneDrive.

## Filer
- `sync-onedrive-to-github.mjs`: fælles OneDrive-til-GitHub-synkronisering.
- `sync-Venteliste-Parkering-onedrive.mjs`: særskilt synkronisering af parkeringsventelisten.

## Vedligeholdelse
Kontrollér altid, hvilket workflow der kalder scriptet, og hvilke GitHub Secrets og variabler det forventer. Læg aldrig adgangsoplysninger direkte i scriptet. Test ændringer via manuel workflow-kørsel, hvis workflowet understøtter `workflow_dispatch`.
