(() => {
  "use strict";

  const OWNER = "Vigerslev-Skyttegard";
  const REPOSITORY = "bestyrelsen";
  const BRANCH = "main";
  const API_VERSION = "2026-03-10";
  const DATA_URL = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/generalforsamling/prisblad.json?ref=${encodeURIComponent(BRANCH)}`;
  const tableBody = document.getElementById("price-table-body");
  const updatedLabel = document.getElementById("price-last-updated");

  function formatPrice(row) {
    const amount = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(row.amount);
    return `Kr. ${amount},-${row.unit ? ` ${row.unit}` : ""}`;
  }

  function validatePriceData(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rows)) throw new Error("Prisbladet har et ugyldigt dataformat.");
    if (data.rows.length < 1 || data.rows.length > 100) throw new Error("Prisbladet har et ugyldigt antal ydelser.");
    const ids = new Set();
    data.rows.forEach((row) => {
      if (!row || typeof row.id !== "string" || ids.has(row.id)) throw new Error("Prisbladet indeholder en ugyldig række.");
      if (typeof row.title !== "string" || !row.title.trim() || row.title.length > 160) throw new Error("En ydelse mangler en gyldig titel.");
      if (typeof row.description !== "string" || row.description.length > 400) throw new Error("En prisbeskrivelse har et ugyldigt format.");
      if (!Number.isInteger(row.amount) || row.amount < 0 || row.amount > 1000000) throw new Error("En pris har et ugyldigt beløb.");
      if (typeof row.unit !== "string" || row.unit.length > 40) throw new Error("En pris har en ugyldig enhed.");
      ids.add(row.id);
    });
  }

  async function loadPriceList() {
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await fetch(`${DATA_URL}&_=${cacheBuster}`, {
      headers: {
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": API_VERSION
      },
      cache: "no-store"
    });
    if (!response.ok) {
      if (response.status === 403 && response.headers?.get("X-RateLimit-Remaining") === "0") {
        throw new Error("GitHubs offentlige API har midlertidigt nået sin grænse.");
      }
      throw new Error(`Prisbladet kunne ikke indlæses (HTTP ${response.status}).`);
    }
    const data = await response.json();
    validatePriceData(data);
    return data;
  }

  function render(data) {
    const fragment = document.createDocumentFragment();
    data.rows.forEach((item) => {
      const tr = document.createElement("tr");
      const descriptionCell = document.createElement("td");
      const title = document.createElement("strong");
      title.textContent = item.title;
      descriptionCell.appendChild(title);
      if (item.description) {
        const description = document.createElement("div");
        description.style.fontSize = "0.85em";
        description.style.color = "#64748b";
        description.textContent = item.description;
        descriptionCell.appendChild(description);
      }
      const amount = document.createElement("td");
      amount.className = "price-amount";
      amount.textContent = formatPrice(item);
      tr.append(descriptionCell, amount);
      fragment.appendChild(tr);
    });
    tableBody.replaceChildren(fragment);
    if (data.updatedAt && updatedLabel) {
      const date = new Date(data.updatedAt);
      const formatted = Number.isNaN(date.getTime())
        ? ""
        : new Intl.DateTimeFormat("da-DK", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Copenhagen" }).format(date);
      updatedLabel.textContent = formatted ? `Senest opdateret ${formatted}.` : "Prisbladet vedligeholdes af bestyrelsen.";
    } else if (updatedLabel) {
      updatedLabel.textContent = "Prisbladet vedligeholdes af bestyrelsen.";
    }
  }

  loadPriceList()
    .then(render)
    .catch((error) => {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 2;
      cell.textContent = "Prisbladet kunne ikke indlæses lige nu. Prøv at genindlæse siden senere.";
      row.appendChild(cell);
      tableBody.replaceChildren(row);
      if (updatedLabel) updatedLabel.textContent = error.message || "Prisbladet kunne ikke indlæses.";
    });
})();
