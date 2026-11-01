(() => {
  "use strict";

  const viewer = document.querySelector("[data-excel-viewer]");
  if (!viewer) return;
  const workbookUrl = viewer.dataset.excelViewer;

  function showError(message) {
    viewer.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    const link = document.createElement("a");
    link.href = workbookUrl;
    link.textContent = "Download ventelisten (Excel)";
    link.setAttribute("download", "");
    viewer.append(paragraph, link);
  }

  async function renderWorkbook() {
    try {
      if (typeof XLSX === "undefined") throw new Error("Excel-visningen kunne ikke startes.");

      const response = await fetch(workbookUrl, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Excel-filen kunne ikke hentes (HTTP ${response.status}).`);

      const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = firstSheetName && workbook.Sheets[firstSheetName];
      if (!worksheet || !worksheet["!ref"]) throw new Error("Regnearket er tomt.");

      // Read only columns A-C and build the table with textContent.
      // This avoids injecting workbook values as HTML.
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
        defval: "",
        raw: false
      }).map((row) => row.slice(0, 3));

      if (!rows.length) throw new Error("Ventelisten indeholder ingen data.");

      const table = document.createElement("table");
      table.className = "alt";
      table.setAttribute("aria-label", "Venteliste til parkering");
      const caption = document.createElement("caption");
      caption.textContent = "Venteliste til parkering – biler og motorcykler";
      table.appendChild(caption);

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      (rows[0] || []).forEach((value) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.textContent = String(value);
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      rows.slice(1).forEach((row) => {
        const tr = document.createElement("tr");
        for (let column = 0; column < 3; column++) {
          const td = document.createElement("td");
          td.textContent = row[column] == null ? "" : String(row[column]);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      viewer.replaceChildren(table);
    } catch (error) {
      console.error("Fejl ved indlæsning af ventelisten:", error);
      showError("Ventelisten kunne ikke indlæses. Du kan i stedet hente Excel-filen direkte.");
    }
  }

  renderWorkbook();
})();
