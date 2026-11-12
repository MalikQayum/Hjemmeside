#!/usr/bin/env python3
"""Build the public area-map GeoJSON from manual features and OpenStreetMap.

Manual features always win and are never removed by this script.
OpenStreetMap features are added for grocery stores, schools, bus stops and
railway stations within the configured radius.
"""
from __future__ import annotations

import json
import math
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MANUAL_FILE = ROOT / "assets/data/ejerforeningen-omraadekort-manual.geojson"
OUTPUT_FILE = ROOT / "assets/data/ejerforeningen-omraadekort.geojson"

CENTER_LAT = 55.6617458
CENTER_LON = 12.4828321
RADIUS_METERS = 1500

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
]

CATEGORY_LABELS = {
    "grocery": "Dagligvarebutikker",
    "school": "Skoler",
    "bus": "Busstoppesteder",
    "train": "Togstationer",
}

# Conservative distance thresholds. A close manual feature suppresses an
# automatic duplicate, but manual features themselves are never removed.
DEDUP_METERS = {
    "grocery": 35,
    "school": 60,
    "bus": 15,
    "train": 60,
}


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius = 6_371_000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * earth_radius * math.asin(math.sqrt(a))


def feature_point(feature: dict[str, Any]) -> tuple[float, float] | None:
    geometry = feature.get("geometry") or {}
    if geometry.get("type") != "Point":
        return None
    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        return None
    lon, lat = coordinates[0], coordinates[1]
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        return None
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    return float(lat), float(lon)


def load_manual() -> list[dict[str, Any]]:
    if not MANUAL_FILE.exists():
        raise RuntimeError(f"Den manuelle GeoJSON-fil mangler: {MANUAL_FILE}")
    data = json.loads(MANUAL_FILE.read_text(encoding="utf-8"))
    if data.get("type") != "FeatureCollection" or not isinstance(data.get("features"), list):
        raise RuntimeError("Den manuelle fil skal være en GeoJSON FeatureCollection.")
    for index, feature in enumerate(data["features"], start=1):
        if feature.get("type") != "Feature" or not isinstance(feature.get("geometry"), dict):
            raise RuntimeError(f"Ugyldig GeoJSON-feature nr. {index}.")
        feature.setdefault("properties", {})["source"] = "manual"
    return data["features"]


def overpass_query() -> str:
    area = f"(around:{RADIUS_METERS},{CENTER_LAT},{CENTER_LON})"
    return f"""[out:json][timeout:90];
(
  nwr{area}[shop~"^(supermarket|convenience)$"];
  nwr{area}[amenity=school];
  nwr{area}[highway=bus_stop];
  nwr{area}[public_transport=platform][bus=yes];
  nwr{area}[railway~"^(station|halt)$"];
  nwr{area}[public_transport=station];
);
out center tags;
"""


def fetch_overpass() -> list[dict[str, Any]]:
    query = overpass_query().encode("utf-8")
    last_error: Exception | None = None

    for endpoint in OVERPASS_ENDPOINTS:
        request = urllib.request.Request(
            endpoint,
            data=urllib.parse.urlencode({"data": query.decode("utf-8")}).encode("utf-8"),
            headers={
                "User-Agent": "SkyttegaardVigerslevAreaMap/1.0 (GitHub Actions)",
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            },
            method="POST",
        )
        for attempt in range(2):
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                elements = payload.get("elements")
                if not isinstance(elements, list) or not elements:
                    raise RuntimeError("OpenStreetMap returnerede ingen elementer.")
                return elements
            except Exception as exc:  # retry another public Overpass instance
                last_error = exc
                if attempt == 0:
                    time.sleep(3)
        print(f"Overpass-endpoint fejlede: {endpoint}: {last_error}", file=sys.stderr)

    raise RuntimeError(f"Kunne ikke hente data fra OpenStreetMap: {last_error}")


def classify(tags: dict[str, str]) -> str | None:
    if tags.get("amenity") == "school":
        return "school"
    if tags.get("highway") == "bus_stop":
        return "bus"
    if tags.get("public_transport") == "platform" and tags.get("bus") == "yes":
        return "bus"
    if tags.get("railway") in {"station", "halt"}:
        return "train"
    if tags.get("public_transport") == "station":
        # Avoid treating subway/metro stations as railway train stations.
        if tags.get("station") not in {"subway", "light_rail", "monorail"}:
            return "train"
    if tags.get("shop") in {"supermarket", "convenience"}:
        return "grocery"
    return None


def element_coordinates(element: dict[str, Any]) -> tuple[float, float] | None:
    if "lat" in element and "lon" in element:
        return float(element["lat"]), float(element["lon"])
    center = element.get("center") or {}
    if "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    return None


def to_feature(element: dict[str, Any]) -> dict[str, Any] | None:
    tags = element.get("tags") or {}
    category = classify(tags)
    point = element_coordinates(element)
    if not category or not point:
        return None

    lat, lon = point
    distance = haversine_m(CENTER_LAT, CENTER_LON, lat, lon)
    if distance > RADIUS_METERS:
        return None

    name = tags.get("name") or tags.get("brand") or tags.get("operator")
    if not name:
        # Unnamed platforms/stops are not useful as public map markers.
        return None

    address_parts = [
        tags.get("addr:street"),
        tags.get("addr:housenumber"),
        tags.get("addr:postcode"),
        tags.get("addr:city"),
    ]
    address = " ".join(part for part in address_parts if part)
    details = [CATEGORY_LABELS[category]]
    if address:
        details.append(f"Adresse: {address}")
    details.append(f"Afstand fra Vigerslevvej 144: ca. {round(distance)} m i luftlinje.")
    details.append("Kilde: OpenStreetMap.")
    details.append("https://www.openstreetmap.org/")
    osm_type = element.get("type")
    osm_id = element.get("id")

    return {
        "type": "Feature",
        "properties": {
            "name": name,
            "description": "\n".join(details),
            "category": category,
            "categoryLabel": CATEGORY_LABELS[category],
            "source": "openstreetmap",
            "osm_type": osm_type,
            "osm_id": osm_id,
            "osm_url": f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat],
        },
    }


def is_duplicate(candidate: dict[str, Any], existing: list[dict[str, Any]]) -> bool:
    category = candidate["properties"]["category"]
    candidate_point = feature_point(candidate)
    if not candidate_point:
        return False

    candidate_name = (candidate["properties"].get("name") or "").strip().casefold()
    threshold = DEDUP_METERS.get(category, 0)

    for item in existing:
        props = item.get("properties") or {}
        if props.get("category") != category:
            continue

        # Stable OSM identity prevents duplicate OSM elements.
        if (
            candidate["properties"].get("osm_type") == props.get("osm_type")
            and candidate["properties"].get("osm_id") == props.get("osm_id")
        ):
            return True

        existing_name = (props.get("name") or "").strip().casefold()
        if candidate_name and candidate_name == existing_name:
            return True

        existing_point = feature_point(item)
        if existing_point and threshold:
            distance = haversine_m(*candidate_point, *existing_point)
            if distance <= threshold:
                return True
    return False


def validate_feature_collection(features: list[dict[str, Any]]) -> None:
    if not features:
        raise RuntimeError("Resultatet er tomt; den eksisterende GeoJSON må ikke overskrives.")

    for index, feature in enumerate(features, start=1):
        if feature.get("type") != "Feature":
            raise RuntimeError(f"Feature nr. {index} har ugyldig type.")
        geometry = feature.get("geometry") or {}
        geometry_type = geometry.get("type")
        if geometry_type == "Point":
            if feature_point(feature) is None:
                raise RuntimeError(f"Feature nr. {index} har ugyldige punktkoordinater.")
        elif geometry_type == "Polygon":
            if not geometry.get("coordinates"):
                raise RuntimeError(f"Feature nr. {index} har ugyldig polygon.")
        else:
            raise RuntimeError(f"Feature nr. {index} har ikke understøttet geometri: {geometry_type}")


def main() -> None:
    manual_features = load_manual()
    osm_elements = fetch_overpass()

    automatic_features: list[dict[str, Any]] = []
    for element in osm_elements:
        feature = to_feature(element)
        if feature and not is_duplicate(feature, manual_features + automatic_features):
            automatic_features.append(feature)

    # Keep every manual feature first and unchanged apart from source=manual.
    all_features = manual_features + sorted(
        automatic_features,
        key=lambda item: (
            item["properties"]["category"],
            item["properties"]["name"].casefold(),
        ),
    )
    validate_feature_collection(all_features)

    output = {"type": "FeatureCollection", "features": all_features}
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = OUTPUT_FILE.with_suffix(".geojson.tmp")
    temporary_file.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    # Atomic replacement: a failed write cannot leave a partial public GeoJSON.
    temporary_file.replace(OUTPUT_FILE)

    counts: dict[str, int] = {}
    for feature in all_features:
        category = feature.get("properties", {}).get("category", "ukendt")
        counts[category] = counts.get(category, 0) + 1

    print(f"Manuelle features: {len(manual_features)}")
    print(f"Nye OpenStreetMap-features: {len(automatic_features)}")
    print(f"Samlet antal features: {len(all_features)}")
    print("Fordeling: " + json.dumps(counts, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
