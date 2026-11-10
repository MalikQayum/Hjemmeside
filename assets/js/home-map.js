
/* Interactive circular area map for Ejerforeningen Skyttegård/Vigerslev.
   The full 1.5 km radius circle is fitted to the circular map viewport on load. */
(function () {
  "use strict";

  const mapElement = document.getElementById("home-area-map");
  if (!mapElement || typeof L === "undefined") return;

  const center = [55.6617458, 12.4828321];

  const categoryConfig = {
    association: { label: "Ejerforeningen", emoji: "🏠", color: "#b23b3b" },
    grocery: { label: "Dagligvarebutikker", emoji: "🛒", color: "#238b57" },
    school: { label: "Skoler", emoji: "🎓", color: "#8054a6" },
    bus: { label: "Busstoppesteder", emoji: "🚌", color: "#d77b22" },
    train: { label: "Togstationer", emoji: "🚉", color: "#2879b8" },
    parkingFree: { label: "Offentlig gadeparkering", emoji: "🅿️", color: "#248c88" },
    parkingLimited: { label: "Tidsbegrænset parkering", emoji: "⏱️", color: "#c28a24" },
    parkingPrivate: { label: "Privat parkering", emoji: "🔒", color: "#68717a" },
    center: { label: "Centrum", emoji: "📍", color: "#b23b3b" }
  };

  // Initialize the map without navigation or attribution controls.
  const map = L.map(mapElement, {
    scrollWheelZoom: false,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    zoomSnap: 0.1,
    preferCanvas: true
  }).setView(center, 12);

  // OpenStreetMap tiles.
  // Attribution is displayed separately below the map in the HTML.
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
  }).addTo(map);

  const overlays = {};
  const layerGroups = {};

  Object.keys(categoryConfig).forEach((key) => {
    layerGroups[key] = L.layerGroup().addTo(map);
    overlays[categoryConfig[key].label] = layerGroups[key];
  });

  function popupContent(properties) {
    const wrapper = document.createElement("div");

    const title = document.createElement("strong");
    title.className = "map-popup-title";
    title.textContent = properties.name || "Sted";
    wrapper.appendChild(title);

    if (properties.description) {
      const description = document.createElement("div");
      description.className = "map-popup-description";
      description.textContent = properties.description;
      wrapper.appendChild(description);
    }

    return wrapper;
  }

  function addPoint(feature) {
    const properties = feature.properties || {};
    const category = properties.category;

    const config = categoryConfig[category] || {
      emoji: "📍",
      color: "#536878"
    };

    const coordinates = feature.geometry.coordinates;
    const latLng = [coordinates[1], coordinates[0]];

    const icon = L.divIcon({
      className: "home-map-marker-wrapper",
      html:
        '<span class="home-map-emoji" style="background:' +
        config.color +
        '">' +
        config.emoji +
        "</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14]
    });

    L.marker(latLng, { icon })
      .bindPopup(popupContent(properties))
      .addTo(layerGroups[category] || layerGroups.center);
  }

  function addRadius(feature) {
    // Keep a reference to the actual 1.5 km radius polygon.
    // We fit the map to THIS layer, not to the marker groups.
    return L.geoJSON(feature, {
      style: {
        color: "#2676b8",
        weight: 2,
        opacity: 0.95,
        dashArray: "7 6",
        fillColor: "#5aa3d6",
        fillOpacity: 0.07
      }
    }).addTo(map);
  }

  fetch("/assets/data/ejerforeningen-omraadekort.geojson", {
    cache: "no-cache"
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Kortdata kunne ikke indlæses (" + response.status + ")."
        );
      }

      return response.json();
    })
    .then((data) => {
      let radiusLayer = null;

      data.features.forEach((feature) => {
        const geometryType = feature.geometry && feature.geometry.type;
        const category = feature.properties && feature.properties.category;

        if (category === "radiusCircle" && geometryType === "Polygon") {
          radiusLayer = addRadius(feature);
        } else if (geometryType === "Point") {
          addPoint(feature);
        }
      });

      // Category filters.
      L.control.layers(null, overlays, {
        collapsed: true,
        position: "topright"
      }).addTo(map);

      // Fit the actual 1.5 km radius polygon to the circular viewport.
      const fitRadiusToViewport = () => {
        map.invalidateSize({ pan: false });

        if (radiusLayer) {
          const radiusBounds = radiusLayer.getBounds();

          if (radiusBounds.isValid()) {
            map.fitBounds(radiusBounds, {
              padding: [0, 0],
              animate: false
            });
            return;
          }
        }

        map.setView(center, 13);
      };

      // Wait for the circular map container to finish rendering.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(fitRadiusToViewport);
      });
    })
    .catch((error) => {
      console.error("Områdekort:", error);

      mapElement.textContent =
        "Kortet kunne ikke indlæses. Kontrollér, at kortdatafilen ligger i assets/data/.";

      mapElement.classList.add("home-map-error");
    });
})();
