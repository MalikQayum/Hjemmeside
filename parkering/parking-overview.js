/*
 * Venteliste til parkering på den offentlige parkeringsside.
 * Data hentes fra Vigerslev-Skyttegard/bestyrelsen/parkering/data.json.
 * Parkeringsoversigten bruger ikke Excel-filen.
 */
(() => {
  "use strict";

  const tableWrap = document.getElementById("parking-table-wrap");
  const updatedLabel = document.getElementById("parking-updated");
  if (!tableWrap || !updatedLabel) return;

  const DATA_URL = "https://api.github.com/repos/Vigerslev-Skyttegard/bestyrelsen/contents/parkering/data.json?ref=main";
  const GITHUB_API_VERSION = "2026-03-10";
  const EXPECTED_ROW_COUNT = 69;
  const CAPACITY = { car: 9, motorcycle: 2 };
  const COLUMNS = [
    { key: "address", label: "Adresse" },
    { key: "car", label: "Bil: Venteliste / p-plads" },
    { key: "motorcycle", label: "MC: Venteliste / p-plads" }
  ];

  function normalize(value) {
    return String(value ?? "").replace(/\u00a0/g, " ").trim().toLowerCase();
  }

  function isEmpty(value) {
    const text = normalize(value);
    return text === "" || text === "blank" || text === "1/0/00";
  }

  function isDanishRegistration(value) {
    return /^[A-ZÆØÅ]{2}\s?-?\s?\d{5}$/i.test(String(value ?? "").trim());
  }

  function isRealDate(day, month, year) {
    if (year < 100) year += year >= 50 ? 1900 : 2000;
    if (day < 1 || day > 31 || month < 1 || month > 12) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function isWaitlistDate(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
    if (!match) return false;
    const first = Number(match[1]);
    const second = Number(match[2]);
    const year = Number(match[3]);
    return isRealDate(first, second, year) || isRealDate(second, first, year);
  }

  function createCell(tagName, value, className = "") {
    const cell = document.createElement(tagName);
    cell.textContent = value || "";
    if (className) cell.className = className;
    return cell;
  }

  function classifyValue(value) {
    if (isEmpty(value)) return "";
    if (isDanishRegistration(value)) return "parking-cell-registration";
    if (isWaitlistDate(value)) return "parking-cell-date";
    return "";
  }

  function countParkingStatus(rows) {
    const registrations = { car: new Set(), motorcycle: new Set() };
    const waiting = { car: new Set(), motorcycle: new Set() };

    rows.forEach((item) => {
      ["car", "motorcycle"].forEach((key) => {
        const value = String(item[key] ?? "").trim();
        if (isEmpty(value)) return;
        if (isDanishRegistration(value)) {
          registrations[key].add(value.replace(/[\s-]/g, "").toUpperCase());
        } else {
          waiting[key].add(item.address);
        }
      });
    });

    return {
      car: {
        occupied: registrations.car.size,
        available: Math.max(0, CAPACITY.car - registrations.car.size),
        waiting: waiting.car.size
      },
      motorcycle: {
        occupied: registrations.motorcycle.size,
        available: Math.max(0, CAPACITY.motorcycle - registrations.motorcycle.size),
        waiting: waiting.motorcycle.size
      }
    };
  }

  function renderParkingStatus(rows) {
    const data = countParkingStatus(rows);
    const section = document.createElement("section");
    section.className = "parking-availability";
    section.id = "parking-availability";
    section.setAttribute("aria-label", "Parkeringsstatus");

    const grid = document.createElement("div");
    grid.className = "parking-status-grid";

    [
      { key: "car", title: "Bil" },
      { key: "motorcycle", title: "MC / scooter" }
    ].forEach(({ key, title }) => {
      const card = document.createElement("div");
      card.className = "parking-status-card";

      const heading = document.createElement("h4");
      heading.textContent = title;

      const available = document.createElement("div");
      available.className = "parking-status-available";
      available.append(document.createTextNode(String(data[key].available)));
      const capacity = document.createElement("span");
      capacity.textContent = ` / ${CAPACITY[key]}`;
      available.append(capacity);

      const availableLabel = document.createElement("p");
      availableLabel.textContent = "Ledige pladser";

      const waiting = document.createElement("div");
      waiting.className = "parking-status-waiting";
      const waitingCount = document.createElement("strong");
      waitingCount.textContent = String(data[key].waiting);
      const waitingLabel = document.createElement("span");
      waitingLabel.textContent = "På venteliste";
      waiting.append(waitingCount, waitingLabel);

      card.append(heading, available, availableLabel, waiting);
      grid.append(card);
    });

    section.append(grid);
    return section;
  }

  function formatUpdatedAt(value) {
    if (!value) return "Ventelisten er endnu ikke opdateret via bestyrelsens administration.";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Ventelisten er opdateret via bestyrelsens administration.";
    return `Ventelisten senest opdateret ${new Intl.DateTimeFormat("da-DK", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(date)}.`;
  }

  function validateData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rows)) {
      throw new Error("Datafilen har ikke det forventede format.");
    }
    if (data.rows.length !== EXPECTED_ROW_COUNT) {
      throw new Error(`Ventelisten skal indeholde ${EXPECTED_ROW_COUNT} faste adresser. Der blev fundet ${data.rows.length}.`);
    }
    data.rows.forEach((item, index) => {
      if (!item || typeof item.address !== "string" || !item.address.trim()) {
        throw new Error(`Adresse mangler på række ${index + 1}.`);
      }
    });
  }

  function renderTable(data) {
    validateData(data);

    const table = document.createElement("table");
    table.className = "parking-table";
    table.setAttribute("aria-label", "Venteliste til parkering");

    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    COLUMNS.forEach((column) => headingRow.appendChild(createCell("th", column.label)));
    thead.append(headingRow);

    const tbody = document.createElement("tbody");
    data.rows.forEach((item) => {
      const row = document.createElement("tr");
      COLUMNS.forEach((column) => {
        const value = String(item[column.key] ?? "").trim();
        const cell = createCell("td", isEmpty(value) ? "" : value, classifyValue(value));
        if (column.key !== "address" && !value) cell.classList.add("parking-empty-cell");
        row.append(cell);
      });
      tbody.append(row);
    });

    table.append(thead, tbody);
    tableWrap.replaceChildren(renderParkingStatus(data.rows), table);
    tableWrap.setAttribute("aria-busy", "false");
    updatedLabel.textContent = formatUpdatedAt(data.updatedAt);
  }

  async function loadData() {
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const url = `${DATA_URL}&_=${cacheBuster}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION
      },
      cache: "no-store"
    });

    if (!response.ok) {
      if (response.status === 403 && response.headers?.get("X-RateLimit-Remaining") === "0") {
        throw new Error("GitHubs offentlige API har midlertidigt nået sin grænse. Prøv igen om lidt.");
      }
      if (response.status === 404) {
        throw new Error("Parkeringsdata blev ikke fundet. Kontrollér, at repositoryet Vigerslev-Skyttegard/bestyrelsen er offentligt, og at parkering/data.json ligger på main.");
      }
      throw new Error(`Ventelisten kunne ikke hentes (HTTP ${response.status}).`);
    }

    return response.json();
  }

  async function refreshData() {
    tableWrap.setAttribute("aria-busy", "true");
    tableWrap.replaceChildren(Object.assign(document.createElement("p"), {
      textContent: "Henter den nyeste venteliste …"
    }));
    try {
      const data = await loadData();
      renderTable(data);
    } catch (error) {
      console.error("Parkeringssiden kunne ikke indlæse data:", error);
      const message = document.createElement("p");
      message.className = "parking-load-error";
      message.setAttribute("role", "alert");
      message.textContent = error.message || "Ventelisten kunne ikke indlæses. Prøv igen senere.";
      tableWrap.replaceChildren(message);
      tableWrap.setAttribute("aria-busy", "false");
      updatedLabel.textContent = "Ingen parkeringsdata tilgængelige.";
    }
  }

  let lastLoadedAt = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastLoadedAt > 15000) {
      lastLoadedAt = Date.now();
      refreshData();
    }
  });
  window.addEventListener("focus", () => {
    if (Date.now() - lastLoadedAt > 15000) {
      lastLoadedAt = Date.now();
      refreshData();
    }
  });

  refreshData();
})();
