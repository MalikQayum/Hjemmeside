(() => {
  "use strict";

  const OWNER = "Vigerslev-Skyttegard";
  const REPOSITORY = "bestyrelsen";
  const BRANCH = "main";
  const API_VERSION = "2026-03-10";
  const DATA_URL = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/contents/generalforsamling/prisblad.json?ref=${encodeURIComponent(BRANCH)}`;

  const priceElements = Array.from(document.querySelectorAll("[data-price-id]"));
  const unitPriceElements = Array.from(document.querySelectorAll("[data-price-unit-id]"));
  if (!priceElements.length && !unitPriceElements.length) return;

  function formatAmount(value) {
    return new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(value);
  }

  function formatPrice(row, format) {
    const amount = formatAmount(row.amount);
    if (format === "kr-dash") return `kr. ${amount},-`;
    if (format === "amount") return amount;
    return `${amount} kr.`;
  }

  function validate(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.rows)) {
      throw new Error("Prisbladet har et ugyldigt dataformat.");
    }
    if (data.rows.length < 1 || data.rows.length > 100) {
      throw new Error("Prisbladet har et ugyldigt antal priser.");
    }

    const byId = new Map();
    data.rows.forEach((row) => {
      if (!row || typeof row.id !== "string" || byId.has(row.id)) {
        throw new Error("Prisbladet indeholder en ugyldig række.");
      }
      if (!Number.isInteger(row.amount) || row.amount < 0 || row.amount > 1000000) {
        throw new Error("Prisbladet indeholder et ugyldigt beløb.");
      }
      byId.set(row.id, row);
    });
    return byId;
  }

  function setPriceLoadError(message) {
    priceElements.forEach((element) => {
      element.textContent = "Pris ikke tilgængelig";
    });
    unitPriceElements.forEach((element) => {
      element.dataset.priceReady = "false";
    });
    document.dispatchEvent(new CustomEvent("efo:prices-error", { detail: { message } }));
  }

  async function loadPrices() {
    try {
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
        throw new Error(`Prisbladet kunne ikke hentes (HTTP ${response.status}).`);
      }

      const data = await response.json();
      const byId = validate(data);
      const requiredIds = new Set([
        ...priceElements.map((element) => element.dataset.priceId),
        ...unitPriceElements.map((element) => element.dataset.priceUnitId)
      ]);
      for (const id of requiredIds) {
        if (!byId.has(id)) throw new Error(`Prisbladet mangler prisposten ${id}.`);
      }

      priceElements.forEach((element) => {
        const row = byId.get(element.dataset.priceId);
        if (!row) {
          element.textContent = "Pris ikke tilgængelig";
          return;
        }
        element.textContent = formatPrice(row, element.dataset.priceFormat || "currency");
      });

      unitPriceElements.forEach((element) => {
        const row = byId.get(element.dataset.priceUnitId);
        if (!row) {
          element.dataset.priceReady = "false";
          return;
        }
        element.dataset.unitPrice = String(row.amount);
        element.dataset.priceReady = "true";
      });

      document.dispatchEvent(new CustomEvent("efo:prices-loaded", {
        detail: { updatedAt: data.updatedAt || null }
      }));
    } catch (error) {
      setPriceLoadError(error?.message || "Prisbladet kunne ikke indlæses.");
    }
  }

  loadPrices();
})();
