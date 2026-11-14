/* =========================================================
   Parkeringsventeliste – visuel markering af celler
   - Nummerplader: grøn
   - Gyldige datoer: blå
   - 1/0/00 og "blank": vises som tomme celler
   - Øvrige værdier ændres ikke
   ========================================================= */

(() => {
  "use strict";

  const CONTAINER_ID = "excel-viewer";
  const PROCESSED_ATTRIBUTE = "data-parking-cell-processed";

  function normalize(value) {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .trim()
      .toLowerCase();
  }

  function isEmptyPlaceholder(value) {
    const text = normalize(value);
    return text === "" || text === "blank" || text === "1/0/00";
  }

  // Danske nummerplader: typisk to bogstaver efterfulgt af fem cifre.
  // Mellemrum og bindestreg accepteres også.
  function isDanishRegistration(value) {
    const text = String(value ?? "").trim().toUpperCase();
    return /^[A-ZÆØÅ]{2}\s?-?\s?\d{5}$/.test(text);
  }
  
  function isValidDate(value) {
  const text = String(value ?? "").trim();

  // Genkend datoformater fra Excel/HTML:
  // DD/MM/YY, MM/DD/YY, DD.MM.YYYY og DD-MM-YYYY.
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!match) return false;

  const first = Number(match[1]);
  const second = Number(match[2]);
  let year = Number(match[3]);

  // Den særlige Excel-fejlværdi håndteres separat.
  if (first === 1 && second === 0 && year === 0) return false;

  if (year < 100) year += year >= 50 ? 1900 : 2000;

  function isRealDate(day, month) {
    if (day < 1 || day > 31 || month < 1 || month > 12) {
      return false;
    }

    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day;
  }

  // Prøv både DD/MM/YY og MM/DD/YY.
  return isRealDate(first, second) || isRealDate(second, first);
}

  function addStyles() {
    if (document.getElementById("parking-waitlist-styles")) return;

    const style = document.createElement("style");
    style.id = "parking-waitlist-styles";
    style.textContent = `
      #${CONTAINER_ID} td.parking-cell-registration {
        background-color: #d1fae5 !important;
        color: #065f46 !important;
      }

      #${CONTAINER_ID} td.parking-cell-date {
        background-color: #dbeafe !important;
        color: #1e40af !important;
      }
    `;
    document.head.appendChild(style);
  }

  function processCell(cell) {
    if (!(cell instanceof HTMLTableCellElement)) return;
    if (cell.getAttribute(PROCESSED_ATTRIBUTE) === "true") return;

    const originalText = cell.textContent.trim();

    if (isEmptyPlaceholder(originalText)) {
      // Fjern kun placeholder-teksten – behold selve cellen.
      cell.textContent = "";
      cell.classList.remove("parking-cell-registration", "parking-cell-date");
      cell.setAttribute(PROCESSED_ATTRIBUTE, "true");
      return;
    }

    if (isDanishRegistration(originalText)) {
      cell.classList.add("parking-cell-registration");
    } else if (isValidDate(originalText)) {
      cell.classList.add("parking-cell-date");
    }

    cell.setAttribute(PROCESSED_ATTRIBUTE, "true");
  }

  function processTables() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    container.querySelectorAll("table td").forEach(processCell);
  }

  function initialize() {
    addStyles();
    processTables();

    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    // Excel-viewer.js indlæser tabellen asynkront. Observer derfor
    // containeren, så nye tabeller/celler også bliver behandlet.
    const observer = new MutationObserver(() => processTables());
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
