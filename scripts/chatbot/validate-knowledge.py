#!/usr/bin/env python3
import json, sys
from pathlib import Path
p = Path(__file__).resolve().parents[2] / "chatbot/data/knowledge.json"
data = json.loads(p.read_text(encoding="utf-8"))
assert data.get("schema_version") == 1
assert isinstance(data.get("documents"), list)
ids = [item.get("id") for item in data["documents"]]
assert len(ids) == len(set(ids)), "Duplicate knowledge IDs"
for item in data["documents"]:
    assert item.get("content", "").strip(), f"Empty content: {item.get('id')}"
    assert item.get("source", {}).get("url"), f"Missing source URL: {item.get('id')}"
# Regressionstest: Husordenens punkt 6 skal være et selvstændigt, præcist kildeafsnit.
husdyr = [item for item in data["documents"] if item.get("source", {}).get("file") == "Husorden.pdf" and item.get("section") == 6]
assert len(husdyr) == 1, "Husordenens punkt 6 mangler eller findes flere gange"
assert husdyr[0].get("page") == 1, "Husordenens punkt 6 skal pege på side 1"
assert husdyr[0].get("content", "").strip() == "6. Det er ikke tilladt at holde husdyr.", "Husordenens punkt 6 er ikke isoleret korrekt"
# Nattero skal findes i husordenens punkt 7, så svaret ikke overser den sene aften.
stoej = [item for item in data["documents"] if item.get("source", {}).get("file") == "Husorden.pdf" and item.get("section") == 7]
assert len(stoej) == 1 and "nattero" in stoej[0].get("content", "").lower(), "Husordenens punkt 7 mangler omtalen af nattero"
# Parkeringssiden skal opdeles i korte emner uden kontaktformularens felter.
parking = [item for item in data["documents"] if item.get("source", {}).get("file") == "parkering/index.html"]
parking_topics = {item.get("topic") for item in parking}
assert {"overview", "waitlist", "enforcement"}.issubset(parking_topics), "Parkeringssiden mangler emneopdelte afsnit"
for item in parking:
    content = item.get("content", "").lower()
    assert not any(noise in content for noise in ["adresse *", "e-mail *", "besked (valgfrit)", "send henvendelse"]), "Kontaktformular blev indekseret som chatbotviden"
print(f"Vidensdatabase OK: {len(ids)} afsnit. Husdyr, nattero og parkering er kontrolleret.")
if data.get("warnings"):
    print(f"Advarsler: {len(data['warnings'])}")
