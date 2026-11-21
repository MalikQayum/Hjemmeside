(() => {
  "use strict";

  const OWNER = "Vigerslev-Skyttegard";
  const REPOSITORY = "bestyrelsen";
  const BRANCH = "main";
  const API_VERSION = "2026-03-10";
  const API_ROOT = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents`;
  const ROOMS_PATH = "kaelderrum/data.json";
  const PRICES_PATH = "generalforsamling/prisblad.json";
  const CELLAR_PRICE_ID = "price-008";
  const body = document.getElementById("kaelderrum-live-rows");
  const status = document.getElementById("kaelderrum-live-status");
  if (!body || !status) return;

  const EXPECTED_ROOMS = [[1, 3], [2, 8], [3, 20], [12, 14], [33, 4], [45, 25], [55, 13], [68, 13], [69, 25], [78, 27], [80, 11]];

  async function fetchJson(path) {
    const url = `${API_ROOT}/${path}?ref=${encodeURIComponent(BRANCH)}&_=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": API_VERSION },
      cache: "no-store"
    });
    if (!response.ok) {
      if (response.status === 403 && response.headers?.get("X-RateLimit-Remaining") === "0") {
        throw new Error("GitHubs offentlige API har midlertidigt nået sin forespørgselsgrænse.");
      }
      throw new Error(`Data kunne ikke indlæses (HTTP ${response.status}).`);
    }
    return response.json();
  }

  function validateRooms(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rooms) || data.rooms.length !== EXPECTED_ROOMS.length) {
      throw new Error("Kælderrumsdataene har et ugyldigt format.");
    }
    return data.rooms.map((room, index) => {
      const [expectedNumber, expectedArea] = EXPECTED_ROOMS[index];
      if (!room || room.roomNumber !== expectedNumber || room.id !== `room-${String(expectedNumber).padStart(3, "0")}`) {
        throw new Error("Kælderrumslisten mangler et lokale eller har en forkert rækkefølge.");
      }
      if (typeof room.tenantAddress !== "string" || room.tenantAddress.length > 120) {
        throw new Error(`Lejeradressen for lokale ${expectedNumber} er ugyldig.`);
      }
      if (room.areaM2 !== expectedArea) {
        throw new Error(`Størrelsen på lokale ${expectedNumber} er låst til ${expectedArea} m².`);
      }
      return room;
    });
  }

  function validatePrice(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rows)) throw new Error("Prisbladet har et ugyldigt format.");
    const row = data.rows.find((item) => item && item.id === CELLAR_PRICE_ID);
    if (!row || !Number.isInteger(row.amount) || row.amount < 0) {
      throw new Error("Kvadratmeterprisen for kælderrum mangler i prisbladet. Bestyrelsen skal gemme prisposten 'Leje af kælderrum'.");
    }
    return row.amount;
  }

  function formatMoney(amount) {
    return `${new Intl.NumberFormat("da-DK", { maximumFractionDigits: 2 }).format(amount)} kr.`;
  }

  function render(rooms, ratePerM2) {
    const fragment = document.createDocumentFragment();
    rooms.forEach((room) => {
      const rented = room.tenantAddress.trim().length > 0;
      const tr = document.createElement("tr");
      const values = [String(room.roomNumber), room.tenantAddress.trim() || "—", `${new Intl.NumberFormat("da-DK", { maximumFractionDigits: 2 }).format(room.areaM2)} m²`, formatMoney(room.areaM2 * ratePerM2)];
      values.forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = value;
        if (index === 3) td.className = "kaelderrum-live-rent";
        tr.appendChild(td);
      });
      const statusCell = document.createElement("td");
      const pill = document.createElement("span");
      pill.className = `kaelderrum-live-status-pill ${rented ? "is-rented" : "is-available"}`;
      pill.textContent = rented ? "Udlejet" : "Ledigt";
      statusCell.appendChild(pill);
      tr.appendChild(statusCell);
      fragment.appendChild(tr);
    });
    body.replaceChildren(fragment);
  }

  async function init() {
    try {
      status.textContent = "Henter kælderrum og gældende m²-pris …";
      const [roomsData, priceData] = await Promise.all([fetchJson(ROOMS_PATH), fetchJson(PRICES_PATH)]);
      const rooms = validateRooms(roomsData);
      const ratePerM2 = validatePrice(priceData);
      render(rooms, ratePerM2);
      const count = rooms.filter((room) => room.tenantAddress.trim()).length;
      status.textContent = `Oversigten viser ${rooms.length} kælderrum. ${count} er udlejet og ${rooms.length - count} er ledige. Lejen beregnes med ${formatMoney(ratePerM2)} pr. m² pr. måned.`;
    } catch (error) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.textContent = "Kælderrumsoversigten kan ikke indlæses lige nu. Prøv igen senere.";
      tr.appendChild(td);
      body.replaceChildren(tr);
      status.textContent = error.message || "Kælderrumsoversigten kunne ikke indlæses.";
      status.classList.add("is-error");
    }
  }

  init();
})();
