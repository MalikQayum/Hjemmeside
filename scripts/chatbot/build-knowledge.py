#!/usr/bin/env python3
"""Build a public, allowlisted knowledge file for the website chatbot."""
from __future__ import annotations
import hashlib, html, json, re, sys, subprocess, tempfile, shutil, os
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "chatbot/config/knowledge-config.json"
OUTPUT = ROOT / "chatbot/data/knowledge.json"
RULES = ROOT / "chatbot/config/response-rules.json"

class TextExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "form", "button", "select", "textarea", "option"}
    def __init__(self):
        super().__init__(); self.skip = 0; self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP: self.skip += 1
        elif tag in {"p", "h1", "h2", "h3", "h4", "li", "tr", "section", "article", "br"} and not self.skip:
            self.parts.append("\n")
    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip: self.skip -= 1
        elif tag in {"p", "h1", "h2", "h3", "h4", "li", "tr", "section", "article"} and not self.skip:
            self.parts.append("\n")
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)

def clean(text: str) -> str:
    text = html.unescape(text).replace("\r", "\n")
    text = re.sub(r"---\s*\n.*?\n---\s*", "", text, count=1, flags=re.S) # Jekyll front matter
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()

def read_source(path: Path) -> tuple[str, list[str]]:
    suffix = path.suffix.lower(); warnings = []
    if suffix in {".html", ".htm"}:
        parser = TextExtractor(); parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        return clean("\n".join(parser.parts)), warnings
    if suffix == ".md":
        return clean(path.read_text(encoding="utf-8", errors="replace")), warnings
    if suffix == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(str(path)); pages = []
        for i, page in enumerate(reader.pages, 1):
            text = page.extract_text() or ""
            if text.strip(): pages.append(f"Side {i}\n{text}")
        if not pages:
            # Fallback til OCR for scannede PDF'er. GitHub Actions installerer værktøjerne.
            if not (shutil.which("pdftoppm") and shutil.which("tesseract")):
                warnings.append("PDF'en er scannet og kræver pdftoppm + tesseract OCR. Den er ikke indekseret.")
            else:
                try:
                    with tempfile.TemporaryDirectory() as temp_dir:
                        prefix = str(Path(temp_dir) / "page")
                        subprocess.run(["pdftoppm", "-scale-to", "1000", "-jpeg", "-jpegopt", "quality=68", str(path), prefix], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
                        images = sorted(Path(temp_dir).glob("page-*.jpg"))
                        for i, image_path in enumerate(images, 1):
                            result = subprocess.run(["tesseract", str(image_path), "stdout", "-l", "dan", "--psm", "4"], check=True, capture_output=True, text=True, env={**os.environ, "OMP_THREAD_LIMIT": "1"})
                            if result.stdout.strip(): pages.append(f"Side {i} (OCR)\n{result.stdout}")
                    if not pages: warnings.append("OCR fandt ingen læsbar tekst i den scannede PDF.")
                except Exception as exc:
                    warnings.append(f"OCR af scannet PDF mislykkedes: {exc}")
        return clean("\n\n".join(pages)), warnings
    if suffix == ".docx":
        from docx import Document
        doc = Document(str(path)); parts = [p.text for p in doc.paragraphs if p.text.strip()]
        for table in doc.tables:
            for row in table.rows: parts.append(" | ".join(cell.text for cell in row.cells))
        return clean("\n".join(parts)), warnings
    return "", [f"Filtypen {suffix} understøttes ikke."]

def chunks(text: str, size: int, overlap: int):
    paragraphs = [p.strip() for p in text.splitlines() if p.strip()]
    assembled, current = [], ""
    for para in paragraphs:
        if len(para) > size:
            if current: assembled.append(current); current = ""
            start = 0
            while start < len(para):
                assembled.append(para[start:start+size]); start += max(1, size-overlap)
            continue
        candidate = f"{current}\n{para}" if current else para
        if len(candidate) > size and current:
            assembled.append(current)
            tail = current[-overlap:] if overlap else ""
            current = f"{tail}\n{para}".strip()
        else: current = candidate
    if current: assembled.append(current)
    return [x for x in assembled if len(x) >= 35]

def main():
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    entries, warnings = [], []
    for rel in config["include"]:
        path = ROOT / rel
        if not path.is_file():
            warnings.append(f"Mangler: {rel}"); continue
        try: text, file_warnings = read_source(path)
        except Exception as exc:
            warnings.append(f"Kunne ikke læse {rel}: {exc}"); continue
        warnings.extend(f"{rel}: {w}" for w in file_warnings)
        if not text: continue
        for index, part in enumerate(chunks_with_metadata(rel, text, config["chunk_chars"], config["overlap_chars"]), 1):
            chunk = part["content"]
            digest = hashlib.sha256(f"{rel}\0{index}\0{chunk}".encode()).hexdigest()[:16]
            entry = {
                "id": digest,
                "title": part.get("title") or title_for(rel, chunk),
                "content": chunk,
                "source": {"file": rel, "url": url_for(rel)},
                "language": "da",
                "category": category_for(rel),
                "keywords": sorted(set(keywords_for(rel, chunk) + part.get("keywords", [])))
            }
            if part.get("section") is not None: entry["section"] = part["section"]
            if part.get("page") is not None: entry["page"] = part["page"]
            if part.get("topic") is not None: entry["topic"] = part["topic"]
            entries.append(entry)
    prune_stale_response_rules(entries)
    payload = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_count": len(config["include"]),
        "chunk_count": len(entries),
        "documents": entries,
        "warnings": warnings
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Genereret {OUTPUT.relative_to(ROOT)} med {len(entries)} vidensafsnit.")
    for warning in warnings: print(f"ADVARSEL: {warning}")

def prune_stale_response_rules(entries: list[dict[str, Any]]) -> None:
    if not RULES.is_file():
        return
    data = json.loads(RULES.read_text(encoding="utf-8"))
    rules = data.get("rules")
    if not isinstance(rules, list):
        raise RuntimeError("response-rules.json skal indeholde en rules-liste.")

    documents = {entry["id"]: entry for entry in entries}
    retained = [
        rule for rule in rules
        if (document := documents.get(rule.get("document_id")))
        and rule.get("source_file") == document["source"]["file"]
        and rule.get("source_url") == document["source"]["url"]
    ]
    removed = len(rules) - len(retained)
    if removed:
        data["rules"] = retained
        RULES.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Fjernede {removed} forældede chatbot-svarregler uden gyldig kilde.")

def chunks_with_metadata(rel: str, text: str, size: int, overlap: int):
    """Bevar meningsfulde afsnit som selvstændige, søgbare kilder."""
    if Path(rel).as_posix() == "parkering/index.html":
        lines = [line.strip() for line in text.splitlines()]

        def section_text(heading: str, stop_headings: set[str]) -> str:
            collected = []
            active = False
            for line in lines:
                if not active:
                    if line.casefold() == heading.casefold():
                        active = True
                    continue
                if line.casefold() in {item.casefold() for item in stop_headings}:
                    break
                if line:
                    collected.append(line)
            return re.sub(r"\s+", " ", " ".join(collected)).strip()

        general = section_text("Generel information", {"Uretmæssig parkering", "Venteliste til parkering"})
        wrongful = section_text("Uretmæssig parkering", {"Ring til DinParkering", "Kontakt bestyrelsen", "Venteliste til parkering"})
        result = []
        if general:
            result.append({
                "title": "Parkering - venteliste og generel information",
                "content": general,
                "keywords": ["parkering", "parkeringsplads", "venteliste", "skrive op", "bestyrelsen"],
                "topic": "waitlist"
            })
        if wrongful:
            result.append({
                "title": "Parkering - uretmæssig parkering",
                "content": wrongful,
                "keywords": ["parkering", "parkeringsplads", "uvedkommende", "dinparkering", "pladsnummer", "registreringsnummer"],
                "topic": "enforcement"
            })
        if general or wrongful:
            summary_parts = []
            if general:
                summary_parts.append(general)
            if wrongful:
                summary_parts.append(wrongful)
            result.insert(0, {
                "title": "Parkering - overblik",
                "content": " ".join(summary_parts),
                "keywords": ["parkering", "parkeringspladser", "venteliste", "dinparkering", "bestyrelsen"],
                "topic": "overview"
            })
            prices = section_text("Priser for parkeringsplads", {"Generel information", "Uretmæssig parkering", "Venteliste til parkering"})
            if prices:
                prices = re.sub(r"Indlæser pris\s*…", "fremgår af det gældende prisblad", prices)
                result.append({
                    "title": "Parkering - priser for bil og MC",
                    "content": prices,
                    "keywords": ["parkering", "pris", "priser", "bil", "motorcykel", "mc", "leje", "prisblad", "deas"],
                    "topic": "prices"
                })
            return result

    posix_rel = Path(rel).as_posix()
    lines = [line.strip() for line in text.splitlines()]

    def slice_between(start_marker: str, stop_markers: set[str]) -> str:
        collected = []
        active = False
        stop_folded = {item.casefold() for item in stop_markers}
        for line in lines:
            if not active:
                if line.casefold() == start_marker.casefold():
                    active = True
                continue
            if line.casefold() in stop_folded:
                break
            if line:
                collected.append(line)
        return re.sub(r"\s+", " ", " ".join(collected)).strip()

    def clean_price_placeholders(value: str) -> str:
        value = re.sub(r"\bpt\.\s+Indlæser pris\s*…", "fastsat i det gældende prisblad", value)
        value = re.sub(r"\bpå\s+Indlæser pris\s*…\s*\(jf\.\s*det gældende prisblad\s*\)", "fastsat i det gældende prisblad", value)
        value = re.sub(r"Indlæser pris\s*…\s*\(jf\.\s*det gældende prisblad\s*\)", "fastsat i det gældende prisblad", value)
        value = re.sub(r"Indlæser pris\s*…", "fastsat i det gældende prisblad", value)
        return re.sub(r"\s+([.,:;?!])", r"\1", value)

    if posix_rel == "affald-storskrald/index.html":
        waste = clean_price_placeholders(slice_between("Affald og storskrald", {"Rengøring og udenomsarealer"}))
        cleaning = slice_between("Rengøring og udenomsarealer", {"Storskraldsrum", "Din browser understøtter ikke videoafspilning."})
        result = []
        if waste:
            result.append({
                "title": "Affald og storskrald - skralderum, storskraldsrum og miljøskab",
                "content": waste,
                "keywords": ["affald", "storskrald", "skralderum", "storskraldsrum", "miljøskab", "sortering", "genbrugsplads", "farligt affald", "rotter", "gebyr"],
                "topic": "waste"
            })
        if cleaning:
            result.append({
                "title": "Affald og udenomsarealer - rengøring (Hebsoe)",
                "content": cleaning,
                "keywords": ["rengøring", "hebsoe", "opgang", "fællesarealer", "græsslåning", "vicevært"],
                "topic": "cleaning"
            })
        if result:
            return result

    if posix_rel == "generalforsamling/index.html":
        about_gf = slice_between("Om Generalforsamlingen", {"Seneste indkaldelser & Dagsorden"})
        agenda = slice_between("Seneste indkaldelser & Dagsorden", {"Indsend forslag", "Referater (GF & XGF)"})
        budget = slice_between("Budget", {"Gældende prisblad"})
        price_note = slice_between("Gældende prisblad", {"Prisbladet indlæses …"})
        result = []
        if about_gf or agenda:
            combined = " ".join(part for part in [about_gf, agenda] if part)
            result.append({
                "title": "Generalforsamling - indkaldelse, forslag, stemmeret og dagsorden",
                "content": combined,
                "keywords": ["generalforsamling", "indkaldelse", "varsel", "forslag", "stemmeret", "fuldmagt", "dagsorden", "bestyrelse"],
                "topic": "meeting"
            })
        result.append({
            "title": "Generalforsamling - referater, regnskab, budget og prisblad",
            "content": " ".join(part for part in [
                "På generalforsamlingssiden findes officielle referater fra ordinære (GF) og ekstraordinære (XGF) generalforsamlinger samt årsregnskaber fra 1996 til i dag.",
                "Foreningens regnskabsår løber fra 1. januar til 31. december og revideres i samarbejde med DEAS.",
                budget,
                price_note
            ] if part),
            "keywords": ["generalforsamling", "referat", "referater", "gf", "xgf", "regnskab", "årsregnskab", "budget", "driftsbudget", "fællesudgifter", "prisblad", "gebyr", "deas"],
            "topic": "finance"
        })
        return result

    if posix_rel == "udlejning/index.html":
        rules = slice_between("Hvad man ikke må: Airbnb, korttidsudlejning & erhverv", {"Procedure for udlejning"})
        procedure = slice_between("Procedure for udlejning", {"Betingelser & Ejers ansvar"})
        conditions = slice_between("Betingelser & Ejers ansvar", {"Udlejningsblanket"})
        procedure = clean_price_placeholders(procedure)
        result = []
        if rules:
            result.append({
                "title": "Udlejning - Airbnb, korttidsudlejning og forbud",
                "content": rules,
                "keywords": ["udlejning", "airbnb", "korttidsudlejning", "erhverv", "fremleje", "30 dage", "4 udlejninger", "tilladelse"],
                "topic": "airbnb"
            })
        if procedure:
            result.append({
                "title": "Udlejning - procedure, udlejningsblanket og navneskilte",
                "content": procedure,
                "keywords": ["udlejning", "udlejningsblanket", "blanket", "navneskilte", "dørtelefon", "postkasse", "bestyrelsen"],
                "topic": "procedure"
            })
        if conditions:
            result.append({
                "title": "Udlejning - betingelser, fremleje af værelser og ejers ansvar",
                "content": conditions,
                "keywords": ["udlejning", "fremleje", "værelser", "ejers ansvar", "husorden", "deas", "hæftelse"],
                "topic": "conditions"
            })
        if result:
            return result

    if posix_rel == "vedligeholdelse/index.html":
        inside = slice_between("Indvendig vedligeholdelse (Ejer)", {"Udvendig og fælles vedligehold (Foreningen)"})
        outside = slice_between("Udvendig og fælles vedligehold (Foreningen)", {"Procedure for lukning af vand"})
        water = slice_between("Procedure for lukning af vand", {"Forsikring og anmeldelse af skader"})
        insurance = clean_price_placeholders(slice_between("Forsikring og anmeldelse af skader", set()))
        inside = re.sub(r"\bEjerens eget ansvar\b|\bGå til kontaktkort \([^)]+\)|\bVVS \([^)]+\)|\bMålere & varme \([^)]+\)", "", inside)
        inside = re.sub(r"\s+", " ", inside).strip()
        outside = re.sub(r"\bBestyrelsens ansvar\b|\bGå til kontaktkort \([^)]+\)|\bKontakt Bestyrelsen\b|\bGå til Nøglebrikker\b", "", outside)
        outside = clean_price_placeholders(re.sub(r"\s+", " ", outside).strip())
        water = clean_price_placeholders(water)
        result = []
        if inside:
            result.append({
                "title": "Vedligeholdelse - indvendig vedligeholdelse (ejers ansvar)",
                "content": inside,
                "keywords": ["vedligeholdelse", "indvendig", "vinduer", "døre", "gulve", "vægge", "elinstallationer", "rør", "sanitet", "radiatorer", "fld", "ista"],
                "topic": "interior"
            })
        if outside:
            result.append({
                "title": "Vedligeholdelse - udvendig og fælles vedligeholdelse (foreningen)",
                "content": outside,
                "keywords": ["vedligeholdelse", "udvendig", "murværk", "facader", "tag", "faldstammer", "fællesarealer", "opgange", "dørtelefoner", "hebsoe"],
                "topic": "exterior"
            })
        if water:
            result.append({
                "title": "Vedligeholdelse - procedure for lukning af vand og akutte rørskader",
                "content": water,
                "keywords": ["vandlukning", "lukning af vand", "vvs", "fld", "døgnvagt", "rørbrud", "rørskade", "varslingsseddel"],
                "topic": "water"
            })
        if insurance:
            result.append({
                "title": "Vedligeholdelse - forsikring og anmeldelse af skader",
                "content": insurance,
                "keywords": ["forsikring", "bygningsforsikring", "indboforsikring", "protector", "skade", "skadesanmeldelse", "selvrisiko", "deas"],
                "topic": "insurance"
            })
        if result:
            return result

    if Path(rel).name.lower() == "husorden.pdf":
        page = 1
        sections = []
        current = None
        for line in text.splitlines():
            page_match = re.match(r"\s*Side\s+(\d+)", line, re.I)
            if page_match:
                page = int(page_match.group(1))
                continue
            section_match = re.match(r"\s*(\d{1,2})\.\s+(.+)", line)
            if section_match:
                if current is not None: sections.append(current)
                number = int(section_match.group(1))
                current = {"section": number, "page": page, "title": f"Husorden - punkt {number}", "content": line.strip(), "keywords": ["husorden", f"punkt {number}"]}
            elif current is not None and line.strip():
                current["content"] += "\n" + line.strip()
        if current is not None: sections.append(current)
        if sections:
            # Første dokumenttitel/indledning uden for et nummereret punkt udelades; hvert punkt står rent.
            return [x for x in sections if len(x["content"]) >= 20]
    if posix_rel.endswith(".html"):
        text = clean_price_placeholders(text)
    return [{"content": x} for x in chunks(text, size, overlap)]

def title_for(rel, chunk):
    first = next((line.strip(" #") for line in chunk.splitlines() if line.strip()), Path(rel).stem)
    return first[:100]
def url_for(rel):
    if rel == "index.html": return "/"
    if rel == "sidebar.html": return "/"
    p = Path(rel)
    if p.name == "index.html": return "/" + str(p.parent).replace("\\", "/") + "/"
    return "/" + rel

def category_for(rel):
    low = rel.lower()
    # Filnavnet bruger æ, mens interne kategorinøgler bruger ASCII. Begge former genkendes.
    for keys, category in [
        (("parkering",), "parkering"),
        (("husorden",), "husorden"),
        (("vedtaegter", "vedtægter"), "vedtaegter"),
        (("kaelderrum", "kælderrum"), "kaelderrum"),
        (("noegler", "noeglebrikker", "nøglebrikker"), "noeglebrikker"),
        (("kontakt",), "kontakt"),
        (("affald",), "affald"),
        (("generalforsamling",), "generalforsamling"),
        (("udlejning",), "udlejning"),
        (("vedligeholdelse",), "vedligeholdelse"),
        (("velkomstbrev",), "velkomst"),
        (("nyhed",), "nyheder")
    ]:
        if any(key in low for key in keys): return category
    return "generelt"
def keywords_for(rel, chunk):
    words = re.findall(r"[a-zæøå0-9]{3,}", (rel + " " + chunk).lower())
    stop = {"som", "der", "det", "den", "for", "med", "til", "eller", "ikke", "kan", "har", "fra", "ved", "under", "over", "samt"}
    seen = []
    for word in words:
        if word not in stop and word not in seen: seen.append(word)
        if len(seen) == 18: break
    return seen

if __name__ == "__main__": main()
