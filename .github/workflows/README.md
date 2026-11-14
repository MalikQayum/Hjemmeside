# GitHub Actions-workflows

Her ligger YAML-filerne, der bestemmer, hvornår automatiseringerne kører, og hvilke scripts de bruger.

## Workflows
- `update-chatbot-knowledge.yml`: bygger og validerer chatbotens vidensdatabase.
- `sync-onedrive-to-github.yml`: synkroniserer konfigurerede OneDrive-filer.
- `sync-Venteliste-Parkering-onedrive.yml`: synkroniserer parkeringsventelisten.
- `nemaffald-weekly.yml`: ugentlig NemAffald-automatisering.
- `update-geojson.yml`: opdaterer områdekortets GeoJSON-data.

## Vedligeholdelse
Kontrollér `on`, `permissions`, `concurrency`, secrets/variabler og de kaldte scripts, før et workflow ændres. Start workflows manuelt fra repositoryets **Actions**-fane, når `workflow_dispatch` er aktiveret.
