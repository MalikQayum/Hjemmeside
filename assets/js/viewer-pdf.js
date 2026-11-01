(() => {
  "use strict";

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  async function renderPDF(file, container) {
    const showFallback = (message) => {
      container.replaceChildren();
      const box = document.createElement("div");
      box.className = "pdf-error";
      const paragraph = document.createElement("p");
      paragraph.textContent = message;
      const link = document.createElement("a");
      link.href = file;
      link.textContent = "Åbn eller download PDF-dokumentet";
      link.setAttribute("download", "");
      box.append(paragraph, link);
      container.appendChild(box);
    };

    try {
      if (!window.pdfjsLib) throw new Error("PDF-visningen kunne ikke startes.");
      container.textContent = "Indlæser dokument...";
      const pdf = await pdfjsLib.getDocument({ url: file, disableAutoFetch: true }).promise;

      container.replaceChildren();
      const pending = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(240, container.clientWidth - 20);
        const scale = Math.min(availableWidth / baseViewport.width, 1.8);
        const viewport = page.getViewport({ scale });

        const placeholder = document.createElement("div");
        placeholder.className = "pdf-page-placeholder";
        placeholder.style.aspectRatio = `${baseViewport.width} / ${baseViewport.height}`;
        placeholder.setAttribute("role", "img");
        placeholder.setAttribute("aria-label", `Side ${pageNumber} af ${pdf.numPages}`);
        container.appendChild(placeholder);

        const renderPage = async () => {
          if (placeholder.dataset.rendered === "true") return;
          placeholder.dataset.rendered = "true";
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("Browseren kunne ikke oprette PDF-visningen.");

          const renderViewport = page.getViewport({ scale: scale * pixelRatio });
          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          canvas.className = "pdf-page";
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          canvas.setAttribute("role", "presentation");

          placeholder.replaceChildren(canvas);
          await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        };

        pending.push({ placeholder, renderPage });
      }

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const item = pending.find((candidate) => candidate.placeholder === entry.target);
            if (!item) return;
            observer.unobserve(entry.target);
            item.renderPage().catch((error) => {
              console.error("PDF-side kunne ikke vises:", error);
              item.placeholder.textContent = "Denne PDF-side kunne ikke vises.";
            });
          });
        }, { rootMargin: "900px 0px" });

        pending.forEach(({ placeholder }) => observer.observe(placeholder));
      } else {
        for (const item of pending) await item.renderPage();
      }
    } catch (error) {
      console.error("PDF rendering error:", file, error);
      showFallback("Dokumentet kunne ikke vises direkte på hjemmesiden.");
    }
  }

  document.querySelectorAll("[data-pdf-viewer]").forEach((container) => {
    renderPDF(container.dataset.pdfViewer, container);
  });
})();
