#!/usr/bin/env python3
"""Build a rich, source-grounded knowledge base for the website chatbot & AI assistant."""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "chatbot/config/knowledge-config.json"
OUTPUT = ROOT / "chatbot/data/knowledge.json"
RULES = ROOT / "chatbot/config/response-rules.json"

MODEL_PRIMARY = os.environ.get("GEMINI_MODEL", "gemini-4-hydrogen")
MODEL_FALLBACKS = [MODEL_PRIMARY, "gemini-3.1-flash-lite"]

# Domænespecifikke nøgleord som beriger chunks ud fra indhold, så både lokal søgning,
# RAG-udvælgelse og Actions-træning forstår hverdagsformuleringer og implicitte spørgsmål.
DOMAIN_SCENARIO_KEYWORDS: list[tuple[str, list[str]]] = [
    (
        r"forsyningsledninger|fællesinstallationer|faldstamm|stigstreng|hovedstig|forgrening",
        [
            "vandrør", "sprunget rør", "rørbrud", "rørskade", "vandskade", "lækage",
            "lodrette rør", "forgreninger", "badeværelse", "afløb", "fld", "døgnvagt",
        ],
    ),
    (
        r"vådrumsmembran|toiletter|vaske|vand- og gashaner|radiator|sanitet|armatur",
        [
            "vandskade", "badeværelse", "toilet løber", "drypper", "vandhane", "blandingsbatteri",
            "cisterne", "bruser", "radiatorventil", "utæt", "indvendig vedligeholdelse", "vvs",
        ],
    ),
    (
        r"fællesrum|fællesarealer|fællesejendom|cykler|cykelstativ|barnevogne",
        [
            "cykelkælder", "cykelkælderen", "cykelrum", "fællesejendom", "hvem ejer",
            "ejerskab", "opgang", "gårdareal", "haveanlæg", "ladcykel",
        ],
    ),
    (
        r"yderdøre|aflåst|låste døre|nøglebrik|nøglekort|adgangssystem|entredør|entrédøre|kælderdør|gadedør",
        [
            "ubudne gæster", "fremmede", "sikkerhed", "indbrud", "låse døre", "spærring",
            "mistet brik", "opgangsdør", "kælderdør",
        ],
    ),
    (
        r"udluftning|fugtdannelse|skimmel",
        [
            "lufte ud", "udluftning", "skimmelsvamp", "fugt", "fugtdannelse", "ventilation",
        ],
    ),
    (
        r"korttidsudlejning|udleje|fremleje|erhverv",
        [
            "airbnb", "ferieudlejning", "30 dage", "4 udlejninger", "udlejningsblanket",
            "lejekontrakt", "fremleje", "beboelse",
        ],
    ),
    (
        r"bygningsforsikring|protector|skadesanmeldelse|selvrisiko|indboforsikring",
        [
            "forsikring", "vandskade", "dækning", "policens vilkår", "deas", "anmeld skade",
        ],
    ),
]


class TextExtractor(HTMLParser):
    SKIP = {
        "script", "style", "noscript", "svg", "nav", "footer",
        "form", "button", "select", "textarea", "option",
    }

    def __init__(self) -> None:
        super().__init__()
        self.skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.SKIP:
            self.skip += 1
        elif tag in {"p", "h1", "h2", "h3", "h4", "li", "tr", "section", "article", "br", "div"} and not self.skip:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag in {"p", "h1", "h2", "h3", "h4", "li", "tr", "section", "article", "div"} and not self.skip:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip:
            self.parts.append(data)


def clean(text: str) -> str:
    text = html.unescape(text).replace("\r", "\n")
    text = re.sub(r"---\s*\n.*?\n---\s*", "", text, count=1, flags=re.S)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    return text.strip()


def clean_ui_noise(text: str) -> str:
    """Remove UI-only button labels or async loading placeholders from extracted HTML text."""
    noise_patterns = [
        r"\bIndlæser [^\n.!?]{0,60}…?",
        r"\bDin browser understøtter ikke videoafspilning\.?",
        r"\bBesøg hjemmeside\b",
        r"\bLog ind på [^\n]+",
        r"\bAnmeld skade\b",
        r"\bDownload vedtægter\b",
        r"\bSend e-mail\b",
        r"\bRing op\b",
    ]
    cleaned = text
    for pat in noise_patterns:
        cleaned = re.sub(pat, "", cleaned, flags=re.I)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()


def read_docx_stdlib(path: Path) -> str:
    """Fallback pure-Python DOCX reader using zipfile + XML when python-docx is unavailable."""
    with zipfile.ZipFile(path) as zf:
        xml_bytes = zf.read("word/document.xml")
    root = ET.fromstring(xml_bytes)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    paragraphs: list[str] = []
    for p in root.findall(".//w:p", ns):
        texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
        line = "".join(texts).strip()
        if line:
            paragraphs.append(line)
    return clean("\n".join(paragraphs))


def reconstruct_pdf_from_existing(rel: str) -> str:
    """Reconstruct ordered non-overlapping text from existing knowledge.json if PDF tools are absent."""
    if not OUTPUT.is_file():
        return ""
    try:
        existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
        docs = [
            d for d in existing.get("documents", [])
            if d.get("source", {}).get("file") == rel and d.get("content")
        ]
        if not docs:
            return ""
        last_page: int | None = None
        merged = ""
        for idx, doc in enumerate(docs):
            content = doc["content"]
            page = doc.get("page")
            if idx == 0:
                if page and not re.match(r"^\s*Side\s+\d+", content, re.I):
                    merged = f"Side {page}\n{content}"
                else:
                    merged = content
                last_page = page
                continue

            overlap = 0
            for k in range(min(300, len(merged), len(content)), 10, -1):
                if merged[-k:] == content[:k]:
                    overlap = k
                    break
            if overlap:
                merged += content[overlap:]
            else:
                page_prefix = f"\nSide {page}\n" if page and page != last_page else "\n"
                merged += page_prefix + content
            if page:
                last_page = page
        return clean(merged)
    except Exception:
        return ""


def read_source(path: Path, rel: str) -> tuple[str, list[str]]:
    suffix = path.suffix.lower()
    warnings: list[str] = []

    if suffix in {".html", ".htm"}:
        parser = TextExtractor()
        parser.feed(path.read_text(encoding="utf-8", errors="replace"))
        extracted = clean("\n".join(parser.parts))
        return clean_ui_noise(clean_price_placeholders(extracted)), warnings

    if suffix == ".md":
        return clean(path.read_text(encoding="utf-8", errors="replace")), warnings

    if suffix == ".pdf":
        pages: list[str] = []
        try:
            from pypdf import PdfReader  # type: ignore

            reader = PdfReader(str(path))
            for i, page in enumerate(reader.pages, 1):
                text = page.extract_text() or ""
                if text.strip():
                    pages.append(f"Side {i}\n{text}")
        except ImportError:
            if shutil.which("pdftotext"):
                res = subprocess.run(
                    ["pdftotext", str(path), "-"],
                    capture_output=True,
                    text=True,
                    check=False,
                )
                if res.returncode == 0 and res.stdout.strip():
                    pages.append(res.stdout)
            else:
                reconstructed = reconstruct_pdf_from_existing(rel)
                if reconstructed:
                    return reconstructed, warnings
                warnings.append("pypdf/pdftotext mangler i miljøet; PDF ikke genindekseret.")
                return "", warnings

        if not pages:
            if not (shutil.which("pdftoppm") and shutil.which("tesseract")):
                warnings.append("PDF'en er scannet og kræver pdftoppm + tesseract OCR. Den er ikke indekseret.")
            else:
                try:
                    with tempfile.TemporaryDirectory() as temp_dir:
                        prefix = str(Path(temp_dir) / "page")
                        subprocess.run(
                            ["pdftoppm", "-scale-to", "1000", "-jpeg", "-jpegopt", "quality=68", str(path), prefix],
                            check=True,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.PIPE,
                        )
                        images = sorted(Path(temp_dir).glob("page-*.jpg"))
                        for i, image_path in enumerate(images, 1):
                            result = subprocess.run(
                                ["tesseract", str(image_path), "stdout", "-l", "dan", "--psm", "4"],
                                check=True,
                                capture_output=True,
                                text=True,
                                env={**os.environ, "OMP_THREAD_LIMIT": "1"},
                            )
                            if result.stdout.strip():
                                pages.append(f"Side {i} (OCR)\n{result.stdout}")
                    if not pages:
                        warnings.append("OCR fandt ingen læsbar tekst i den scannede PDF.")
                except Exception as exc:
                    warnings.append(f"OCR af scannet PDF mislykkedes: {exc}")
        return clean("\n\n".join(pages)), warnings

    if suffix == ".docx":
        try:
            from docx import Document  # type: ignore

            doc = Document(str(path))
            parts = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    parts.append(" | ".join(cell.text for cell in row.cells))
            return clean("\n".join(parts)), warnings
        except ImportError:
            return read_docx_stdlib(path), warnings

    return "", [f"Filtypen {suffix} understøttes ikke."]


def word_boundary_tail(text: str, overlap: int) -> str:
    """Return an overlap tail that starts cleanly on a word/line boundary (never mid-word)."""
    if not overlap or len(text) <= overlap:
        return text
    candidate = text[-overlap:]
    m = re.search(r"[\s\n]+", candidate)
    if m and m.end() < len(candidate):
        return candidate[m.end():].strip()
    return ""


def chunks(text: str, size: int, overlap: int) -> list[str]:
    paragraphs = [p.strip() for p in text.splitlines() if p.strip()]
    assembled: list[str] = []
    current = ""
    for para in paragraphs:
        if len(para) > size:
            if current:
                assembled.append(current)
                current = ""
            words = para.split(" ")
            buf = ""
            for w in words:
                cand = f"{buf} {w}".strip() if buf else w
                if len(cand) > size and buf:
                    assembled.append(buf)
                    buf = w
                else:
                    buf = cand
            if buf:
                assembled.append(buf)
            continue

        candidate = f"{current}\n{para}" if current else para
        if len(candidate) > size and current:
            assembled.append(current)
            tail = word_boundary_tail(current, overlap)
            current = f"{tail}\n{para}".strip() if tail else para
        else:
            current = candidate
    if current:
        assembled.append(current)
    return [x for x in assembled if len(x) >= 35]


def clean_price_placeholders(value: str) -> str:
    value = re.sub(r"\bpt\.\s+Indlæser pris\s*…", "fastsat i det gældende prisblad", value)
    value = re.sub(r"\bpå\s+Indlæser pris\s*…\s*\(jf\.\s*det gældende prisblad\s*\)", "fastsat i det gældende prisblad", value)
    value = re.sub(r"Indlæser pris\s*…\s*\(jf\.\s*det gældende prisblad\s*\)", "fastsat i det gældende prisblad", value)
    value = re.sub(r"Indlæser pris\s*…", "fastsat i det gældende prisblad", value)
    return re.sub(r"\s+([.,:;?!])", r"\1", value)


def parse_vedtaegter(text: str) -> list[dict[str, Any]]:
    """Parse Vedtægter.pdf cleanly into one structured chunk per § paragraph."""
    lines = text.splitlines()
    page = 1
    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    footer_re = re.compile(r"^\s*Vedtægter for Ejerforeningen Skyttegårdsvej.*$", re.I)
    page_re = re.compile(r"^\s*Side\s+(\d+)\s*$", re.I)
    sec_re = re.compile(r"^\s*§\s*(\d{1,2})\.\s+([A-ZÆØÅ0-9].+)$")

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        pm = page_re.match(line)
        if pm:
            page = int(pm.group(1))
            continue
        if footer_re.match(line):
            continue

        sm = sec_re.match(line)
        if sm:
            sec_num = int(sm.group(1))
            sec_title = sm.group(2).strip()
            if current is not None and sec_num == current["section"] and re.match(r"^Stk\.\s*\d+\b", sec_title, re.I):
                current["content"] += "\n" + sec_title
                continue
            if current is not None:
                sections.append(current)
            current = {
                "section": sec_num,
                "page": page,
                "title": f"Vedtægter - § {sec_num}. {sec_title}",
                "content": f"§ {sec_num}. {sec_title}",
                "keywords": ["vedtægter", f"§ {sec_num}", sec_title.lower()],
            }
        elif current is not None:
            current["content"] += "\n" + line

    if current is not None:
        sections.append(current)

    # Split overly long § sections cleanly at Stk. boundaries
    final_sections: list[dict[str, Any]] = []
    for sec in sections:
        content = sec["content"]
        if len(content) <= 2400:
            final_sections.append(sec)
        else:
            stk_parts = re.split(r"(?=\nStk\.\s*\d+\.)", content)
            buf = ""
            part_idx = 1
            for sp in stk_parts:
                if buf and len(buf) + len(sp) > 2000:
                    final_sections.append({
                        **sec,
                        "title": f"{sec['title']} (del {part_idx})" if part_idx > 1 else sec["title"],
                        "content": buf.strip(),
                    })
                    buf = f"§ {sec['section']}. {sp.strip()}"
                    part_idx += 1
                else:
                    buf += sp
            if buf.strip():
                final_sections.append({
                    **sec,
                    "title": f"{sec['title']} (del {part_idx})" if part_idx > 1 else sec["title"],
                    "content": buf.strip(),
                })

    return [s for s in final_sections if len(s["content"]) >= 25]


def parse_kontakt_html(text: str) -> list[dict[str, Any]]:
    """Split kontakt/index.html into clean, complete contact sections without form/login noise."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    def slice_from_to(start_heading: str, stop_headings: set[str]) -> str:
        collected: list[str] = []
        active = False
        stops = {s.casefold() for s in stop_headings}
        for ln in lines:
            if not active:
                if ln.casefold() == start_heading.casefold():
                    active = True
                    collected.append(ln)
                continue
            if ln.casefold() in stops:
                break
            collected.append(ln)
        return re.sub(r"\s+", " ", " ".join(collected)).strip()

    sections_spec = [
        ("Kontakt - Bestyrelse & Administration (DEAS)", "Bestyrelsen", {"Bygningsforsikring", "Målere & Forbrug"}, ["bestyrelse", "bestyrelse@skyttegaardvej.dk", "deas", "sanw@deas.dk", "70 30 20 20", "administrator"], "board"),
        ("Kontakt - Forsikring & Skader (Protector Forsikring)", "Bygningsforsikring", {"Målere & Forbrug", "Forsyning"}, ["forsikring", "protector", "skade", "skadesanmeldelse", "selvrisiko", "bygningsforsikring", "indboforsikring"], "insurance"),
        ("Kontakt - Målere, Forsyning, VVS, Vaskeri, Rengøring & Parkering", "Målere & Forbrug", {"Login og digitale platforme"}, ["ista", "hofor", "fjernvarme", "drikkevand", "fiva", "vaskeri", "hebsoe", "rengøring", "fld", "vvs", "døgnvagt", "70 12 20 20", "dinparkering", "70 20 89 70"], "partners"),
        ("Kontakt - Beboerportaler & Digitale platforme", "Login og digitale platforme", set(), ["phm digital", "deas", "dinparkering", "beboerportal", "ttlock", "tapo", "parkeringstilladelse"], "portals"),
    ]

    result: list[dict[str, Any]] = []
    for title, start, stops, kws, topic in sections_spec:
        content = slice_from_to(start, stops)
        if content and len(content) >= 35:
            result.append({
                "title": title,
                "content": content,
                "keywords": kws,
                "topic": topic,
            })
    return result


def chunks_with_metadata(rel: str, text: str, size: int, overlap: int) -> list[dict[str, Any]]:
    """Bevar meningsfulde afsnit som selvstændige, søgbare kilder uden midt-ord-afskæring."""
    posix_rel = Path(rel).as_posix()
    lines = [line.strip() for line in text.splitlines()]

    def slice_between(start_marker: str, stop_markers: set[str]) -> str:
        collected: list[str] = []
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

    if posix_rel == "index.html":
        welcome = slice_between("Velkommen til Ejerforeningen", {"Bestyrelsen og hverdagen i ejendommen", "Nærområdet inden for 1,5 km"})
        board = slice_between("Bestyrelsen og hverdagen i ejendommen", {"Nærområdet inden for 1,5 km"})
        area = slice_between("Nærområdet inden for 1,5 km", set())
        res: list[dict[str, Any]] = []
        if welcome or board:
            res.append({
                "title": "Forside - Om Ejerforeningen Skyttegårdvej 1-11 Vigerslevvej 144-148",
                "content": " ".join(p for p in [welcome, board] if p),
                "keywords": ["ejerforening", "valby", "69 ejerlejligheder", "deas", "bestyrelse", "cykelkælder", "cykelparkering", "kælderrum", "gårdareal", "fællesarealer"],
                "topic": "overview",
            })
        if area:
            res.append({
                "title": "Forside - Nærområde, transport og indkøb i Valby",
                "content": area,
                "keywords": ["valby", "nærområde", "bus", "s-tog", "hvidovre", "danshøj", "indkøb", "skole", "vigerslevparken", "gadeparkering"],
                "topic": "area",
            })
        if res:
            return res

    if posix_rel == "noegler/index.html":
        cleaned = re.sub(r"\s+", " ", " ".join(l for l in lines if l and l != "Bestilling af nøglekort & nøglebrikker")).strip()
        if cleaned:
            return [{
                "title": "Nøglekort & nøglebrikker - bestilling, priser og sikkerhed",
                "content": clean_price_placeholders(cleaned),
                "keywords": ["nøglebrik", "nøglebrikker", "nøglekort", "adgang", "bestilling", "spærret", "mistet", "sikkerhed", "ubudne gæster", "deas"],
                "topic": "keys",
            }]

    if posix_rel == "kaelderrum/index.html":
        gen = slice_between("Generel information", {"Oversigt over kælderrum", "Henvendelse om kælderrum"})
        terms = slice_between("Lejevilkår & priser", {"Oversigt over kælderrum", "Henvendelse om kælderrum"})
        combined = " ".join(p for p in [gen, terms] if p) or clean_price_placeholders(re.sub(r"Oversigt over kælderrum.*", "", " ".join(l for l in lines if l), flags=re.S))
        if combined.strip():
            return [{
                "title": "Kælderrum - leje af ekstra kælderrum, venteliste og vilkår",
                "content": clean_price_placeholders(combined.strip()),
                "keywords": ["kælderrum", "kælder", "ekstra kælderrum", "leje", "venteliste", "opbevaring", "prisblad", "forsikring"],
                "topic": "storage",
            }]

    if posix_rel == "kontakt/index.html":
        parsed_kontakt = parse_kontakt_html(text)
        if parsed_kontakt:
            return parsed_kontakt

    if posix_rel == "parkering/index.html":
        general = slice_between("Generel information", {"Uretmæssig parkering", "Venteliste til parkering"})
        wrongful = slice_between("Uretmæssig parkering", {"Ring til DinParkering", "Kontakt bestyrelsen", "Venteliste til parkering"})
        result: list[dict[str, Any]] = []
        if general:
            result.append({
                "title": "Parkering - venteliste og generel information",
                "content": general,
                "keywords": ["parkering", "parkeringsplads", "venteliste", "skrive op", "bestyrelsen"],
                "topic": "waitlist",
            })
        if wrongful:
            result.append({
                "title": "Parkering - uretmæssig parkering",
                "content": wrongful,
                "keywords": ["parkering", "parkeringsplads", "uvedkommende", "dinparkering", "pladsnummer", "registreringsnummer"],
                "topic": "enforcement",
            })
        if general or wrongful:
            summary_parts = [p for p in [general, wrongful] if p]
            result.insert(0, {
                "title": "Parkering - overblik",
                "content": " ".join(summary_parts),
                "keywords": ["parkering", "parkeringspladser", "venteliste", "dinparkering", "bestyrelsen"],
                "topic": "overview",
            })
            prices = slice_between("Priser for parkeringsplads", {"Generel information", "Uretmæssig parkering", "Venteliste til parkering"})
            if prices:
                prices = re.sub(r"Indlæser pris\s*…", "fremgår af det gældende prisblad", prices)
                result.append({
                    "title": "Parkering - priser for bil og MC",
                    "content": prices,
                    "keywords": ["parkering", "pris", "priser", "bil", "motorcykel", "mc", "leje", "prisblad", "deas"],
                    "topic": "prices",
                })
            return result

    if posix_rel == "affald-storskrald/index.html":
        waste = clean_price_placeholders(slice_between("Affald og storskrald", {"Rengøring og udenomsarealer"}))
        cleaning = slice_between("Rengøring og udenomsarealer", {"Storskraldsrum", "Din browser understøtter ikke videoafspilning."})
        result = []
        if waste:
            result.append({
                "title": "Affald og storskrald - skralderum, storskraldsrum og miljøskab",
                "content": waste,
                "keywords": ["affald", "storskrald", "skralderum", "storskraldsrum", "miljøskab", "sortering", "genbrugsplads", "farligt affald", "rotter", "gebyr"],
                "topic": "waste",
            })
        if cleaning:
            result.append({
                "title": "Affald og udenomsarealer - rengøring (Hebsoe)",
                "content": cleaning,
                "keywords": ["rengøring", "hebsoe", "opgang", "fællesarealer", "græsslåning", "vicevært"],
                "topic": "cleaning",
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
                "topic": "meeting",
            })
        result.append({
            "title": "Generalforsamling - referater, regnskab, budget og prisblad",
            "content": " ".join(part for part in [
                "På generalforsamlingssiden findes officielle referater fra ordinære (GF) og ekstraordinære (XGF) generalforsamlinger samt årsregnskaber fra 1996 til i dag.",
                "Foreningens regnskabsår løber fra 1. januar til 31. december og revideres i samarbejde med DEAS.",
                budget,
                price_note,
            ] if part),
            "keywords": ["generalforsamling", "referat", "referater", "gf", "xgf", "regnskab", "årsregnskab", "budget", "driftsbudget", "fællesudgifter", "prisblad", "gebyr", "deas"],
            "topic": "finance",
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
                "topic": "airbnb",
            })
        if procedure:
            result.append({
                "title": "Udlejning - procedure, udlejningsblanket og navneskilte",
                "content": procedure,
                "keywords": ["udlejning", "udlejningsblanket", "blanket", "navneskilte", "dørtelefon", "postkasse", "bestyrelsen"],
                "topic": "procedure",
            })
        if conditions:
            result.append({
                "title": "Udlejning - betingelser, fremleje af værelser og ejers ansvar",
                "content": conditions,
                "keywords": ["udlejning", "fremleje", "værelser", "ejers ansvar", "husorden", "deas", "hæftelse"],
                "topic": "conditions",
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
                "keywords": ["vedligeholdelse", "indvendig", "vinduer", "døre", "gulve", "vægge", "elinstallationer", "rør", "forgrening", "forgreninger", "rørforgreninger", "sanitet", "radiatorer", "fld", "ista", "badeværelse", "toilet", "vandhane", "blandingsbatteri", "håndvask", "bruser", "cisterne", "afløb", "utæt", "vandskade", "vandrør"],
                "topic": "interior",
                "anchor": "indvendig",
            })
        if outside:
            result.append({
                "title": "Vedligeholdelse - udvendig og fælles vedligeholdelse (foreningen)",
                "content": outside,
                "keywords": ["vedligeholdelse", "udvendig", "murværk", "facader", "tag", "faldstammer", "fællesarealer", "opgange", "dørtelefoner", "hebsoe", "stigerør", "hovedstigstrenge", "forsyningslinjer", "lodrette", "forgrening", "cykelkælder", "cykelrum"],
                "topic": "exterior",
                "anchor": "udvendig",
            })
        if water:
            result.append({
                "title": "Vedligeholdelse - procedure for lukning af vand og akutte rørskader",
                "content": water,
                "keywords": ["vandlukning", "lukning af vand", "vvs", "fld", "døgnvagt", "rørbrud", "rørskade", "varslingsseddel", "akut", "sprunget", "vandrør", "sprunget rør", "afspærringshane", "lækage", "oversvømmelse", "vandskade", "vandudstrømning", "vand", "hovedhane", "forgreninger", "faldstammer"],
                "topic": "water",
                "anchor": "vandlukning",
            })
        if insurance:
            result.append({
                "title": "Vedligeholdelse - forsikring og anmeldelse af skader",
                "content": insurance,
                "keywords": ["forsikring", "bygningsforsikring", "indboforsikring", "protector", "skade", "skader", "skadesanmeldelse", "selvrisiko", "deas", "vandskade", "vandskader", "rørskade", "badeværelse", "policens vilkår", "forgreninger"],
                "topic": "insurance",
                "anchor": "forsikring",
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
                if current is not None:
                    sections.append(current)
                number = int(section_match.group(1))
                current = {
                    "section": number,
                    "page": page,
                    "title": f"Husorden - punkt {number}",
                    "content": line.strip(),
                    "keywords": ["husorden", f"punkt {number}"],
                }
            elif current is not None and line.strip():
                current["content"] += "\n" + line.strip()
        if current is not None:
            sections.append(current)
        if sections:
            return [x for x in sections if len(x["content"]) >= 20]

    if Path(rel).name.lower() in {"vedtægter.pdf", "vedtaegter.pdf"}:
        parsed_vedtaegter = parse_vedtaegter(text)
        if parsed_vedtaegter:
            return parsed_vedtaegter

    if posix_rel.endswith(".html"):
        text = clean_price_placeholders(text)
    return [{"content": x} for x in chunks(text, size, overlap)]


def title_for(rel: str, chunk: str) -> str:
    first = next((line.strip(" #•-–—") for line in chunk.splitlines() if line.strip()), Path(rel).stem)
    if len(first) < 4:
        return Path(rel).stem.capitalize()
    return first[:100]


def url_for(rel: str) -> str:
    if rel in {"index.html", "sidebar.html"}:
        return "/"
    p = Path(rel)
    if p.name == "index.html":
        return "/" + str(p.parent).replace("\\", "/") + "/"
    return "/" + rel


def category_for(rel: str) -> str:
    low = rel.lower()
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
        (("nyhed",), "nyheder"),
    ]:
        if any(key in low for key in keys):
            return category
    return "generelt"


def keywords_for(rel: str, chunk: str) -> list[str]:
    low = (rel + " " + chunk).lower()
    words = re.findall(r"[a-zæøå0-9]{3,}", low)
    stop = {
        "som", "der", "det", "den", "for", "med", "til", "eller",
        "ikke", "kan", "har", "fra", "ved", "under", "over", "samt",
        "html", "index", "pdf", "docx",
    }
    seen: list[str] = []
    for word in words:
        if word not in stop and word not in seen:
            seen.append(word)
        if len(seen) == 18:
            break

    # Berig med semantiske scenarie-nøgleord
    for pattern, extra in DOMAIN_SCENARIO_KEYWORDS:
        if re.search(pattern, low):
            for kw in extra:
                if kw not in seen:
                    seen.append(kw)
    return seen


def enrich_new_entries_with_gemini(entries: list[dict[str, Any]], existing_cache: dict[str, list[str]]) -> None:
    """Optionally enrich new/changed chunks with everyday Danish search tags via Gemini."""
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return

    needs_enrichment = [e for e in entries if e["id"] not in existing_cache]
    if not needs_enrichment:
        for e in entries:
            e["keywords"] = sorted(set(e["keywords"] + existing_cache.get(e["id"], [])))
        return

    # Process up to 35 chunks per run to stay fast & well within free-tier rate limits
    batch = needs_enrichment[:35]
    compact = [
        {"id": e["id"], "title": e["title"], "content": e["content"][:900]}
        for e in batch
    ]
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{
                "text": (
                    "Du er vidensarkitekt for en dansk ejerforening. Giv hvert dokumentafsnit 4-8 "
                    "hverdags-nøgleord eller typiske spørgsmålsord på dansk (f.eks. 'vandskade', "
                    "'cykelkælder', 'ubudne gæster', 'airbnb', 'sprunget rør'), som beboere ville "
                    "skrive, når de søger efter dette indhold. Returnér JSON.\n\n"
                    + json.dumps(compact, ensure_ascii=False)
                )
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "items": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "id": {"type": "STRING"},
                                "tags": {"type": "ARRAY", "items": {"type": "STRING"}},
                            },
                            "required": ["id", "tags"],
                        },
                    }
                },
                "required": ["items"],
            },
        },
    }

    for model in MODEL_FALLBACKS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "x-goog-api-key": key,
                "Content-Type": "application/json",
                "User-Agent": "aistudio-build",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(text)
            for item in parsed.get("items", []):
                doc_id = item.get("id")
                tags = [str(t).strip().lower() for t in item.get("tags", []) if str(t).strip()]
                if doc_id and tags:
                    existing_cache[doc_id] = tags
            print(f"Gemini ({model}) berigede {len(parsed.get('items', []))} vidensafsnit med semantiske tags.")
            break
        except Exception as exc:
            print(f"Advarsel: Semantisk berigelse med {model} fejlede ({exc}).", file=os.sys.stderr)

    for e in entries:
        extra = existing_cache.get(e["id"], [])
        if extra:
            e["keywords"] = sorted(set(e["keywords"] + extra))


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


def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    existing_tags: dict[str, list[str]] = {}
    if OUTPUT.is_file():
        try:
            prev = json.loads(OUTPUT.read_text(encoding="utf-8"))
            for d in prev.get("documents", []):
                if d.get("id") and d.get("keywords"):
                    existing_tags[d["id"]] = d["keywords"]
        except Exception:
            pass

    entries: list[dict[str, Any]] = []
    warnings: list[str] = []

    for rel in config["include"]:
        path = ROOT / rel
        if not path.is_file():
            warnings.append(f"Mangler: {rel}")
            continue
        try:
            text, file_warnings = read_source(path, rel)
        except Exception as exc:
            warnings.append(f"Kunne ikke læse {rel}: {exc}")
            continue
        warnings.extend(f"{rel}: {w}" for w in file_warnings)
        if not text:
            continue

        for index, part in enumerate(chunks_with_metadata(rel, text, config["chunk_chars"], config["overlap_chars"]), 1):
            chunk = part["content"]
            digest = hashlib.sha256(f"{rel}\0{index}\0{chunk}".encode()).hexdigest()[:16]
            entry: dict[str, Any] = {
                "id": digest,
                "title": part.get("title") or title_for(rel, chunk),
                "content": chunk,
                "source": {"file": rel, "url": url_for(rel)},
                "language": "da",
                "category": category_for(rel),
                "keywords": sorted(set(keywords_for(rel, chunk) + part.get("keywords", []))),
            }
            if part.get("section") is not None:
                entry["section"] = part["section"]
            if part.get("page") is not None:
                entry["page"] = part["page"]
            if part.get("topic") is not None:
                entry["topic"] = part["topic"]
            if part.get("anchor") is not None:
                entry["anchor"] = part["anchor"]
            entries.append(entry)

    enrich_new_entries_with_gemini(entries, existing_tags)
    prune_stale_response_rules(entries)

    payload = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_count": len(config["include"]),
        "chunk_count": len(entries),
        "documents": entries,
        "warnings": warnings,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Genereret {OUTPUT.relative_to(ROOT)} med {len(entries)} vidensafsnit.")
    for warning in warnings:
        print(f"ADVARSEL: {warning}")


if __name__ == "__main__":
    main()
