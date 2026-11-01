(() => {
  "use strict";

  const sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    console.error('Navigationen kan ikke indlæses: elementet "#sidebar" mangler.');
    return;
  }

  const scriptElement = document.currentScript;
  const siteRoot = new URL("../../", scriptElement ? scriptElement.src : window.location.href);

  const fallbackNavigation = `
    <div class="inner">
      <nav aria-label="Hovednavigation">
        <header class="major"><h2>Menu</h2></header>
        <ul>
          <li><a href="index.html">Forside</a></li>
          <li><a href="velkomstbrev/">Velkomstbrev</a></li>
          <li><a href="husorden-og-vedtaegter/">Husorden og vedtægter</a></li>
          <li><a href="nyheder/">Nyheder</a></li>
          <li><a href="parkering/">Parkering</a></li>
        </ul>
      </nav>
      <p>Kontakt: <a href="mailto:bestyrelse@skyttegaardvej.dk">bestyrelse@skyttegaardvej.dk</a></p>
    </div>`;

  function markCurrentPage() {
    const currentPath = new URL(window.location.href).pathname.replace(/index\.html$/, "").replace(/\/+$/, "");
    sidebar.querySelectorAll("a[href]").forEach((link) => {
      const url = new URL(link.getAttribute("href"), siteRoot);
      link.href = url.href;
      const linkedPath = url.pathname.replace(/index\.html$/, "").replace(/\/+$/, "");
      if (linkedPath === currentPath) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function startMainScript() {
    if (document.querySelector('script[data-site-main="true"]')) return;
    const script = document.createElement("script");
    script.src = new URL("assets/js/main.js", siteRoot).href;
    script.dataset.siteMain = "true";
    script.onerror = () => console.error("Sidens navigation blev indlæst, men interaktionerne kunne ikke startes.");
    document.body.appendChild(script);
  }

  sidebar.setAttribute("aria-busy", "true");

  fetch(new URL("sidebar.html", siteRoot), { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then((html) => {
      sidebar.innerHTML = html;
      markCurrentPage();
      startMainScript();
    })
    .catch((error) => {
      console.error("Navigationen kunne ikke indlæses:", error);
      sidebar.innerHTML = fallbackNavigation;
      markCurrentPage();
      startMainScript();
    })
    .finally(() => sidebar.removeAttribute("aria-busy"));
})();
