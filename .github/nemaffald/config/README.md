# NemAffald - konfiguration

Indeholder konfigurationsfiler, som styrer NemAffald-projektets lokale eller GitHub-baserede opsætning.

- `settings.example.json`: eksempel på konfiguration og struktur. Brug den som udgangspunkt.
- `settings.github.json`: konfiguration beregnet til GitHub-miljøet. Kontrollér indholdet for følsomme oplysninger, før filen deles eller ændres.

## Vedligeholdelse

Brug `settings.example.json` som skabelon ved lokal opsætning. `settings.github.json` indeholder den ikke-hemmelige runtime-konfiguration, som workflowet klargør. Scriptet `scripts/prepare-github-config.js` skriver `settings.json` og `contact.json` under kørslen; de genererede filer indeholder runtime-data og må ikke committes.

Kontaktprofilen til GitHub-workflowet leveres som repository-secret `NEMAFFALD_CONTACT_JSON`, ikke fra en versionsstyret fil. Ændr kun oplysningerne, når de er verificeret og godkendt, og behold bekræftelser for rollen som affaldsansvarlig og samtykke til huskning. Scriptet validerer desuden, at ejendomsadresse og ugetidspunkt svarer til workflowets forventninger.

Adgangskoder og tokens skal ligge i GitHub Secrets eller lokale miljøvariabler - ikke i versionsstyrede konfigurationsfiler.

[Tilbage til repositoryoversigten](../../../README.md)
