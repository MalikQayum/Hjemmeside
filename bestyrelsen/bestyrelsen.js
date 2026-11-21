(() => {
  "use strict";

  // Den separate data-repository. Der skrives aldrig direkte til Hjemmeside-repositoryet.
  const GITHUB_OWNER = "Vigerslev-Skyttegard";
  const GITHUB_REPOSITORY = "bestyrelsen";
  const GITHUB_BRANCH = "main";
  const WORKFLOW_FILE = "update-data.yml";
  const API_VERSION = "2026-03-10";
  const SHARED_USERNAME = "bestyrelsen";
  const DATA_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPOSITORY}/${GITHUB_BRANCH}/testparkeringside/data.json`;
  const API_ROOT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}`;
  const DISPATCH_URL = `${API_ROOT}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const MAX_ROWS = 100;
  const RUN_TIMEOUT_MS = 90000;
  const POLL_INTERVAL_MS = 1500;

  const loginView = document.getElementById("login-view");
  const adminView = document.getElementById("admin-view");
  const loginForm = document.getElementById("admin-login-form");
  const loginButton = document.getElementById("admin-login-button");
  const loginStatus = document.getElementById("admin-login-status");
  const usernameInput = document.getElementById("admin-username");
  const tokenInput = document.getElementById("admin-token");
  const signedInAs = document.getElementById("admin-signed-in-as");
  const mainStatus = document.getElementById("admin-main-status");
  const rowForm = document.getElementById("admin-row-form");
  const addressInput = document.getElementById("row-address");
  const carInput = document.getElementById("row-car");
  const motorcycleInput = document.getElementById("row-motorcycle");
  const rowSubmit = document.getElementById("admin-row-submit");
  const rowCancel = document.getElementById("admin-row-cancel");
  const rowsBody = document.getElementById("admin-rows");
  const rowCount = document.getElementById("admin-row-count");
  const changeState = document.getElementById("admin-change-state");
  const saveHelp = document.getElementById("admin-save-help");
  const saveButton = document.getElementById("admin-save");
  const refreshButton = document.getElementById("admin-refresh");
  const logoutButton = document.getElementById("admin-logout");

  let sessionToken = "";
  let rows = [];
  let updatedAt = null;
  let editingId = null;
  let hasUnsavedChanges = false;

  function setStatus(element, message, kind = "") {
    element.textContent = message;
    element.classList.remove("is-error", "is-success");
    if (kind) element.classList.add(`is-${kind}`);
  }

  function apiErrorMessage(status, details) {
    if (status === 401) return "GitHub afviste adgangsnøglen. Kontrollér, at tokenen er kopieret korrekt og stadig er aktiv.";
    if (status === 403) return "GitHub afviste handlingen. Kontrollér, at tokenen har Actions: Read and write til repositoryet bestyrelsen.";
    if (status === 404) return "GitHub fandt ikke repositoryet eller workflowet. Kontrollér, at repositoryet hedder bestyrelsen, og at workflowfilen ligger på main.";
    if (status === 422) return "GitHub kunne ikke starte workflowet. Kontrollér, at workflow_dispatch findes på standardbranchen main.";
    return details || `GitHub returnerede HTTP ${status}.`;
  }

  async function githubRequest(url, token, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": API_VERSION,
        ...(options.headers || {})
      }
    });

    let result = null;
    try {
      result = await response.json();
    } catch (_error) {
      result = null;
    }

    if (!response.ok) {
      throw new Error(apiErrorMessage(response.status, result?.message));
    }
    return result;
  }

  function normalizeRows(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item, index) => ({
      id: String(item?.id || `test-row-${index + 1}`),
      address: String(item?.address || "").trim(),
      car: String(item?.car || "").trim(),
      motorcycle: String(item?.motorcycle || "").trim()
    }));
  }

  async function fetchPublicData() {
    const response = await fetch(`${DATA_URL}?_=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Testdata kunne ikke hentes (HTTP ${response.status}).`);
    const parsed = await response.json();
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.rows)) {
      throw new Error("data.json har ikke det forventede format.");
    }
    return {
      rows: normalizeRows(parsed.rows),
      updatedAt: parsed.updatedAt || null
    };
  }

  async function fetchSavedData(expectedUpdatedAt) {
    // Vent kort på, at GitHubs offentlige raw-fil viser det netop gemte commit.
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const data = await fetchPublicData();
      if (data.updatedAt === expectedUpdatedAt) return data;
      await sleep(1200);
    }
    throw new Error("Workflowet er gennemført, men den offentlige datafil er endnu ikke opdateret. Genindlæs om et øjeblik.");
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function waitForWorkflow(runId, token) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const run = await githubRequest(`${API_ROOT}/actions/runs/${encodeURIComponent(runId)}`, token);
      if (run.status === "completed") {
        if (run.conclusion !== "success") {
          throw new Error(`GitHub-workflowet sluttede med status: ${run.conclusion || "ukendt"}. Se Actions i repositoryet bestyrelsen for fejlen.`);
        }
        return run;
      }
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error("GitHub accepterede opgaven, men workflowet er stadig i gang. Kontrollér Actions under repositoryet bestyrelsen.");
  }

  async function dispatchWorkflow(token, data, validateOnly) {
    const payload = JSON.stringify(data);
    if (payload.length > 60000) throw new Error("Testdataene er for store til at blive sendt til GitHub.");

    const result = await githubRequest(DISPATCH_URL, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: GITHUB_BRANCH,
        inputs: {
          payload,
          validate_only: Boolean(validateOnly)
        }
      })
    });

    if (!result || !result.workflow_run_id) {
      throw new Error("GitHub modtog ikke et workflow-ID. Kontrollér Actions og prøv igen.");
    }
    return waitForWorkflow(result.workflow_run_id, token);
  }

  function markDirty() {
    hasUnsavedChanges = true;
    saveButton.disabled = false;
    changeState.textContent = "Du har ændringer, som ikke er gemt";
    saveHelp.textContent = "Når du gemmer, startes et kontrolleret GitHub Actions-workflow i repositoryet bestyrelsen.";
  }

  function clearEditor() {
    editingId = null;
    rowForm.reset();
    rowSubmit.textContent = "Tilføj række";
    rowCancel.hidden = true;
    document.getElementById("row-editor-title").textContent = "Tilføj række";
  }

  function createActionButton(label, action, rowId) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.rowId = rowId;
    return button;
  }

  function renderRows() {
    const fragment = document.createDocumentFragment();
    if (rows.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.className = "admin-row-empty";
      emptyCell.textContent = "Der er ingen rækker i testtabellen.";
      emptyRow.appendChild(emptyCell);
      fragment.appendChild(emptyRow);
    } else {
      rows.forEach((item) => {
        const tr = document.createElement("tr");
        [item.address, item.car || "—", item.motorcycle || "—"].forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value;
          tr.appendChild(cell);
        });
        const actionCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "admin-row-actions";
        actions.appendChild(createActionButton("Redigér", "edit", item.id));
        actions.appendChild(createActionButton("Slet", "delete", item.id));
        actionCell.appendChild(actions);
        tr.appendChild(actionCell);
        fragment.appendChild(tr);
      });
    }
    rowsBody.replaceChildren(fragment);
    rowCount.textContent = `${rows.length} ${rows.length === 1 ? "række" : "rækker"}`;
  }

  function applyData(data) {
    rows = normalizeRows(data.rows);
    updatedAt = data.updatedAt || null;
    hasUnsavedChanges = false;
    editingId = null;
    clearEditor();
    renderRows();
    saveButton.disabled = true;
    changeState.textContent = "Ingen ikke-gemte ændringer";
    saveHelp.textContent = updatedAt
      ? `Seneste gemte ændring: ${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}.`
      : "Testdataene er endnu ikke blevet ændret via administrationssiden.";
  }

  async function loadCurrentData() {
    const data = await fetchPublicData();
    applyData(data);
    setStatus(mainStatus, "Testdata er indlæst fra repositoryet bestyrelsen.", "success");
  }

  function createRowId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return `test-${window.crypto.randomUUID()}`;
    return `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(loginStatus, "Kontrollerer GitHub-adgangen …");
    loginButton.disabled = true;

    const username = usernameInput.value.trim().toLowerCase();
    const candidateToken = tokenInput.value.trim();
    tokenInput.value = "";

    if (username !== SHARED_USERNAME) {
      setStatus(loginStatus, "Brugernavnet er ikke korrekt.", "error");
      loginButton.disabled = false;
      return;
    }
    if (!candidateToken) {
      setStatus(loginStatus, "Indsæt bestyrelsens GitHub-adgangsnøgle.", "error");
      loginButton.disabled = false;
      return;
    }

    try {
      // Validerer tokenen ved at starte workflowet uden at ændre data.json.
      await dispatchWorkflow(candidateToken, {
        schemaVersion: 1,
        updatedAt: null,
        rows: []
      }, true);
      sessionToken = candidateToken;
      await loadCurrentData();
      signedInAs.textContent = "GitHub-adgangen er bekræftet for bestyrelsens konto.";
      loginView.hidden = true;
      adminView.hidden = false;
      setStatus(mainStatus, "Du er logget ind. Testdata er indlæst.", "success");
    } catch (error) {
      sessionToken = "";
      setStatus(loginStatus, error.message || "Login mislykkedes.", "error");
    } finally {
      loginButton.disabled = false;
    }
  });

  rowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const address = addressInput.value.trim();
    if (!address) {
      addressInput.focus();
      return;
    }
    if (!editingId && rows.length >= MAX_ROWS) {
      setStatus(mainStatus, `Testtabellen kan højst indeholde ${MAX_ROWS} rækker.`, "error");
      return;
    }
    const updatedRow = {
      id: editingId || createRowId(),
      address,
      car: carInput.value.trim(),
      motorcycle: motorcycleInput.value.trim()
    };
    if (editingId) {
      rows = rows.map((item) => item.id === editingId ? updatedRow : item);
      setStatus(mainStatus, "Rækken er opdateret i kladden. Husk at gemme ændringerne.");
    } else {
      rows.push(updatedRow);
      setStatus(mainStatus, "Rækken er tilføjet til kladden. Husk at gemme ændringerne.");
    }
    clearEditor();
    renderRows();
    markDirty();
  });

  rowsBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = rows.find((row) => row.id === button.dataset.rowId);
    if (!item) return;

    if (button.dataset.action === "edit") {
      editingId = item.id;
      addressInput.value = item.address;
      carInput.value = item.car;
      motorcycleInput.value = item.motorcycle;
      rowSubmit.textContent = "Gem rækken";
      rowCancel.hidden = false;
      document.getElementById("row-editor-title").textContent = "Redigér række";
      addressInput.focus();
      return;
    }

    if (button.dataset.action === "delete") {
      if (!window.confirm(`Vil du slette rækken “${item.address}” fra testtabellen?`)) return;
      rows = rows.filter((row) => row.id !== item.id);
      if (editingId === item.id) clearEditor();
      renderRows();
      markDirty();
      setStatus(mainStatus, "Rækken er slettet fra kladden. Husk at gemme ændringerne.");
    }
  });

  rowCancel.addEventListener("click", clearEditor);

  refreshButton.addEventListener("click", async () => {
    if (hasUnsavedChanges && !window.confirm("Dine ikke-gemte ændringer bliver kasseret. Vil du fortsætte?")) return;
    refreshButton.disabled = true;
    setStatus(mainStatus, "Genindlæser testdata …");
    try {
      await loadCurrentData();
    } catch (error) {
      setStatus(mainStatus, error.message || "Testdata kunne ikke genindlæses.", "error");
    } finally {
      refreshButton.disabled = false;
    }
  });

  saveButton.addEventListener("click", async () => {
    if (!sessionToken || !hasUnsavedChanges) return;
    saveButton.disabled = true;
    refreshButton.disabled = true;
    setStatus(mainStatus, "Sender ændringerne til GitHub Actions …");

    try {
      const nextData = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        rows: normalizeRows(rows)
      };
      await dispatchWorkflow(sessionToken, nextData, false);
      const savedData = await fetchSavedData(nextData.updatedAt);
      applyData(savedData);
      setStatus(mainStatus, "Testdata er gemt. Kun data.json i repositoryet bestyrelsen er blevet opdateret.", "success");
    } catch (error) {
      saveButton.disabled = !hasUnsavedChanges;
      setStatus(mainStatus, error.message || "Ændringerne kunne ikke gemmes.", "error");
    } finally {
      refreshButton.disabled = false;
    }
  });

  function logout() {
    sessionToken = "";
    rows = [];
    updatedAt = null;
    hasUnsavedChanges = false;
    editingId = null;
    tokenInput.value = "";
    loginView.hidden = false;
    adminView.hidden = true;
    loginForm.reset();
    usernameInput.value = SHARED_USERNAME;
    saveButton.disabled = true;
    setStatus(loginStatus, "Du er logget ud.");
    setStatus(mainStatus, "");
    clearEditor();
    renderRows();
  }

  logoutButton.addEventListener("click", () => {
    if (hasUnsavedChanges && !window.confirm("Du har ikke-gemte ændringer. Log ud alligevel?")) return;
    logout();
  });

  // Tokenen findes kun i sidens hukommelse og nulstilles ved lukning/navigation.
  window.addEventListener("pagehide", () => {
    sessionToken = "";
  });
})();
