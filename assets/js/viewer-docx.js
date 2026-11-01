(() => {
  "use strict";

  async function renderDocx(fileUrl, container) {
    try {
      container.textContent = "Indlæser nyhedsbrev...";

      if (typeof JSZip === "undefined") throw new Error("JSZip kunne ikke indlæses.");
      if (typeof docx === "undefined" || typeof docx.renderAsync !== "function") {
        throw new Error("DOCX-preview kunne ikke indlæses.");
      }

      const response = await fetch(fileUrl, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Kunne ikke hente dokumentet (HTTP ${response.status}).`);

      const blob = await response.blob();
      if (blob.size === 0) throw new Error("Dokumentet er tomt.");

      container.replaceChildren();
      await docx.renderAsync(blob, container, container, {
        className: "docx",
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
        ignoreFonts: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true
      });
    } catch (error) {
      console.error("DOCX rendering error:", error);
      const errorBox = document.createElement("div");
      errorBox.className = "docx-error";
      const message = document.createElement("p");
      message.textContent = "Nyhedsbrevet kunne ikke vises direkte på hjemmesiden.";
      const download = document.createElement("a");
      download.href = fileUrl;
      download.setAttribute("download", "");
      download.textContent = "Download nyhedsbrevet her";
      errorBox.append(message, download);
      container.replaceChildren(errorBox);
    }
  }

  document.querySelectorAll("[data-docx-viewer]").forEach((container) => {
    renderDocx(container.dataset.docxViewer, container);
  });
})();
