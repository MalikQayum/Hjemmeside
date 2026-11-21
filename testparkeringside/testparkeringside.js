(() => {
  "use strict";

  const tableWrap = document.getElementById("test-parking-table-wrap");
  const updatedLabel = document.getElementById("test-parking-updated");
  if (!tableWrap || !updatedLabel) return;

  // Data hentes fra det separate, offentlige repository Vigerslev-Skyttegard/bestyrelsen.
  const DATA_URL = "https://raw.githubusercontent.com/Vigerslev-Skyttegard/bestyrelsen/main/testparkeringside/data.json";
  const COLUMNS = [
    { key: "address", label: "Adresse" },
    { key: "car", label: "Bil" },
    { key: "motorcycle", label: "MC / scooter" }
  ];

  function createCell(tagName, value) {
    const cell = document.createElement(tagName);
    cell.textContent = value || "—";
    return cell;
  }

  function formatUpdatedAt(value) {
    if (!value) return "Eksempeldata – ikke en rigtig venteliste.";
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
    const response = await fetch(`${DATA_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Testdata kunne ikke hentes (HTTP ${response.status}).`);
    return response.json();
  }

  loadData()
    .then(renderTable)
    .catch((error) => {
      console.error("Testparkeringssiden kunne ikke indlæse data:", error);
      tableWrap.textContent = "Testdata kunne ikke indlæses. Kontrollér, at repositoryet bestyrelsen er offentligt, og at data.json ligger i roden.";
      updatedLabel.textContent = "Ingen data tilgængelige.";
    });
})();
