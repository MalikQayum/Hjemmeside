
/* =========================================================
   Parkeringsventeliste – Excel-visning og parkeringsstatus

   Kolonne A: Adresse
   Kolonne B: Bil
   Kolonne C: MC/scooter

   Kapacitet:
   - Bil: 9 pladser
   - MC/scooter: 2 pladser
   ========================================================= */

(async function () {
  "use strict";

  const viewer = document.getElementById("excel-viewer");

  const CAPACITY = {
    car: 9,
    motorcycle: 2
  };

  function normalize(value) {
    return String(value ?? "")
      .replace(/\u00a0/g, " ")
      .trim()
      .toLowerCase();
  }

  function isPlaceholder(value) {
    const text = normalize(value);
    return text === "" || text === "blank" || text === "1/0/00";
  }

  function isDanishRegistration(value) {
    const text = String(value ?? "").trim().toUpperCase();
    return /^[A-ZÆØÅ]{2}\s?-?\s?\d{5}$/.test(text);
  }

  function getCellText(worksheet, row, col) {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[address];

    if (!cell) return "";

    return XLSX.utils.format_cell(cell).trim();
  }

  function calculateParking(worksheet, range) {
    const carRegistrations = new Set();
    const motorcycleRegistrations = new Set();

    const carWaitingList = new Set();
    const motorcycleWaitingList = new Set();

    // Gennemgå rækkerne efter overskriften.
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const address = normalize(getCellText(worksheet, row, 0));

      if (!address || isPlaceholder(address)) continue;

      const carValue = getCellText(worksheet, row, 1);
      const motorcycleValue = getCellText(worksheet, row, 2);

      // Bil
      if (!isPlaceholder(carValue)) {
        if (isDanishRegistration(carValue)) {
          carRegistrations.add(carValue.replace(/[\s-]/g, "").toUpperCase());
        } else {
          carWaitingList.add(address);
        }
      }

      // MC/scooter
      if (!isPlaceholder(motorcycleValue)) {
        if (isDanishRegistration(motorcycleValue)) {
          motorcycleRegistrations.add(
            motorcycleValue.replace(/[\s-]/g, "").toUpperCase()
          );
        } else {
          motorcycleWaitingList.add(address);
        }
      }
    }

    return {
      car: {
        occupied: carRegistrations.size,
        available: Math.max(0, CAPACITY.car - carRegistrations.size),
        waiting: carWaitingList.size
      },
      motorcycle: {
        occupied: motorcycleRegistrations.size,
        available: Math.max(
          0,
          CAPACITY.motorcycle - motorcycleRegistrations.size
        ),
        waiting: motorcycleWaitingList.size
      }
    };
  }

  function renderParkingStatus(data) {
    const existing = document.getElementById("parking-availability");

    if (existing) existing.remove();

    const section = document.createElement("section");
    section.id = "parking-availability";
    section.setAttribute("aria-label", "Parkeringsstatus");

    section.innerHTML = `
      <h3>Parkeringsstatus</h3>

      <div class="parking-status-grid">

        <div class="parking-status-card">
          <h4>Bil</h4>
          <div class="parking-status-available">
            ${data.car.available} <span>/ ${CAPACITY.car}</span>
          </div>
          <p>Ledige pladser</p>

          <div class="parking-status-waiting">
            <strong>${data.car.waiting}</strong>
            <span>På venteliste</span>
          </div>
        </div>

        <div class="parking-status-card">
          <h4>MC / scooter</h4>
          <div class="parking-status-available">
            ${data.motorcycle.available}
            <span>/ ${CAPACITY.motorcycle}</span>
          </div>
          <p>Ledige pladser</p>

          <div class="parking-status-waiting">
            <strong>${data.motorcycle.waiting}</strong>
            <span>På venteliste</span>
          </div>
        </div>

      </div>
    `;

    viewer.prepend(section);
  }

  function addParkingStyles() {
    if (document.getElementById("parking-availability-styles")) return;

    const style = document.createElement("style");
    style.id = "parking-availability-styles";

    style.textContent = `
      #parking-availability {
        margin: 0 0 2em;
      }

      .parking-status-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1em;
      }

      .parking-status-card {
        padding: 1.25em;
        border: 1px solid rgba(144, 144, 144, 0.3);
        border-radius: 0.5em;
        background: rgba(144, 144, 144, 0.04);
      }

      .parking-status-card h4 {
        margin-bottom: 0.5em;
      }

      .parking-status-available {
        font-size: 2em;
        font-weight: 700;
        color: #238b57;
        line-height: 1.2;
      }

      .parking-status-available span {
        font-size: 0.6em;
        color: #7f888f;
      }

      .parking-status-card > p {
        margin: 0.25em 0 1em;
        font-size: 0.85em;
      }

      .parking-status-waiting {
        display: flex;
        align-items: baseline;
        gap: 0.5em;
        padding-top: 0.75em;
        border-top: 1px solid rgba(144, 144, 144, 0.3);
      }

      .parking-status-waiting strong {
        font-size: 1.3em;
      }

      .parking-status-waiting span {
        font-size: 0.85em;
      }

      @media screen and (max-width: 480px) {
        .parking-status-grid {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  try {
    const response = await fetch("/Venteliste%20Parkering.xlsx");

    if (!response.ok) {
      throw new Error(
        "Excel-filen kunne ikke hentes. HTTP-status: " + response.status
      );
    }

    const workbook = XLSX.read(
      await response.arrayBuffer(),
      { type: "array" }
    );

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet || !worksheet["!ref"]) {
      throw new Error("Regnearket er tomt.");
    }

    const originalRange = XLSX.utils.decode_range(worksheet["!ref"]);

    // Beregn parkeringsstatus fra det originale regneark.
    const parkingData = calculateParking(worksheet, originalRange);

    // Begræns den viste tabel til kolonne A, B og C.
    const range = {
      s: { r: originalRange.s.r, c: 0 },
      e: {
        r: originalRange.e.r,
        c: Math.min(originalRange.e.c, 2)
      }
    };

    const filteredSheet = {};

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = 0; col <= range.e.c; col++) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });

        if (worksheet[address]) {
          filteredSheet[address] = { ...worksheet[address] };
        }
      }
    }

    filteredSheet["!ref"] = XLSX.utils.encode_range(range);

    if (worksheet["!merges"]) {
      filteredSheet["!merges"] = worksheet["!merges"].filter(merge =>
        merge.s.c >= 0 && merge.e.c <= 2
      );
    }

    // Vis parkeringsstatus og Excel-tabellen.
    addParkingStyles();
    renderParkingStatus(parkingData);

    const tableHTML = XLSX.utils.sheet_to_html(
      filteredSheet,
      { id: "venteliste-excel" }
    );

    viewer.insertAdjacentHTML("beforeend", tableHTML);

    const table = viewer.querySelector("table");

    if (table) {
      table.setAttribute("aria-label", "Venteliste til parkering");
    }

  } catch (error) {
    console.error("Fejl ved indlæsning af ventelisten:", error);

    viewer.textContent =
      "Ventelisten kunne ikke indlæses. Prøv igen senere.";
  }
})();