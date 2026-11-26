(() => {
  const sidebar = document.getElementById("sidebar");

  if (!sidebar) {
    console.error('Menuen kan ikke indlæses: elementet "#sidebar" mangler.');
    return;
  }

  // Chatbotten kan slås til og fra centralt i chatbot/config/config.json (eller via bestyrelsen-repositoryet).
  const loadChatbot = async () => {
    const configUrl = new URL("/chatbot/config/config.json", document.baseURI);
    // Undgå, at browserens cache fastholder en tidligere til/fra-indstilling.
    configUrl.searchParams.set("_", Date.now().toString());
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".run.app");

    let resolvedConfig = null;
    if (!isLocalHost) {
      try {
        const remoteUrl = `https://api.github.com/repos/Vigerslev-Skyttegard/bestyrelsen/contents/chatbot/config.json?ref=main&_=${Date.now()}`;
        const remoteResponse = await fetch(remoteUrl, {
          headers: { Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": "2026-03-10" },
          cache: "no-store"
        });
        if (remoteResponse.ok) {
          resolvedConfig = await remoteResponse.json();
        }
      } catch (_remoteError) {
        resolvedConfig = null;
      }
    }

    try {
      const config = resolvedConfig || await (async () => {
        const response = await fetch(configUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })();
      if (config.enabled === false) {
        console.info("Chatbotten er deaktiveret i chatbot/config/config.json.");
        return;
      }
    } catch (error) {
      // Hvis konfigurationen midlertidigt ikke kan læses, bevares standarden: aktiv.
      console.warn("Chatbot-konfigurationen kunne ikke læses. Chatbotten indlæses som standard aktiv.", error);
    }

    const chatbotScript = document.createElement("script");
    chatbotScript.src = new URL("/assets/js/chatbot.js", document.baseURI).href;
    chatbotScript.defer = true;
    chatbotScript.onerror = () => {
      console.error("Chatbotten kunne ikke indlæses.");
    };
    document.body.appendChild(chatbotScript);
  };

  const loadMainScript = () => {
    const script = document.createElement("script");
    script.src = new URL("/assets/js/main.js", document.baseURI).href;
    script.onerror = () => {
      console.error("Menuen blev indlæst, men sidens funktioner kunne ikke startes.");
    };
    document.body.appendChild(script);

    // Chatbotten indlæses kun, hvis config.json tillader det.
    loadChatbot();
  };

  fetch(new URL("/sidebar.html", document.baseURI))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.text();
    })
    .then((html) => {
      sidebar.innerHTML = html;

      const getPageKey = (pathname) => {
        const segments = pathname.split("/").filter(Boolean);
        if (segments.length && segments[segments.length - 1].toLowerCase() === "index.html") {
          segments.pop();
        }
        return segments.length ? segments[segments.length - 1] : "index";
      };

      const currentPage = getPageKey(window.location.pathname);

      sidebar.querySelectorAll("#menu a[href]").forEach((link) => {
        const linkedPage = getPageKey(new URL(link.href).pathname);

        if (linkedPage === currentPage) {
          link.setAttribute("aria-current", "page");
        }
      });

      loadMainScript();
    })
    .catch((error) => {
      console.error("Menuen kunne ikke indlæses:", error);
    });
})();

/* Sidst opdateret: 2026-11-08 11:43 */

