# Dokumentarkiv (`/dokumenter/`)

Denne mappe indeholder ejerforeningens samlede arkiv af officielle PDF- og Word-dokumenter, som stilles til rådighed for beboere, ejere og revisorer på hjemmesiden.

Dokumenterne er statiske webressourcer, som kan åbnes direkte i browseren eller downloades via deres relative URL'er.

---

## Mappestruktur

### 1. `forening/` - Foreningsdokumenter
- Indeholder overordnede foreningsdokumenter og historiske vedtægtsfiler (f.eks. `fiva-vedtaegter-2012.doc` og `ny-vedtaegter.pdf`).
- *Bemærk:* De gældende autoritative versioner af vedtægterne og husordenen ligger i repository-roden som `Vedtægter.pdf` og `Husorden.pdf` til visning via PDF.js.

### 2. `generalforsamling/` - Generalforsamlingsarkiv
Dokumenter tilknyttet ejerforeningens årlige og ekstraordinære generalforsamlinger på `/generalforsamling/`:
- **`referater/`:** PDF-referater fra alle afholdte generalforsamlinger fra 2022 og frem. Standardiseret filnavn: `YYYY-gf-referat.pdf` (eller `YYYY-xgf-referat.pdf`).
- **`regnskab/`:** Godkendte og reviderede årsregnskaber fra 1996 til i dag. Standardiseret filnavn: `YYYY-regnskab.pdf` eller `YYYY-YYYY-regnskab.pdf`.
- **`prisblad-2026.pdf`:** Historisk udgave af prisbladet. Den aktuelle og gældende pristabel på hjemmesiden indlæses dynamisk fra `Vigerslev-Skyttegard/bestyrelsen/generalforsamling/prisblad.json`.

### 3. `udlejning/` - Udlejningsblanketter
Dokumenter tilknyttet udlejningssiden på `/udlejning/`:
- **`udlejningsblanket.pdf`:** Officiel udlejningsblanket i PDF-format til udskrivning eller gennemsyn.
- **`udlejningsblanket.docx`:** Officiel udlejningsblanket i Microsoft Word-format til digital udfyldelse på computer.

---

## Retningslinjer for dokumenthåndtering

1. **Versions- og årstalsangivelse:** Bevar altid årstal og mødetype i filnavne for at sikre entydige URL'er og undgå cache-konflikter i browseren.
2. **Korrekt linkning:** Ved tilføjelse af nye dokumenter skal de tilhørende HTML-sider opdateres med de præcise filstier.
3. **Privatliv og GDPR:** Offentliggør aldrig dokumenter med følsomme eller fortrolige personoplysninger (f.eks. personnumre eller personlige tvister), som ikke må være offentligt tilgængelige.

[Tilbage til repositoryoversigten](../README.md)

