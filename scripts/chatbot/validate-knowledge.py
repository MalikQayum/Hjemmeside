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
print(f"Vidensdatabase OK: {len(ids)} afsnit.")
if data.get("warnings"):
    print(f"Advarsler: {len(data['warnings'])}")
