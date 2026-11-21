(() => {
  "use strict";

  // Data ligger i det separate repository Vigerslev-Skyttegard/bestyrelsen.
  const GITHUB_OWNER = "Vigerslev-Skyttegard";
  const GITHUB_REPOSITORY = "bestyrelsen";
  const GITHUB_BRANCH = "main";
  const WORKFLOW_FILE = "update-data.yml";
  const PRICE_WORKFLOW_FILE = "update-price-list.yml";
  const API_VERSION = "2026-03-10";
  const SHARED_USERNAME = "bestyrelsen";
  const ALLOWED_GITHUB_LOGIN = "MalikQayum";
  const RUN_NAME_PREFIX = "Update parking data ";
  const PRICE_RUN_NAME_PREFIX = "Update price list ";
  const API_ROOT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPOSITORY}`;
  const DATA_URL = `${API_ROOT}/contents/parkering/data.json?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const PRICE_DATA_URL = `${API_ROOT}/contents/generalforsamling/prisblad.json?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const DISPATCH_URL = `${API_ROOT}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const PRICE_DISPATCH_URL = `${API_ROOT}/actions/workflows/${PRICE_WORKFLOW_FILE}/dispatches`;
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
  const vehicleTypeInput = document.getElementById("row-vehicle-type");
  const registrationInput = document.getElementById("row-registration");
  const registrationLabel = document.getElementById("row-registration-label");
  const registrationHelp = document.getElementById("row-registration-help");
  const rowSubmit = document.getElementById("admin-row-submit");
  const rowClear = document.getElementById("admin-row-clear");
  const rowCancel = document.getElementById("admin-row-cancel");
  const rowsBody = document.getElementById("admin-rows");
  const rowCount = document.getElementById("admin-row-count");
  const changeState = document.getElementById("admin-change-state");
  const saveHelp = document.getElementById("admin-save-help");
  const saveButton = document.getElementById("admin-save");
  const refreshButton = document.getElementById("admin-refresh");
  const logoutButton = document.getElementById("admin-logout");
  const priceForm = document.getElementById("price-editor-form");
  const priceRowIdInput = document.getElementById("price-row-id");
  const priceTitleInput = document.getElementById("price-title");
  const priceDescriptionInput = document.getElementById("price-description");
  const priceAmountInput = document.getElementById("price-amount");
  const priceUnitInput = document.getElementById("price-unit");
  const priceFormHeading = document.getElementById("price-editor-heading");
  const priceFormSubmit = document.getElementById("price-editor-submit");
  const priceFormCancel = document.getElementById("price-editor-cancel");
  const priceRowsBody = document.getElementById("admin-price-rows");
  const priceCount = document.getElementById("admin-price-count");
  const priceChangeState = document.getElementById("admin-price-change-state");
  const priceSaveHelp = document.getElementById("admin-price-save-help");
  const priceSaveButton = document.getElementById("price-save");
  const priceRefreshButton = document.getElementById("price-refresh");
  const priceStatus = document.getElementById("admin-price-status");

  const ADDRESSES = Array.from(addressInput.options)
    .map((option) => option.value.trim())
    .filter(Boolean);
  const VEHICLE_KEYS = ["car", "motorcycle"];

  let sessionToken = "";
  let rows = [];
  let updatedAt = null;
  let hasUnsavedChanges = false;
  let priceRows = [];
  let priceUpdatedAt = null;
  let hasUnsavedPriceChanges = false;

  function setStatus(element, message, kind = "") {
    element.textContent = message;
    element.classList.remove("is-error", "is-success");
    if (kind) element.classList.add(`is-${kind}`);
  }

  function apiErrorMessage(status, details) {
    if (status === 401) return "GitHub afviste adgangsnøglen. Kontrollér, at tokenen er kopieret korrekt og stadig er aktiv.";
    if (status === 403) return "GitHub afviste anmodningen. Kontrollér, at tokenen er aktiv, at Vigerslev-Skyttegard har godkendt den, og at den har Actions: Read and write ved gemning.";
    if (status === 404) return "GitHub fandt ikke repositoryet eller workflowet. Kontrollér, at repositoryet hedder Vigerslev-Skyttegard/bestyrelsen, og at workflowet ligger på main.";
    if (status === 422) return "GitHub kunne ikke starte workflowet. Kontrollér, at workflow_dispatch er aktiveret, og at workflowet ligger på main.";
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
    if (response.status === 204) return null;
    let result = null;
    try { result = await response.json(); } catch (_error) { result = null; }
    if (!response.ok) throw new Error(apiErrorMessage(response.status, result?.message));
    return result;
  }

  async function verifyGitHubToken(token) {
    const user = await githubRequest("https://api.github.com/user", token);
    if (!user || typeof user.login !== "string") throw new Error("GitHub kunne ikke bekræfte tokenens ejerkonto.");
    if (user.login.toLowerCase() !== ALLOWED_GITHUB_LOGIN.toLowerCase()) {
      throw new Error(`Denne administration accepterer kun en token fra GitHub-kontoen ${ALLOWED_GITHUB_LOGIN}. Den indtastede token tilhører ${user.login}.`);
    }
    return user;
  }

  // Sikrer, at data altid består af de 69 faste boliger – aldrig færre eller flere.
  function normalizeRows(value) {
    const incoming = new Map();
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const address = String(item?.address || "").trim();
        if (ADDRESSES.includes(address) && !incoming.has(address)) incoming.set(address, item);
      });
    }
    return ADDRESSES.map((address, index) => {
      const item = incoming.get(address) || {};
      return {
        id: String(item.id || `apt-${String(index + 1).padStart(3, "0")}`),
        address,
        car: String(item.car || "").trim(),
        motorcycle: String(item.motorcycle || "").trim()
      };
    });
  }

  async function fetchPublicData() {
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
        throw new Error("GitHubs offentlige API har midlertidigt nået sin grænse. Prøv igen om lidt.");
      }
      throw new Error(`Parkeringsdata kunne ikke hentes (HTTP ${response.status}).`);
    }
    const parsed = await response.json();
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.rows)) {
      throw new Error("data.json har ikke det forventede format.");
    }
    return { rows: normalizeRows(parsed.rows), updatedAt: parsed.updatedAt || null };
  }

  async function fetchSavedData(expectedUpdatedAt) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const data = await fetchPublicData();
      if (data.updatedAt === expectedUpdatedAt) return data;
      if (attempt < 4) await sleep(800);
    }
    throw new Error("Workflowet er gennemført, men GitHub har endnu ikke vist den nye datafil. Prøv at genindlæse om et øjeblik.");
  }

  function normalizePriceRows(value) {
    if (!Array.isArray(value)) throw new Error("Prisbladet indeholder ikke en liste over priser.");
    if (value.length < 1 || value.length > 100) throw new Error("Prisbladet skal indeholde mellem 1 og 100 ydelser.");
    const seenIds = new Set();
    return value.map((item, index) => {
      const id = String(item?.id || `price-${String(index + 1).padStart(3, "0")}`).trim();
      const title = String(item?.title || "").trim();
      const description = String(item?.description || "").trim();
      const amount = Number(item?.amount);
      const unit = String(item?.unit || "").trim();
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || seenIds.has(id)) throw new Error("Prisbladet indeholder et ugyldigt eller gentaget række-id.");
      if (!title || title.length > 160) throw new Error("Hver ydelse skal have en titel på højst 160 tegn.");
      if (description.length > 400) throw new Error("En prisbeskrivelse er længere end 400 tegn.");
      if (!Number.isInteger(amount) || amount < 0 || amount > 1000000) throw new Error(`Prisen for “${title}” skal være et helt beløb mellem 0 og 1.000.000 kr.`);
      if (unit.length > 40) throw new Error("En pris-enhed må højst være 40 tegn.");
      seenIds.add(id);
      return { id, title, description, amount, unit };
    });
  }

  async function fetchPublicPriceData() {
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const response = await fetch(`${PRICE_DATA_URL}&_=${cacheBuster}`, {
      headers: { Accept: "application/vnd.github.raw+json", "X-GitHub-Api-Version": API_VERSION },
      cache: "no-store"
    });
    if (!response.ok) {
      if (response.status === 403 && response.headers?.get("X-RateLimit-Remaining") === "0") {
        throw new Error("GitHubs offentlige API har midlertidigt nået sin grænse. Prøv igen om lidt.");
      }
      throw new Error(`Prisbladet kunne ikke hentes (HTTP ${response.status}). Kontrollér, at generalforsamling/prisblad.json er lagt i repositoryet bestyrelsen.`);
    }
    const parsed = await response.json();
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.rows)) throw new Error("prisblad.json har ikke det forventede format.");
    return { rows: normalizePriceRows(parsed.rows), updatedAt: parsed.updatedAt || null };
  }

  async function fetchSavedPriceData(expectedUpdatedAt) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const data = await fetchPublicPriceData();
      if (data.updatedAt === expectedUpdatedAt) return data;
      if (attempt < 4) await sleep(800);
    }
    throw new Error("Prisworkflowet er gennemført, men GitHub har endnu ikke vist den nye prisfil. Prøv at genindlæse om et øjeblik.");
  }

  function sleep(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

  async function waitForWorkflowById(runId, token) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const run = await githubRequest(`${API_ROOT}/actions/runs/${encodeURIComponent(runId)}`, token);
      if (run.status === "completed") {
        if (run.conclusion !== "success") throw new Error(`GitHub-workflowet sluttede med status: ${run.conclusion || "ukendt"}. Se Actions i repositoryet bestyrelsen for fejlen.`);
        return run;
      }
      setStatus(mainStatus, "GitHub behandler ændringerne …");
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error("GitHub accepterede gemmeanmodningen, men workflowet blev ikke færdigt inden for tidsgrænsen. Kontrollér Actions i repositoryet bestyrelsen.");
  }

  async function waitForWorkflowByRequestId(requestId, token) {
    const startedAt = Date.now();
    const runsUrl = `${API_ROOT}/actions/workflows/${encodeURIComponent(WORKFLOW_FILE)}/runs?branch=${encodeURIComponent(GITHUB_BRANCH)}&event=workflow_dispatch&per_page=100`;
    const expectedTitle = `${RUN_NAME_PREFIX}${requestId}`;
    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const result = await githubRequest(runsUrl, token);
      const run = Array.isArray(result?.workflow_runs) ? result.workflow_runs.find((item) => item.display_title === expectedTitle) : null;
      if (run) {
        if (run.status === "completed") {
          if (run.conclusion !== "success") throw new Error(`GitHub-workflowet sluttede med status: ${run.conclusion || "ukendt"}. Se Actions i repositoryet bestyrelsen for fejlen.`);
          return run;
        }
        setStatus(mainStatus, "GitHub behandler ændringerne …");
      }
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error("GitHub modtog gemmeanmodningen, men workflowet blev ikke færdigt inden for tidsgrænsen. Kontrollér Actions i repositoryet bestyrelsen.");
  }

  async function dispatchWorkflow(token, data) {
    const payload = JSON.stringify(data);
    if (payload.length > 60000) throw new Error("Parkeringsdataene er for store til at blive sendt til GitHub.");
    const requestId = `save-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const result = await githubRequest(DISPATCH_URL, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: GITHUB_BRANCH, inputs: { payload, request_id: requestId } })
    });
    if (result && Number.isInteger(result.workflow_run_id)) return waitForWorkflowById(result.workflow_run_id, token);
    if (result === null) return waitForWorkflowByRequestId(requestId, token);
    throw new Error("GitHub returnerede et uventet svar på workflow-anmodningen.");
  }

  async function waitForPriceWorkflowById(runId, token) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const run = await githubRequest(`${API_ROOT}/actions/runs/${encodeURIComponent(runId)}`, token);
      if (run.status === "completed") {
        if (run.conclusion !== "success") throw new Error(`Prisworkflowet sluttede med status: ${run.conclusion || "ukendt"}. Se Actions i repositoryet bestyrelsen for fejlen.`);
        return run;
      }
      setStatus(priceStatus, "GitHub opdaterer prisbladet …");
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error("GitHub accepterede prisændringerne, men workflowet blev ikke færdigt inden for tidsgrænsen. Kontrollér Actions i repositoryet bestyrelsen.");
  }

  async function waitForPriceWorkflowByRequestId(requestId, token) {
    const startedAt = Date.now();
    const runsUrl = `${API_ROOT}/actions/workflows/${encodeURIComponent(PRICE_WORKFLOW_FILE)}/runs?branch=${encodeURIComponent(GITHUB_BRANCH)}&event=workflow_dispatch&per_page=100`;
    const expectedTitle = `${PRICE_RUN_NAME_PREFIX}${requestId}`;
    while (Date.now() - startedAt < RUN_TIMEOUT_MS) {
      const result = await githubRequest(runsUrl, token);
      const run = Array.isArray(result?.workflow_runs) ? result.workflow_runs.find((item) => item.display_title === expectedTitle) : null;
      if (run) {
        if (run.status === "completed") {
          if (run.conclusion !== "success") throw new Error(`Prisworkflowet sluttede med status: ${run.conclusion || "ukendt"}. Se Actions i repositoryet bestyrelsen for fejlen.`);
          return run;
        }
        setStatus(priceStatus, "GitHub opdaterer prisbladet …");
      }
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error("GitHub modtog prisændringerne, men workflowet blev ikke færdigt inden for tidsgrænsen. Kontrollér Actions i repositoryet bestyrelsen.");
  }

  async function dispatchPriceWorkflow(token, data) {
    const payload = JSON.stringify(data);
    if (payload.length > 30000) throw new Error("Prisbladet er for stort til at blive sendt til GitHub.");
    const requestId = `save-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const result = await githubRequest(PRICE_DISPATCH_URL, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: GITHUB_BRANCH, inputs: { payload, request_id: requestId } })
    });
    if (result && Number.isInteger(result.workflow_run_id)) return waitForPriceWorkflowById(result.workflow_run_id, token);
    if (result === null) return waitForPriceWorkflowByRequestId(requestId, token);
    throw new Error("GitHub returnerede et uventet svar på prisworkflow-anmodningen.");
  }

  function formatTodayInCopenhagen() {
    const parts = new Intl.DateTimeFormat("da-DK", {
      timeZone: "Europe/Copenhagen", day: "2-digit", month: "2-digit", year: "numeric"
    }).formatToParts(new Date());
    const part = (type) => parts.find((item) => item.type === type)?.value || "";
    return `${part("day")}/${part("month")}/${part("year")}`;
  }

  function getSelectedRow() {
    const address = addressInput.value.trim();
    const key = vehicleTypeInput.value;
    if (!address || !VEHICLE_KEYS.includes(key)) return null;
    const row = rows.find((item) => item.address === address);
    return row ? { row, key, value: String(row[key] || "").trim() } : null;
  }

  function updateRegistrationField() {
    const selection = getSelectedRow();
    if (!selection) {
      registrationLabel.textContent = "Ventelistedato / nummerplade";
      registrationInput.value = "";
      registrationInput.disabled = true;
      registrationInput.readOnly = true;
      registrationInput.placeholder = "Vælg først adresse og køretøjstype";
      registrationHelp.textContent = "Når du tilmelder en bolig til ventelisten, registreres dags dato automatisk. Når en parkeringsplads tildeles, erstattes datoen med nummerpladen.";
      rowSubmit.disabled = true;
      rowSubmit.textContent = "Tilmeld på venteliste";
      rowClear.hidden = true;
      return;
    }

    const vehicleLabel = selection.key === "car" ? "Bil" : "MC/scooter";
    registrationInput.disabled = false;
    rowSubmit.disabled = false;
    if (!selection.value) {
      registrationLabel.textContent = `Ventelistedato – ${vehicleLabel}`;
      registrationInput.value = formatTodayInCopenhagen();
      registrationInput.readOnly = true;
      registrationInput.placeholder = "Dags dato sættes automatisk";
      registrationHelp.textContent = `Når du tilmelder ${selection.row.address} til ventelisten for ${vehicleLabel.toLowerCase()}, registreres dags dato automatisk. Når pladsen tildeles, kan datoen erstattes med nummerpladen.`;
      rowSubmit.textContent = "Tilmeld på venteliste";
      rowClear.hidden = true;
    } else {
      registrationLabel.textContent = `Ventelistedato / nummerplade – ${vehicleLabel}`;
      registrationInput.value = selection.value;
      registrationInput.readOnly = false;
      registrationInput.placeholder = "Skriv nummerpladen, når pladsen tildeles";
      registrationHelp.textContent = `Nuværende værdi for ${selection.row.address}: ${selection.value}. Når parkeringspladsen tildeles, erstatter du ventelistedatoen med nummerpladen og vælger Opdater.`;
      rowSubmit.textContent = "Opdater dato / nummerplade";
      rowClear.hidden = false;
    }
  }

  function markDirty() {
    hasUnsavedChanges = true;
    saveButton.disabled = false;
    changeState.textContent = "Du har ændringer, som ikke er gemt";
    saveHelp.textContent = "Når du gemmer, starter et kontrolleret GitHub Actions-workflow. Det opdaterer kun parkeringsoversigtens data.json.";
  }

  function clearEditor() {
    addressInput.value = "";
    vehicleTypeInput.value = "";
    updateRegistrationField();
  }

  function createActionButton(label, rowId, vehicleType) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.dataset.action = "select";
    button.dataset.rowId = rowId;
    button.dataset.vehicleType = vehicleType;
    return button;
  }

  function renderRows() {
    const fragment = document.createDocumentFragment();
    rows.forEach((item) => {
      const tr = document.createElement("tr");
      [item.address, item.car, item.motorcycle].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value || "";
        tr.appendChild(cell);
      });
      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "admin-row-actions";
      actions.appendChild(createActionButton("Vælg bil", item.id, "car"));
      actions.appendChild(createActionButton("Vælg MC/scooter", item.id, "motorcycle"));
      actionCell.appendChild(actions);
      tr.appendChild(actionCell);
      fragment.appendChild(tr);
    });
    rowsBody.replaceChildren(fragment);
    const registrations = rows.reduce((count, item) => count + (item.car ? 1 : 0) + (item.motorcycle ? 1 : 0), 0);
    rowCount.textContent = `${rows.length} boliger · ${registrations} venteliste-/parkeringsregistreringer`;
  }

  function applyData(data) {
    rows = normalizeRows(data.rows);
    updatedAt = data.updatedAt || null;
    hasUnsavedChanges = false;
    clearEditor();
    renderRows();
    saveButton.disabled = true;
    changeState.textContent = "Ingen ikke-gemte ændringer";
    saveHelp.textContent = updatedAt
      ? `Seneste gemte ændring: ${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}.`
      : "Standardoversigten indeholder alle 69 boliger med tomme felter.";
  }

  function formatAdminPrice(row) {
    const amount = new Intl.NumberFormat("da-DK", { maximumFractionDigits: 0 }).format(row.amount);
    return `Kr. ${amount},-${row.unit ? ` ${row.unit}` : ""}`;
  }

  function renderPriceRows() {
    const fragment = document.createDocumentFragment();
    priceRows.forEach((item) => {
      const tr = document.createElement("tr");
      const nameCell = document.createElement("td");
      const title = document.createElement("strong");
      title.textContent = item.title;
      nameCell.appendChild(title);
      if (item.description) {
        const description = document.createElement("small");
        description.textContent = item.description;
        nameCell.appendChild(description);
      }
      const amountCell = document.createElement("td");
      amountCell.className = "admin-price-amount";
      amountCell.textContent = formatAdminPrice(item);
      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "admin-price-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Rediger";
      edit.dataset.priceAction = "edit";
      edit.dataset.priceId = item.id;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Slet";
      remove.dataset.priceAction = "delete";
      remove.dataset.priceId = item.id;
      actions.append(edit, remove);
      actionCell.appendChild(actions);
      tr.append(nameCell, amountCell, actionCell);
      fragment.appendChild(tr);
    });
    priceRowsBody.replaceChildren(fragment);
    priceCount.textContent = `${priceRows.length} ydelser i prisbladet`;
  }

  function clearPriceEditor() {
    priceForm.reset();
    priceRowIdInput.value = "";
    priceFormHeading.textContent = "Tilføj pris";
    priceFormSubmit.textContent = "Tilføj pris";
    priceFormCancel.hidden = true;
  }

  function markPriceDirty() {
    hasUnsavedPriceChanges = true;
    priceSaveButton.disabled = false;
    priceChangeState.textContent = "Du har prisændringer, som ikke er gemt";
    priceSaveHelp.textContent = "Når du gemmer, starter et separat GitHub Actions-workflow. Det opdaterer kun generalforsamling/prisblad.json og ændrer ikke parkeringsdataene.";
  }

  function applyPriceData(data) {
    priceRows = normalizePriceRows(data.rows);
    priceUpdatedAt = data.updatedAt || null;
    hasUnsavedPriceChanges = false;
    clearPriceEditor();
    renderPriceRows();
    priceSaveButton.disabled = true;
    priceChangeState.textContent = "Ingen ikke-gemte prisændringer";
    priceSaveHelp.textContent = priceUpdatedAt
      ? `Seneste gemte prisændring: ${new Intl.DateTimeFormat("da-DK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(priceUpdatedAt))}. Kun prisbladet gemmes, separat fra parkering.`
      : "Prisbladet indeholder de gældende ydelser og priser.";
  }

  async function loadCurrentPriceData() {
    const data = await fetchPublicPriceData();
    applyPriceData(data);
    setStatus(priceStatus, "Prisbladet er indlæst fra repositoryet bestyrelsen.", "success");
  }

  async function loadCurrentData() {
    const data = await fetchPublicData();
    applyData(data);
    setStatus(mainStatus, "Alle 69 adresser er indlæst fra repositoryet bestyrelsen.", "success");
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
      const githubUser = await verifyGitHubToken(candidateToken);
      sessionToken = candidateToken;
      await Promise.all([loadCurrentData(), loadCurrentPriceData()]);
      signedInAs.textContent = `GitHub-token bekræftet for ${githubUser.login}.`;
      loginView.hidden = true;
      adminView.hidden = false;
      setStatus(mainStatus, "Du er logget ind. Parkeringsdata og prisblad er indlæst.", "success");
    } catch (error) {
      sessionToken = "";
      setStatus(loginStatus, error.message || "Login mislykkedes.", "error");
    } finally {
      loginButton.disabled = false;
    }
  });

  addressInput.addEventListener("change", updateRegistrationField);
  vehicleTypeInput.addEventListener("change", updateRegistrationField);

  rowForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selection = getSelectedRow();
    if (!selection) {
      setStatus(mainStatus, "Vælg først en adresse og køretøjstype.", "error");
      return;
    }

    const { row, key, value: currentValue } = selection;
    if (!currentValue) {
      // Første tilmelding: datoen sættes automatisk til dansk dags dato.
      row[key] = formatTodayInCopenhagen();
      setStatus(mainStatus, `${row.address} er tilmeldt ventelisten for ${key === "car" ? "bil" : "MC/scooter"} med datoen ${row[key]}.`);
    } else {
      const nextValue = registrationInput.value.trim();
      if (!nextValue) {
        setStatus(mainStatus, "Feltet kan ikke gemmes tomt her. Brug Ryd felt, hvis registreringen skal fjernes.", "error");
        return;
      }
      if (nextValue === currentValue) {
        setStatus(mainStatus, "Værdien er uændret.");
        return;
      }
      row[key] = nextValue;
      setStatus(mainStatus, `${row.address}: værdien er opdateret. Husk at gemme ændringerne.`);
    }

    renderRows();
    updateRegistrationField();
    markDirty();
  });

  rowClear.addEventListener("click", () => {
    const selection = getSelectedRow();
    if (!selection || !selection.value) return;
    const { row, key, value } = selection;
    if (!window.confirm(`Vil du fjerne værdien “${value}” for ${row.address} (${key === "car" ? "Bil" : "MC/scooter"})? Adressen bliver stående i oversigten.`)) return;
    row[key] = "";
    renderRows();
    updateRegistrationField();
    markDirty();
    setStatus(mainStatus, `Registreringen for ${row.address} er fjernet fra kladden. Adressen er bevaret. Husk at gemme.`);
  });

  rowsBody.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="select"]');
    if (!button) return;
    const row = rows.find((item) => item.id === button.dataset.rowId);
    if (!row) return;
    addressInput.value = row.address;
    vehicleTypeInput.value = button.dataset.vehicleType;
    updateRegistrationField();
    document.querySelector(".admin-editor-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    registrationInput.focus();
  });

  rowCancel.addEventListener("click", clearEditor);

  refreshButton.addEventListener("click", async () => {
    if ((hasUnsavedChanges || hasUnsavedPriceChanges) && !window.confirm("Dine ikke-gemte ændringer i parkering eller prisblad bliver kasseret. Vil du fortsætte?")) return;
    refreshButton.disabled = true;
    priceRefreshButton.disabled = true;
    setStatus(mainStatus, "Genindlæser parkeringsdata og prisblad …");
    try {
      await Promise.all([loadCurrentData(), loadCurrentPriceData()]);
      setStatus(mainStatus, "Parkeringsdata og prisblad er genindlæst.", "success");
    } catch (error) { setStatus(mainStatus, error.message || "Data kunne ikke genindlæses.", "error"); }
    finally { refreshButton.disabled = false; priceRefreshButton.disabled = false; }
  });

  priceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = priceRowIdInput.value.trim();
    const title = priceTitleInput.value.trim();
    const description = priceDescriptionInput.value.trim();
    const amount = Number(priceAmountInput.value);
    const unit = priceUnitInput.value.trim();
    if (!title || title.length > 160 || description.length > 400 || !Number.isInteger(amount) || amount < 0 || amount > 1000000 || unit.length > 40) {
      setStatus(priceStatus, "Kontrollér ydelse, beskrivelse og pris. Prisen skal være et helt beløb mellem 0 og 1.000.000 kr.", "error");
      return;
    }
    if (id) {
      const index = priceRows.findIndex((item) => item.id === id);
      if (index < 0) { setStatus(priceStatus, "Den valgte prispost findes ikke længere. Genindlæs prisbladet.", "error"); return; }
      priceRows[index] = { id, title, description, amount, unit };
      setStatus(priceStatus, `“${title}” er ændret i kladden. Husk at gemme prisbladet.`);
    } else {
      if (priceRows.length >= 100) {
        setStatus(priceStatus, "Prisbladet kan højst indeholde 100 ydelser.", "error");
        return;
      }
      const newId = `price-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      priceRows.push({ id: newId, title, description, amount, unit });
      setStatus(priceStatus, `“${title}” er tilføjet i kladden. Husk at gemme prisbladet.`);
    }
    clearPriceEditor();
    renderPriceRows();
    markPriceDirty();
  });

  priceRowsBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-price-action]");
    if (!button) return;
    const item = priceRows.find((row) => row.id === button.dataset.priceId);
    if (!item) return;
    if (button.dataset.priceAction === "edit") {
      priceRowIdInput.value = item.id;
      priceTitleInput.value = item.title;
      priceDescriptionInput.value = item.description;
      priceAmountInput.value = String(item.amount);
      priceUnitInput.value = item.unit;
      priceFormHeading.textContent = "Rediger pris";
      priceFormSubmit.textContent = "Opdater pris";
      priceFormCancel.hidden = false;
      priceTitleInput.focus();
      document.querySelector(".admin-price-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (button.dataset.priceAction === "delete") {
      if (priceRows.length <= 1) {
        setStatus(priceStatus, "Prisbladet skal mindst indeholde én ydelse. Redigér den sidste række i stedet for at slette den.", "error");
        return;
      }
      if (!window.confirm(`Vil du slette “${item.title}” fra prisbladet? Ændringen træder først i kraft, når du gemmer.`)) return;
      priceRows = priceRows.filter((row) => row.id !== item.id);
      clearPriceEditor();
      renderPriceRows();
      markPriceDirty();
      setStatus(priceStatus, `“${item.title}” er fjernet fra kladden. Husk at gemme prisbladet.`);
    }
  });

  priceFormCancel.addEventListener("click", clearPriceEditor);

  priceRefreshButton.addEventListener("click", async () => {
    if (hasUnsavedPriceChanges && !window.confirm("Dine ikke-gemte prisændringer bliver kasseret. Vil du fortsætte?")) return;
    priceRefreshButton.disabled = true;
    setStatus(priceStatus, "Genindlæser prisblad …");
    try { await loadCurrentPriceData(); }
    catch (error) { setStatus(priceStatus, error.message || "Prisbladet kunne ikke genindlæses.", "error"); }
    finally { priceRefreshButton.disabled = false; }
  });

  priceSaveButton.addEventListener("click", async () => {
    if (!sessionToken || !hasUnsavedPriceChanges) return;
    priceSaveButton.disabled = true;
    priceRefreshButton.disabled = true;
    setStatus(priceStatus, "Sender prisændringerne til GitHub Actions …");
    try {
      const nextData = {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        rows: normalizePriceRows(priceRows)
      };
      await dispatchPriceWorkflow(sessionToken, nextData);
      const savedData = await fetchSavedPriceData(nextData.updatedAt);
      applyPriceData(savedData);
      setStatus(priceStatus, "Prisbladet er gemt. Kun generalforsamling/prisblad.json er opdateret.", "success");
    } catch (error) {
      priceSaveButton.disabled = !hasUnsavedPriceChanges;
      setStatus(priceStatus, error.message || "Prisbladet kunne ikke gemmes.", "error");
    } finally { priceRefreshButton.disabled = false; }
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
      await dispatchWorkflow(sessionToken, nextData);
      const savedData = await fetchSavedData(nextData.updatedAt);
      applyData(savedData);
      setStatus(mainStatus, "Ventelisten er gemt. Alle 69 adresser er bevaret, og kun data.json er opdateret.", "success");
    } catch (error) {
      saveButton.disabled = !hasUnsavedChanges;
      setStatus(mainStatus, error.message || "Ændringerne kunne ikke gemmes.", "error");
    } finally { refreshButton.disabled = false; }
  });

  function logout() {
    sessionToken = "";
    rows = [];
    updatedAt = null;
    hasUnsavedChanges = false;
    priceRows = [];
    priceUpdatedAt = null;
    hasUnsavedPriceChanges = false;
    tokenInput.value = "";
    loginView.hidden = false;
    adminView.hidden = true;
    loginForm.reset();
    usernameInput.value = SHARED_USERNAME;
    saveButton.disabled = true;
    priceSaveButton.disabled = true;
    clearPriceEditor();
    renderPriceRows();
    setStatus(priceStatus, "");
    setStatus(loginStatus, "Du er logget ud.");
    setStatus(mainStatus, "");
    clearEditor();
    renderRows();
  }

  logoutButton.addEventListener("click", () => {
    if ((hasUnsavedChanges || hasUnsavedPriceChanges) && !window.confirm("Du har ikke-gemte ændringer i parkering eller prisblad. Log ud alligevel?")) return;
    logout();
  });

  window.addEventListener("pagehide", () => { sessionToken = ""; });
  updateRegistrationField();
})();
