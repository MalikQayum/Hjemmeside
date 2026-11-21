# Generalforsamlingsdokumenter

Denne mappe samler dokumenter, der offentliggøres via siden `/generalforsamling/`.

- `referater/`: referater fra ordinære og ekstraordinære generalforsamlinger.
- `regnskab/`: regnskaber efter regnskabsår.
- Prisbladet ligger direkte i denne mappe.

Når dokumenter tilføjes, skal siden `/generalforsamling/` opdateres med deres præcise filsti. Bevar eksisterende filer som arkiv, og kontrollér år og dokumenttype ved nye links.

[Tilbage til dokumentarkivet](../README.md) · [Tilbage til repositoryoversigten](../../README.md)

## Gældende prisblad

Den aktuelle pristabel på `/generalforsamling/` hentes fra `generalforsamling/prisblad.json` i repositoryet `Vigerslev-Skyttegard/bestyrelsen`.

Bestyrelsen vedligeholder tabellen via administrationssiden `/bestyrelsen/`. Opdateringer gemmes gennem workflowet `.github/workflows/update-price-list.yml`, som kun skriver til prisbladets JSON-fil.

PDF-filen `prisblad-2026.pdf` bevares som historisk/underskrevet dokumentarkiv og er ikke længere hjemmesidens datakilde for de aktuelle priser.
