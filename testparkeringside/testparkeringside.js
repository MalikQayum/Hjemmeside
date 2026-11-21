(() => {
  "use strict";

  const tableWrap = document.getElementById("test-parking-table-wrap");
  const updatedLabel = document.getElementById("test-parking-updated");
  if (!tableWrap || !updatedLabel) return;

  // Brug GitHubs Contents API i stedet for raw.githubusercontent.com.
  // GitHubs raw-CDN kan vise en ældre fil efter et nyt commit, selv med cache-busting.
  const DATA_URL = "https://api.github.com/repos/Vigerslev-Skyttegard/bestyrelsen/contents/testparkeringside/data.json?ref=main";
  const GITHUB_API_VERSION = "2026-03-10";
  const COLUMNS = [
    { key: "address", label: "Adresse" },
    { key: "car", label: "Bil" },
    { key: "motorcycle", label: "MC / scooter" }
  ];

  function createCell(tagName, value) {
    const cell = document.createElement(tagName);
    cell.textContent = value || "";
    return cell;
  }

  function formatUpdatedAt(value) {
    if (!value) return "Ventelisten er endnu ikke opdateret via bestyrelsens administration.";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Testdata er opdateret.";
    return `Testdata senest opdateret ${new Intl.DateTimeFormat("da-DK", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(date)}.`;
  }

  function renderTable(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rows)) {
      throw new Error("Testdatafilen har ikke det forventede format.");
    }

    const table = document.createElement("table");
    table.className = "test-parking-table";
    const thead = document.createElement("thead");
    const headingRow = document.createElement("tr");
    COLUMNS.forEach((column) => headingRow.appendChild(createCell("th", column.label)));
    thead.appendChild(headingRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    if (data.rows.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = COLUMNS.length;
      cell.className = "test-parking-empty";
      cell.textContent = "Der er endnu ingen testposter.";
      row.appendChild(cell);
      tbody.appendChild(row);
    } else {
      data.rows.forEach((item) => {
        const row = document.createElement("tr");
        COLUMNS.forEach((column) => row.appendChild(createCell("td", String(item[column.key] ?? "").trim())));
        tbody.appendChild(row);
      });
    }

    table.appendChild(tbody);
    tableWrap.replaceChildren(table);
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
      throw new Error(`Testdata kunne ikke hentes (HTTP ${response.status}).`);
    }
    return response.json();
  }

  async function refreshData() {
    tableWrap.textContent = "Henter de nyeste testdata …";
    try {
      const data = await loadData();
      renderTable(data);
    } catch (error) {
      console.error("Testparkeringssiden kunne ikke indlæse data:", error);
      tableWrap.textContent = error.message || "Testdata kunne ikke indlæses. Kontrollér, at repositoryet bestyrelsen er offentligt, og at data.json ligger i roden.";
      updatedLabel.textContent = "Ingen data tilgængelige.";
    }
  }

  // Indlæs igen, når brugeren vender tilbage til fanen. Ingen konstant polling.
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
