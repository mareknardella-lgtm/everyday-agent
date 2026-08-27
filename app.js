const STORAGE_KEY = "everyday-agent-state-v2";

const defaultState = {
  // `threshold` resta solo per compatibilità con vecchi salvataggi: la policy
  // generale usa la fiducia per la combinazione azione/controparte/contesto.
  threshold: 50,
  notificationLimit: 3,
  trustBaselineScore: 20,
  trustAutoExecuteScore: 85,
  trustReportScore: 55,
  trustMaxSpendEur: 400,
  trustDecayHalfLifeDays: 365,
  trustImportDiscount: 0.35,
  trustSensitiveCaps: { money: 60, health: 50, legal: 45, contract: 45, documents: 45, familyDocs: 45 },
  trustProfiles: {},
  trustInteractions: [],
  trustProposals: [],
  domainConsents: {},
  auditLog: [],
  auditHead: "",
  coldStart: { phase: "import", historicalImported: false, importedAt: "", source: "" },
  executionErrors: [],
  crisisEvents: [],
  autonomyReviews: [],
  computeEvents: [],
  businessMetrics: { automationsNeverDisabled: 0, automationsDisabled: 0, actionsExecuted: 0, executionErrors: 0, guaranteeCostEur: 0, revenueEur: 0 },
  manualMode: false,
  autonomousMoneyEnabled: false,
  moneySingleTransactionCapEur: 100,
  moneyMonthlyCapEur: 300,
  autonomyConsentRenewalDays: 180,
  auditRetentionDays: 365,
  businessPlan: "base",
  eventDrivenMonitoring: true,
  computeCostTargetEur: 0,
  completed: 0,
  pending: [],
  dismissed: [],
  customTasks: [],
  preferences: [],
  rejections: [],
  rejectionKeys: [],
  notificationsUsed: 0,
  notificationDate: "",
  queuedNotifications: [],
  deferred: [],
  digestTimes: ["08:00", "19:00"],
  boundaries: { payments: true, health: true, contracts: true, deletions: true },
  neverAutomate: [],
  integrations: { calendar: false, email: false, bank: false, grocery: false, home: false, health: false, bookings: false, familyDocs: false },
  notificationChannel: "push",
  context: "",
  smartDnd: true,
  subscriptions: [],
  silentCosts: [],
  hiddenDeadlines: [],
  documents: [],
  routingRules: {},
  emergencyDelegate: "",
  calibrationStartedAt: "",
  calibrationDays: 14,
  calibrationExtraNotifications: 2,
  paused: false,
  familyPermissions: { owner: { "*": ["all"] }, partner: {}, teen: {} },
  familyMembers: [],
  approvalCounts: {},
  automationSuggestions: [],
  technicalIssues: [],
  actionLog: [],
  undoLog: [],
  metrics: { notificationsAvoided: 0, timeSavedMinutes: 0, level3Total: 0, level3Deescalated: 0, level3Approved: 0, notificationsTotal: 0 },
  privacy: { retentionDays: 90, legalBasis: "consent", thirdPartySharing: false, policiesAcknowledged: false },
  seasonalPeriods: [
    { name: "Dichiarazione dei redditi", month: 5, day: 31, lead_days: 45 },
    { name: "Rientro a scuola", month: 9, day: 1, lead_days: 30 },
    { name: "Rinnovi di fine anno", month: 12, day: 1, lead_days: 45 }
  ],
  neverDo: [
    "Non parlerò mai con un medico, avvocato o consulente senza supervisione diretta.",
    "Non firmerò né accetterò mai contratti legalmente vincolanti in autonomia.",
    "Non modificherò mai testamenti o altri documenti legali.",
    "Non condividerò mai dati sanitari o finanziari senza il consenso del proprietario.",
    "Non supererò mai i tetti massimi di spesa, indipendentemente dalla fiducia.",
    "Non venderò né condividerò mai i tuoi dati per finalità commerciali.",
    "Non sostituirò mai una relazione umana né userò un framing affettivo."
  ],
  offboarding: { paused: false, handoverCreatedAt: "", handover: null, mode: "active" },
  policiesAcknowledged: false,
};

const state = loadState();
let toastTimer;

const API_BASE = window.EVERYDAY_AGENT_API || "/api";
const backend = {
  available: false,
  authenticated: false,
  csrfToken: "",
  stateVersion: null,
  user: null,
  workspace: null,
  syncing: false,
  syncQueued: false,
  syncTimer: null,
  syncSuspended: false,
  status: "Backend locale non rilevato: la dashboard resta sul dispositivo."
};

function todayKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const today = todayKey();
    const hasStoredNotificationDate = Object.prototype.hasOwnProperty.call(stored, "notificationDate");
    const sameDay = !hasStoredNotificationDate || stored.notificationDate === today;
    return {
      ...defaultState,
      ...stored,
      notificationsUsed: sameDay ? Number(stored.notificationsUsed ?? defaultState.notificationsUsed) : 0,
      notificationDate: today,
      integrations: { ...defaultState.integrations, ...(stored.integrations || {}) },
      boundaries: { ...defaultState.boundaries, ...(stored.boundaries || {}) },
      trustBaselineScore: Number(stored.trustBaselineScore ?? defaultState.trustBaselineScore),
      trustAutoExecuteScore: Number(stored.trustAutoExecuteScore ?? defaultState.trustAutoExecuteScore),
      trustReportScore: Number(stored.trustReportScore ?? defaultState.trustReportScore),
      trustMaxSpendEur: Number(stored.trustMaxSpendEur ?? defaultState.trustMaxSpendEur),
      trustDecayHalfLifeDays: Number(stored.trustDecayHalfLifeDays ?? defaultState.trustDecayHalfLifeDays),
      trustImportDiscount: Number(stored.trustImportDiscount ?? defaultState.trustImportDiscount),
      trustSensitiveCaps: { ...defaultState.trustSensitiveCaps, ...(stored.trustSensitiveCaps || {}) },
      trustProfiles: stored.trustProfiles && typeof stored.trustProfiles === "object" ? stored.trustProfiles : {},
      trustInteractions: Array.isArray(stored.trustInteractions) ? stored.trustInteractions : [],
      trustProposals: Array.isArray(stored.trustProposals) ? stored.trustProposals : [],
      domainConsents: stored.domainConsents && typeof stored.domainConsents === "object" ? stored.domainConsents : {},
      auditLog: Array.isArray(stored.auditLog) ? stored.auditLog : [],
      auditHead: String(stored.auditHead || ""),
      coldStart: { ...defaultState.coldStart, ...(stored.coldStart || {}) },
      executionErrors: Array.isArray(stored.executionErrors) ? stored.executionErrors : [],
      crisisEvents: Array.isArray(stored.crisisEvents) ? stored.crisisEvents : [],
      autonomyReviews: Array.isArray(stored.autonomyReviews) ? stored.autonomyReviews : [],
      computeEvents: Array.isArray(stored.computeEvents) ? stored.computeEvents : [],
      businessMetrics: { ...defaultState.businessMetrics, ...(stored.businessMetrics || {}) },
      manualMode: Boolean(stored.manualMode),
      autonomousMoneyEnabled: Boolean(stored.autonomousMoneyEnabled),
      moneySingleTransactionCapEur: Number(stored.moneySingleTransactionCapEur ?? defaultState.moneySingleTransactionCapEur),
      moneyMonthlyCapEur: Number(stored.moneyMonthlyCapEur ?? defaultState.moneyMonthlyCapEur),
      autonomyConsentRenewalDays: Number(stored.autonomyConsentRenewalDays ?? defaultState.autonomyConsentRenewalDays),
      auditRetentionDays: Number(stored.auditRetentionDays ?? defaultState.auditRetentionDays),
      businessPlan: stored.businessPlan || defaultState.businessPlan,
      eventDrivenMonitoring: stored.eventDrivenMonitoring !== false,
      computeCostTargetEur: Number(stored.computeCostTargetEur ?? defaultState.computeCostTargetEur),
      digestTimes: Array.isArray(stored.digestTimes) ? stored.digestTimes : [...defaultState.digestTimes],
      pending: Array.isArray(stored.pending) ? stored.pending : [...defaultState.pending],
      dismissed: Array.isArray(stored.dismissed) ? stored.dismissed : [],
      customTasks: Array.isArray(stored.customTasks) ? stored.customTasks : [],
      rejections: Array.isArray(stored.rejections) ? stored.rejections : [],
      rejectionKeys: Array.isArray(stored.rejectionKeys) ? stored.rejectionKeys : [],
      neverAutomate: Array.isArray(stored.neverAutomate) ? stored.neverAutomate : [],
      notificationChannel: stored.notificationChannel || defaultState.notificationChannel,
      queuedNotifications: Array.isArray(stored.queuedNotifications) ? stored.queuedNotifications : [],
      deferred: Array.isArray(stored.deferred) ? stored.deferred : [],
      subscriptions: Array.isArray(stored.subscriptions) ? stored.subscriptions : [],
      silentCosts: Array.isArray(stored.silentCosts) ? stored.silentCosts : [],
      hiddenDeadlines: Array.isArray(stored.hiddenDeadlines) ? stored.hiddenDeadlines : [],
      documents: Array.isArray(stored.documents) ? stored.documents : [],
      routingRules: stored.routingRules && typeof stored.routingRules === "object" ? stored.routingRules : {},
      emergencyDelegate: stored.emergencyDelegate || "",
      calibrationStartedAt: stored.calibrationStartedAt || "",
      calibrationDays: Number(stored.calibrationDays || defaultState.calibrationDays),
      calibrationExtraNotifications: Number(stored.calibrationExtraNotifications ?? defaultState.calibrationExtraNotifications),
      paused: Boolean(stored.paused || stored.offboarding?.paused),
      familyPermissions: stored.familyPermissions && typeof stored.familyPermissions === "object" ? stored.familyPermissions : structuredClone(defaultState.familyPermissions),
      familyMembers: Array.isArray(stored.familyMembers) ? stored.familyMembers : [],
      approvalCounts: stored.approvalCounts && typeof stored.approvalCounts === "object" ? stored.approvalCounts : {},
      automationSuggestions: Array.isArray(stored.automationSuggestions) ? stored.automationSuggestions : [],
      technicalIssues: Array.isArray(stored.technicalIssues) ? stored.technicalIssues : [],
      actionLog: Array.isArray(stored.actionLog) ? stored.actionLog : [],
      undoLog: Array.isArray(stored.undoLog) ? stored.undoLog : [],
      metrics: { ...defaultState.metrics, ...(stored.metrics || {}) },
      privacy: { ...defaultState.privacy, ...(stored.privacy || {}) },
      seasonalPeriods: Array.isArray(stored.seasonalPeriods) ? stored.seasonalPeriods : JSON.parse(JSON.stringify(defaultState.seasonalPeriods)),
      neverDo: Array.isArray(stored.neverDo) ? stored.neverDo : [...defaultState.neverDo],
      offboarding: { ...defaultState.offboarding, ...(stored.offboarding || {}) },
      policiesAcknowledged: Boolean(stored.policiesAcknowledged || stored.privacy?.policiesAcknowledged),
      neverDo: Array.isArray(stored.neverDo) && stored.neverDo.length ? stored.neverDo : [...defaultState.neverDo]
    };
  } catch (error) {
    return { ...defaultState, notificationDate: todayKey(), integrations: { ...defaultState.integrations }, boundaries: { ...defaultState.boundaries } };
  }
}

function saveState() {
  state.notificationDate = todayKey();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleBackendStateSync();
}

function backendErrorMessage(error) {
  return error?.message || "Il backend locale non ha completato la richiesta.";
}

async function backendRequest(path, { method = "GET", body, csrf = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (csrf && backend.csrfToken) headers["X-CSRF-Token"] = backend.csrfToken;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "same-origin",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (cause) {
    const error = new Error("Backend locale non raggiungibile. Avvialo con api_server.py --serve-static.");
    error.code = "backend_unavailable";
    error.cause = cause;
    throw error;
  }
  const raw = await response.text();
  let payload = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const detail = payload?.error || {};
    const error = new Error(detail.message || `Il backend ha risposto con ${response.status}.`);
    error.code = detail.code || `http_${response.status}`;
    error.details = detail.details || {};
    error.status = response.status;
    throw error;
  }
  return payload;
}

function setBackendSession(payload) {
  backend.available = true;
  backend.authenticated = Boolean(payload?.authenticated);
  backend.csrfToken = payload?.csrfToken || backend.csrfToken || "";
  backend.user = payload?.user || null;
  backend.workspace = payload?.workspace || null;
  backend.stateVersion = Number.isInteger(payload?.workspace?.stateVersion) ? payload.workspace.stateVersion : backend.stateVersion;
  backend.status = backend.authenticated
    ? `Connesso come ${backend.user?.name || "utente"}. I dati restano nel tuo backend locale.`
    : "Backend locale pronto: accedi o crea un account per sincronizzare lo spazio.";
  updateBackendAccountUI();
}

function mergeRemoteState(remote) {
  const stored = remote && typeof remote === "object" ? remote : {};
  return {
    ...defaultState,
    ...stored,
    integrations: { ...defaultState.integrations, ...(stored.integrations || {}) },
    boundaries: { ...defaultState.boundaries, ...(stored.boundaries || {}) },
    trustSensitiveCaps: { ...defaultState.trustSensitiveCaps, ...(stored.trustSensitiveCaps || {}) },
    trustProfiles: stored.trustProfiles && typeof stored.trustProfiles === "object" ? stored.trustProfiles : {},
    trustInteractions: Array.isArray(stored.trustInteractions) ? stored.trustInteractions : [],
    trustProposals: Array.isArray(stored.trustProposals) ? stored.trustProposals : [],
    domainConsents: stored.domainConsents && typeof stored.domainConsents === "object" ? stored.domainConsents : {},
    familyPermissions: stored.familyPermissions && typeof stored.familyPermissions === "object" ? stored.familyPermissions : structuredClone(defaultState.familyPermissions),
    metrics: { ...defaultState.metrics, ...(stored.metrics || {}) },
    privacy: { ...defaultState.privacy, ...(stored.privacy || {}) },
    businessMetrics: { ...defaultState.businessMetrics, ...(stored.businessMetrics || {}) },
    coldStart: { ...defaultState.coldStart, ...(stored.coldStart || {}) },
    offboarding: { ...defaultState.offboarding, ...(stored.offboarding || {}) },
    customTasks: Array.isArray(stored.customTasks) ? stored.customTasks : [],
    pending: Array.isArray(stored.pending) ? stored.pending : [],
    queuedNotifications: Array.isArray(stored.queuedNotifications) ? stored.queuedNotifications : [],
    deferred: Array.isArray(stored.deferred) ? stored.deferred : [],
    dismissed: Array.isArray(stored.dismissed) ? stored.dismissed : [],
    auditLog: Array.isArray(stored.auditLog) ? stored.auditLog : [],
    auditHead: String(stored.auditHead || ""),
    notificationDate: todayKey()
  };
}

function applyRemoteState(remote) {
  const next = mergeRemoteState(remote);
  backend.syncSuspended = true;
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  backend.syncSuspended = false;
  updatePersonalization();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  showOnboarding();
}

function updateBackendAccountUI() {
  const badge = document.getElementById("backendModeBadge");
  const status = document.getElementById("backendAccountStatus");
  const loginPanel = document.getElementById("backendUnauthenticatedPanel");
  const accountPanel = document.getElementById("backendAuthenticatedPanel");
  const identity = document.getElementById("backendIdentity");
  const version = document.getElementById("backendStateVersion");
  const syncStatus = document.getElementById("backendSyncStatus");
  if (badge) {
    badge.textContent = backend.authenticated ? "connesso" : backend.available ? "pronto" : "solo locale";
    badge.classList.toggle("active-badge", backend.authenticated);
  }
  if (status) status.textContent = backend.status;
  if (loginPanel) loginPanel.hidden = backend.authenticated;
  if (accountPanel) accountPanel.hidden = !backend.authenticated;
  if (identity) identity.textContent = backend.authenticated ? `${backend.user?.name || "Utente"} · ${backend.workspace?.role || "owner"}` : "";
  if (version) version.textContent = backend.authenticated ? `Versione spazio ${backend.stateVersion ?? 0}` : "";
  if (syncStatus) syncStatus.textContent = backend.authenticated ? backend.status : "I dati restano in localStorage finché non accedi al backend locale.";
  const topbarMode = document.getElementById("backendTopbarStatus");
  if (topbarMode) topbarMode.textContent = backend.authenticated ? "Backend locale" : "Locale";
}

function scheduleBackendStateSync() {
  if (!backend.authenticated || backend.syncSuspended || typeof window === "undefined") return;
  window.clearTimeout(backend.syncTimer);
  backend.syncTimer = window.setTimeout(() => { void syncStateToBackend(); }, 450);
}

async function syncStateToBackend({ notify = false } = {}) {
  if (!backend.authenticated || backend.syncSuspended) return false;
  if (backend.syncing) {
    backend.syncQueued = true;
    return false;
  }
  backend.syncing = true;
  try {
    const response = await backendRequest("/state", {
      method: "PUT",
      csrf: true,
      body: { state: JSON.parse(JSON.stringify(state)), version: backend.stateVersion ?? 0 }
    });
    backend.stateVersion = response.version;
    backend.status = `Sincronizzato nel backend locale alle ${new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}.`;
    if (notify) showToast("Spazio sincronizzato nel backend locale.");
    return true;
  } catch (error) {
    if (error.code === "state_conflict") {
      backend.stateVersion = Number.isInteger(error.details?.currentVersion) ? error.details.currentVersion : null;
      backend.status = "Un'altra sessione ha modificato lo spazio. Carica la copia server prima di salvare di nuovo.";
    } else if (error.code === "csrf_failed") {
      backend.status = "Sessione aggiornata: riprova la sincronizzazione.";
      await initializeBackend({ loadState: false, silent: true });
    } else {
      backend.status = backendErrorMessage(error);
    }
    if (notify) showToast(backend.status, "warning");
    return false;
  } finally {
    backend.syncing = false;
    updateBackendAccountUI();
    if (backend.syncQueued) {
      backend.syncQueued = false;
      void syncStateToBackend();
    }
  }
}

async function loadStateFromBackend({ initializeEmpty = false, notify = false } = {}) {
  if (!backend.authenticated) return false;
  try {
    const response = await backendRequest("/state");
    backend.stateVersion = response.version;
    const remote = response.state && typeof response.state === "object" ? response.state : {};
    if (Object.keys(remote).length) {
      applyRemoteState(remote);
      backend.status = "Spazio caricato dal backend locale.";
    } else if (initializeEmpty) {
      await syncStateToBackend({ notify: false });
      backend.status = "Nuovo spazio inizializzato con le regole presenti sul dispositivo.";
    } else {
      backend.status = "Lo spazio server è vuoto: puoi caricare i dati locali quando vuoi.";
    }
    if (notify) showToast(backend.status);
    updateBackendAccountUI();
    return true;
  } catch (error) {
    backend.status = backendErrorMessage(error);
    updateBackendAccountUI();
    if (notify) showToast(backend.status, "warning");
    return false;
  }
}

async function initializeBackend({ loadState = true, silent = false } = {}) {
  try {
    const session = await backendRequest("/session");
    setBackendSession(session);
    if (session.authenticated && loadState) await loadStateFromBackend({ initializeEmpty: false, notify: false });
  } catch (error) {
    backend.available = false;
    backend.authenticated = false;
    backend.csrfToken = "";
    backend.status = "Backend locale non rilevato: la dashboard resta sul dispositivo.";
    if (!silent) updateBackendAccountUI();
  }
}


function resetDailyNotifications() {
  if (state.notificationDate === todayKey()) return;
  state.notificationDate = todayKey();
  state.notificationsUsed = 0;
  state.queuedNotifications = [];
  saveState();
}

function getUserName() {
  return String(state.userName || "").trim();
}

function initialsFor(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "EA").toUpperCase();
}

function updatePersonalization() {
  const name = getUserName();
  const date = new Date();
  const formattedDate = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(date);
  document.getElementById("dashboardDate")?.replaceChildren(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  document.getElementById("todayLabel")?.replaceChildren(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
  const greeting = document.getElementById("greetingTitle");
  const copy = document.getElementById("greetingCopy");
  const initials = document.getElementById("profileInitials");
  if (greeting) greeting.innerHTML = `${name ? `Buongiorno, ${escapeHTML(name)}` : "Il tuo spazio"}<span class="title-period">.</span>`;
  if (copy) copy.textContent = name ? "Tutto pronto. Dimmi cosa vuoi delegare." : "Partiamo da ciò che vuoi affidarmi.";
  if (initials) initials.textContent = initialsFor(name);
}

function calibrationActive() {
  if (!state.calibrationStartedAt) return false;
  const elapsed = Date.now() - new Date(state.calibrationStartedAt).getTime();
  return Number.isFinite(elapsed) && elapsed < Number(state.calibrationDays || 14) * 86400000;
}

function calibrationMessage() {
  return calibrationActive() ? `Sto ancora calibrando la fiducia per singola combinazione: per i primi ${state.calibrationDays || 14} giorni potresti ricevere qualche notifica in più.` : "Calibrazione completata: ora applico la fiducia appresa caso per caso.";
}

function showOnboarding() {
  const backdrop = document.getElementById("onboardingBackdrop");
  if (!backdrop) return;
  if (getUserName() && state.policiesAcknowledged) {
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
    return;
  }
  const policyList = document.getElementById("onboardingNeverDoList");
  if (policyList) policyList.innerHTML = state.neverDo.map((item) => `<li>${escapeHTML(item)}</li>`).join("");
  const policyInput = document.getElementById("onboardingPoliciesAcknowledged");
  if (policyInput) policyInput.checked = Boolean(state.policiesAcknowledged);
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  window.setTimeout(() => document.getElementById("userNameInput")?.focus(), 80);
}

function setupOnboarding() {
  const backdrop = document.getElementById("onboardingBackdrop");
  const form = document.getElementById("onboardingForm");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("userNameInput")?.value.trim();
    const policiesAcknowledged = Boolean(document.getElementById("onboardingPoliciesAcknowledged")?.checked);
    if (!name || !policiesAcknowledged) return;
    state.userName = name;
    state.policiesAcknowledged = true;
    state.privacy = { ...state.privacy, policiesAcknowledged: true };
    if (!state.calibrationStartedAt) state.calibrationStartedAt = new Date().toISOString();
    saveState();
    updatePersonalization();
    updateDecisionCount();
    backdrop?.classList.remove("open");
    backdrop?.setAttribute("aria-hidden", "true");
    showToast(`Piacere di conoscerti, ${name}.`);
  });
  document.getElementById("editNameButton")?.addEventListener("click", () => {
    const input = document.getElementById("userNameInput");
    input.value = getUserName();
    const policyInput = document.getElementById("onboardingPoliciesAcknowledged");
    if (policyInput) policyInput.checked = Boolean(state.policiesAcknowledged);
    backdrop?.classList.add("open");
    backdrop?.setAttribute("aria-hidden", "false");
    input.focus();
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.querySelector("p").textContent = message;
  toast.querySelector("span").textContent = type === "warning" ? "!" : "✓";
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function updateDecisionCount() {
  const count = state.pending.length;
  const badge = document.getElementById("decisionBadge");
  const pendingCount = document.getElementById("pendingCount");
  const used = document.getElementById("notificationsUsed");
  const limit = document.getElementById("notificationLimitSummary");
  const silentCount = document.getElementById("silentCount");
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  if (pendingCount) pendingCount.textContent = `${count} decision${count === 1 ? "e" : "i"}`;
  if (used) used.textContent = state.notificationsUsed;
  if (limit) limit.textContent = state.notificationLimit;
  if (silentCount) silentCount.textContent = state.completed;
  const digestElementCount = document.getElementById("digestElementCount");
  if (digestElementCount) {
    const count = state.customTasks.length + state.pending.length;
    digestElementCount.textContent = `${count} element${count === 1 ? "o" : "i"}`;
  }
  const memorySummary = document.getElementById("memorySummary");
  const memoryScore = document.getElementById("memoryScore");
  const preferenceCount = state.preferences.length + state.neverAutomate.length;
  const trustValues = Object.values(state.trustProfiles || {}).map((item) => decayedTrustScore(item.score, item.lastInteractionAt));
  const trustAverage = trustValues.length ? trustValues.reduce((total, value) => total + value, 0) / trustValues.length : Number(state.trustBaselineScore || 20);
  if (memorySummary) memorySummary.textContent = trustValues.length ? `${trustValues.length} combinazion${trustValues.length === 1 ? "e" : "i"} di fiducia osservat${trustValues.length === 1 ? "a" : "e"}` : preferenceCount ? `${preferenceCount} preferenz${preferenceCount === 1 ? "a" : "e"} salvata` : "Nessuna storia di fiducia salvata";
  if (memoryScore) memoryScore.textContent = `${trustAverage.toFixed(0)}/100`;
  document.getElementById("calibrationStatus")?.replaceChildren(calibrationMessage());
  document.getElementById("calibrationBadge")?.toggleAttribute("hidden", !calibrationActive());
  const avoided = document.getElementById("kpiNotificationsAvoided");
  const saved = document.getElementById("kpiTimeSaved");
  const deescalation = document.getElementById("kpiDeescalation");
  if (avoided) avoided.textContent = state.metrics.notificationsAvoided;
  if (saved) saved.textContent = `${state.metrics.timeSavedMinutes} min`;
  if (deescalation) deescalation.textContent = state.metrics.level3Total ? `${Math.round((state.metrics.level3Deescalated / state.metrics.level3Total) * 100)}%` : "0%";
  updateGovernanceUI();
}

function parseAmount(value) {
  const normalized = String(value).trim();
  if (!normalized || !/^[0-9][0-9.,]*$/.test(normalized)) return null;
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    return lastComma > lastDot ? Number(normalized.replace(/\./g, "").replace(",", ".")) : Number(normalized.replace(/,/g, ""));
  }
  if (lastDot > -1) return /^\d{1,3}(?:\.\d{3})+$/.test(normalized) ? Number(normalized.replace(/\./g, "")) : Number(normalized);
  if (lastComma > -1) return /^\d{1,3}(?:,\d{3})+$/.test(normalized) ? Number(normalized.replace(/,/g, "")) : Number(normalized.replace(",", "."));
  return Number(normalized);
}

function extractAmount(message) {
  const match = message.match(/(?:€|euro)\s*([0-9]+(?:[.,][0-9]+)*)/i) || message.match(/([0-9]+(?:[.,][0-9]+)*)\s*(?:€|euro)/i);
  return match ? parseAmount(match[1]) : null;
}

function smartDndActive() {
  if (state.smartDnd === false) return false;
  const context = `${state.context || ""} ${state.calendarContext || ""}`.toLowerCase();
  return /viaggio|vacanza|festiv|weekend.*famigli|famigli.*weekend/.test(context);
}

function normalizeTrustPart(value, fallback) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return normalized || fallback;
}

function trustKey(actionType, counterparty, context) {
  return [
    normalizeTrustPart(actionType, "monitor"),
    normalizeTrustPart(counterparty, "unknown"),
    normalizeTrustPart(context, "default")
  ].join("|");
}

function parseTrustDate(value) {
  const date = new Date(value || 0);
  return Number.isFinite(date.getTime()) ? date : null;
}

function decayedTrustScore(score, lastInteractionAt, now = new Date()) {
  const baseline = Number(state.trustBaselineScore || 20);
  const last = parseTrustDate(lastInteractionAt);
  if (!last) return Math.max(0, Math.min(100, Number(score || baseline)));
  const days = Math.max(0, (now.getTime() - last.getTime()) / 86400000);
  const halfLife = Math.max(1, Number(state.trustDecayHalfLifeDays || 365));
  const factor = 0.5 ** (days / halfLife);
  return Math.max(0, Math.min(100, baseline + (Number(score || baseline) - baseline) * factor));
}

function trustActionGroup(actionType) {
  const normalized = normalizeTrustPart(actionType, "monitor");
  return ({ book: "booking", booking: "booking", reserve: "booking", repair: "home_service", maintenance: "home_service", renew: "renewal", renewal: "renewal", pay: "payment", payment: "payment", monitor: "monitoring" })[normalized] || normalized;
}

function inferActionType(message, category, explicitAction = "") {
  if (explicitAction) return normalizeTrustPart(explicitAction, "monitor");
  if (/prenot|ristorant|hotel|viaggi|trasport/.test(message)) return "book";
  if (/ripar|idraulic|manutenz|tecnic/.test(message)) return "repair";
  if (/rinnov|abbonament/.test(message)) return "renew";
  if (/pag|bollett|bonific|acquist|spes/.test(message)) return "pay";
  if (/lista|promemoria|archivi/.test(message)) return "update_list";
  return category === "general" ? "monitor" : "manage";
}

function extractCounterparty(message, explicitCounterparty = "") {
  if (explicitCounterparty) return String(explicitCounterparty).trim();
  const match = message.match(/(?:fornitore|idraulico|tecnico|gestore|ristorante|hotel|compagnia|presso|da)\s+([a-zà-ÿ0-9][a-zà-ÿ0-9 .'-]{1,42})/i);
  if (!match) return "unknown";
  const candidate = match[0].split(/\s+(?:per|con|nel|nella|entro|oggi|domani|e)\b/i)[0].trim();
  return candidate || "unknown";
}

function similarTrustProfile(actionType, counterparty, context) {
  const targetKey = trustKey(actionType, counterparty, context);
  const targetGroup = trustActionGroup(actionType);
  const candidates = Object.entries(state.trustProfiles || {}).map(([key, profile]) => {
    if (key === targetKey || !profile || trustActionGroup(profile.actionType || key.split("|")[0]) !== targetGroup) return null;
    const score = decayedTrustScore(profile.score, profile.lastInteractionAt);
    return score > Number(state.trustBaselineScore || 20) ? { key, profile, score } : null;
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  if (!candidates.length) return null;
  const source = candidates[0];
  const baseline = Number(state.trustBaselineScore || 20);
  const discount = Math.max(0, Math.min(1, Number(state.trustImportDiscount ?? 0.35)));
  return {
    key: targetKey,
    score: Number((baseline + (source.score - baseline) * discount).toFixed(2)),
    sourceKey: source.key,
    sourceScore: Number(source.score.toFixed(2)),
    discount,
    requiresExplicitConfirmation: true,
    neverLevelOne: true,
    reason: "fiducia importata da una combinazione simile, con sconto prudenziale"
  };
}

function getTrustProfile(actionType, counterparty = "unknown", context = "default") {
  const normalizedAction = normalizeTrustPart(actionType, "monitor");
  const normalizedCounterparty = normalizeTrustPart(counterparty, "unknown");
  const normalizedContext = normalizeTrustPart(context, "default");
  const key = trustKey(normalizedAction, normalizedCounterparty, normalizedContext);
  const stored = state.trustProfiles?.[key];
  if (stored && typeof stored === "object") {
    const score = decayedTrustScore(stored.score, stored.lastInteractionAt);
    return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, key, score: Number(score.toFixed(2)), rawScore: Number(stored.score || state.trustBaselineScore), interactions: Number(stored.interactions || 0), approvals: Number(stored.approvals || 0), rejections: Number(stored.rejections || 0), lastInteractionAt: stored.lastInteractionAt || "", source: stored.source || "observed", decayApplied: Number((Number(stored.score || state.trustBaselineScore) - score).toFixed(2)) };
  }
  const imported = similarTrustProfile(normalizedAction, normalizedCounterparty, normalizedContext);
  if (imported) return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, ...imported, rawScore: imported.score, interactions: 0, approvals: 0, rejections: 0, lastInteractionAt: "", source: "imported", decayApplied: 0 };
  return { actionType: normalizedAction, counterparty: normalizedCounterparty, context: normalizedContext, key, score: Number(state.trustBaselineScore || 20), rawScore: Number(state.trustBaselineScore || 20), interactions: 0, approvals: 0, rejections: 0, lastInteractionAt: "", source: "new", decayApplied: 0 };
}

function evaluateTrust({ actionType, counterparty, context, category }) {
  const profile = getTrustProfile(actionType, counterparty, context);
  const cap = state.trustSensitiveCaps?.[category];
  const effectiveScore = cap == null ? profile.score : Math.min(profile.score, Number(cap));
  const baseline = Number(state.trustBaselineScore || 20);
  const autoThreshold = Number(state.trustAutoExecuteScore || 85);
  const dynamicLimit = cap != null || effectiveScore <= baseline || autoThreshold <= baseline ? 0 : Number((effectiveScore >= autoThreshold ? Number(state.trustMaxSpendEur || 400) : Number(state.trustMaxSpendEur || 400) * (effectiveScore - baseline) / (autoThreshold - baseline)).toFixed(2));
  return { profile, actionType: profile.actionType, counterparty: profile.counterparty, context: profile.context, score: profile.score, effectiveScore, cap: cap == null ? null : Number(cap), dynamicSpendLimit: dynamicLimit, source: profile.source, importedProposal: profile.source === "imported" ? profile : null, hasSpecificCounterparty: profile.counterparty !== "unknown" };
}

function classifyRequest(message, metadata = {}) {
  resetDailyNotifications();
  const lower = String(message || "").toLowerCase();
  const amount = metadata.amount ?? extractAmount(lower);
  const category = metadata.category || (/ripar|idraulic|manutenz|tecnic|casa/.test(lower) ? "home" : /lista della spesa|prodott|comprare|ritiro|reso|prenot|consegna/.test(lower) ? "errands" : /bollett|budget|spes|pag|bonific|banc|assicur|abbonament|euro|€/.test(lower) ? "money" : /medic|salute|visita|ricetta|farmac|esam|terapia/.test(lower) ? "health" : /contratt|firma|legal|affitto|mutuo/.test(lower) ? "contract" : /famiglia|scuola|figli|compleanno|passaport/.test(lower) ? "family" : "home");
  const urgent = metadata.urgent ?? /urgent|subito|oggi|scade|scadenza|entro stasera|frode|sospett|anomalo/.test(lower);
  const suspicious = metadata.suspicious ?? /frode|sospett|anomalo|non riconosco|truff/.test(lower);
  const irreversible = metadata.irreversible ?? /cancell|elimin|annull|manda|invia denaro|bonific|firma|chiudi/.test(lower);
  const ambiguous = /non so|forse|consigliami|scegli tu|decidi tu|ambigua|ambiguità/.test(lower);
  const professionalAdvice = /diagnosi|diagnostic|cura|terapia|farmaco|dosaggio|sintomo|medico|consulenza legale|parere legale|avvocato|investi|investimento|consulenza finanziaria/.test(lower);
  const context = metadata.context || state.context || category;
  const counterparty = extractCounterparty(message, metadata.counterparty || metadata.provider || "");
  const actionType = inferActionType(lower, category, metadata.actionType || metadata.action || "");
  const trust = evaluateTrust({ actionType, counterparty, context, category });
  const contextDeferred = smartDndActive() && !urgent && !suspicious;
  const sensitive = ["money", "health", "contract", "legal", "documents", "familyDocs"].includes(category);
  const boundaryLocked = (category === "money" && state.boundaries?.payments !== false) || (category === "health" && state.boundaries?.health !== false) || (category === "contract" && state.boundaries?.contracts !== false);
  const permanentApproval = metadata.permanentAuthorization || /autorizzazione permanente|sempre autorizzat|in modo permanente|permanentemente/.test(lower);
  const explicitlyApproved = metadata.preapproved || /già autorizzat|autorizzazione permanente|sempre autorizzat|procedi autonomamente|come al solito|in modo permanente|permanentemente/.test(lower);
  const preapproved = explicitlyApproved && !irreversible && (!sensitive || (permanentApproval && !boundaryLocked));
  const trustLabel = `fiducia ${trust.score.toFixed(0)}/100 per ${trust.actionType} · ${trust.counterparty} · ${trust.context}`;
  let level = 3;
  let reason = "fiducia insufficiente per questa combinazione";

  if (state.paused) {
    reason = "agente in pausa: nessuna automazione viene eseguita";
  } else if (state.manualMode) {
    reason = "modalità manuale globale: hai scelto di approvare sempre";
  } else if (state.neverAutomate.some((item) => lower.includes(item.toLowerCase()))) {
    reason = "argomento escluso dall'automazione";
  } else if (state.rejectionKeys.includes(trust.profile.key) || (!state.rejectionKeys.length && state.rejections.some((item) => lower.includes(item.toLowerCase())))) {
    reason = "hai rifiutato in precedenza questa combinazione";
  } else if (suspicious) {
    reason = `attività sospetta: serve una verifica immediata · ${trustLabel}`;
  } else if (irreversible) {
    reason = `azione irreversibile o non reversibile · ${trustLabel}`;
  } else if (professionalAdvice) {
    reason = "richiesta sensibile: fornisco solo informazioni e rimando a un professionista";
  } else if (sensitive) {
    const cap = trust.cap == null ? "tetto di sicurezza attivo" : `tetto assoluto ${trust.cap}/100`;
    if (permanentApproval && !boundaryLocked) {
      level = 2;
      reason = `autorizzazione permanente registrata, ma ${cap}: mai esecuzione silenziosa`;
    } else {
      reason = `dominio sensibile: serve autorizzazione esplicita per questo caso · ${cap} · ${trustLabel}`;
    }
  } else if (urgent) {
    reason = `scadenza o evento urgente · ${trustLabel}`;
  } else if (contextDeferred && !sensitive && trust.effectiveScore >= Number(state.trustReportScore || 55)) {
    level = 2;
    reason = `Non disturbare intelligente attivo: attività non urgente rimandata al digest · ${trustLabel}`;
  } else if (ambiguous && !preapproved) {
    reason = `richiesta ambigua: serve una scelta esplicita · ${trustLabel}`;
  } else if (preapproved) {
    level = 1;
    reason = `autorizzazione esplicita già registrata e attività reversibile · ${trustLabel}`;
  } else if (trust.source === "imported") {
    reason = `${trustLabel}; proposta importata da una combinazione simile, serve conferma esplicita`;
  } else if (amount !== null && Number(amount) > trust.dynamicSpendLimit) {
    reason = `fiducia insufficiente: importo di € ${Number(amount).toFixed(2)} oltre il limite dinamico di € ${trust.dynamicSpendLimit.toFixed(2)} · ${trustLabel}`;
  } else if (trust.effectiveScore >= Number(state.trustAutoExecuteScore || 85) && trust.source !== "imported") {
    level = 1;
    reason = `fiducia sufficiente per agire autonomamente entro € ${trust.dynamicSpendLimit.toFixed(2)} · ${trustLabel}`;
  } else if (trust.effectiveScore >= Number(state.trustReportScore || 55)) {
    level = 2;
    reason = `fiducia sufficiente per eseguire e informare · ${trustLabel}`;
  } else if (!trust.hasSpecificCounterparty && amount === null && actionType === "monitor") {
    level = 2;
    reason = `attività locale a basso rischio · ${trustLabel}`;
  } else {
    reason = `${reason} · ${trustLabel}`;
  }

  return { category, amount, urgent, suspicious, ambiguous, professionalAdvice, irreversible, sensitive, contextDeferred, level, reason, notificationQueued: false, title: String(message || "").trim().replace(/^./, (char) => char.toUpperCase()), actionType, counterparty, trustContext: context, trustKey: trust.profile.key, trustScore: trust.score, trustEffectiveScore: trust.effectiveScore, trustCap: trust.cap, dynamicSpendLimit: trust.dynamicSpendLimit, trustSource: trust.source, importedTrustProposal: trust.importedProposal, hasSpecificCounterparty: trust.hasSpecificCounterparty, preapproved };
}

function defaultOutcomeForAnalysis(analysis) {
  if (analysis.suspicious) return "nessun pagamento viene eseguito finché non verifichi l'attività sospetta";
  if (/rinnov|abbonament/.test(analysis.title.toLowerCase())) return "il rinnovo resta fermo; se esiste un rinnovo automatico esterno, devi verificarne la scadenza con il fornitore";
  if (analysis.urgent) return "nessuna azione automatica viene eseguita e la scadenza resta a tuo carico";
  if (analysis.irreversible) return "l'azione irreversibile non viene eseguita";
  return "la richiesta resta in sospeso senza azioni esterne";
}

function assistantOptions(analysis) {
  if (analysis.professionalAdvice) return ["Mostro informazioni generali non vincolanti", "Rimando a un professionista qualificato"];
  if (analysis.suspicious) return ["Verifico la transazione e ti mostro i dettagli", "La segnalo come frode sospetta e non faccio altro"];
  if (analysis.category === "money") return ["La lascio in sospeso", "Confermo dopo aver controllato importo e beneficiario"];
  if (analysis.category === "health") return ["Creo solo il promemoria", "Ti mostro disponibilità e dettagli senza prenotare"];
  if (analysis.category === "home") return ["Rimando al fornitore preferito", "Confronto più opzioni prima di agire"];
  return ["Procedo con la richiesta", "La tengo nel prossimo digest"];
}

function buildAssistantReply(message, analysis) {
  const trustLine = `Fiducia dinamica: ${analysis.trustScore.toFixed(0)}/100 · ${analysis.actionType} · ${analysis.counterparty} · ${analysis.trustContext}`;
  if (analysis.level === 1) return `✅ Fiducia ${analysis.trustScore.toFixed(0)}/100 · ${analysis.title}\nLo gestisco in silenzio entro il limite dinamico di € ${analysis.dynamicSpendLimit.toFixed(0)}. La combinazione è reversibile e osservata.${calibrationActive() ? `\n${calibrationMessage()}` : ""}`;
  if (analysis.level === 2) return `✅ Fiducia ${analysis.trustScore.toFixed(0)}/100 · ${analysis.title}\n${analysis.contextDeferred ? "Modalità Non disturbare attiva: " : ""}Lo gestisco e lo includo nel prossimo digest. ${trustLine}`;
  const options = assistantOptions(analysis);
  const deadline = analysis.urgent ? "Scadenza: serve una risposta oggi." : "Scadenza: nessuna immediata.";
  const defaultOutcome = defaultOutcomeForAnalysis(analysis);
  const queueNote = analysis.notificationQueued ? "\nHo raggiunto il limite di notifiche attive: resta in coda nel digest." : "";
  const importedNote = analysis.trustSource === "imported" ? "\nHo importato solo una parte della fiducia da una combinazione simile: non abilita l'esecuzione silenziosa." : "";
  const capNote = analysis.trustCap == null ? "" : `\nTetto di sicurezza della categoria: ${analysis.trustCap}/100.`;
  return `⚠️ Serve una tua decisione · fiducia ${analysis.trustScore.toFixed(0)}/100: ${analysis.title}\nContesto: ${analysis.reason}.\nSe non rispondi: ${defaultOutcome}.\nOpzioni:\n1. ${options[0]}\n2. ${options[1]}\n${trustLine}${capNote}${importedNote}${deadline}${queueNote}${state.routingRules[analysis.category] ? `\nDelegata a: ${state.routingRules[analysis.category]}.` : ""}`;
}

function appendAssistantMessage(text, type = "agent-message") {
  const messages = document.getElementById("assistantMessages");
  if (!messages) return;
  const node = document.createElement("div");
  node.className = `assistant-message ${type}`;
  node.textContent = text;
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function getTaskLevel(task) {
  return Number(task.level || (task.preapproved ? 1 : 3));
}

function createTaskId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function permissionAllows(member, category, action = "approve") {
  const role = String(member || "owner").toLowerCase();
  const domain = String(category || "general").toLowerCase();
  const matrix = state.familyPermissions || {};
  if (!Object.keys(matrix).length) return role === "owner";
  const rolePermissions = matrix[role] || {};
  const values = [];
  [rolePermissions[domain], rolePermissions["*"]].forEach((value) => {
    if (Array.isArray(value)) values.push(...value);
    else if (value) values.push(value);
  });
  return values.map((value) => String(value).toLowerCase()).some((value) => [action, "manage", "all"].includes(value));
}

function recordApproval(task) {
  const key = task.trustKey || trustKey(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
  state.approvalCounts[key] = Number(state.approvalCounts[key] || 0) + 1;
  if (state.approvalCounts[key] >= 3 && !state.automationSuggestions.includes(task.title)) {
    state.automationSuggestions.push(task.title);
    return true;
  }
  return false;
}

function updateTrustProfile(task, outcome = "approved", responseTimeSeconds = null) {
  const actionType = task.actionType || inferActionType(String(task.title || "").toLowerCase(), task.category || "general", task.action || "");
  const counterparty = task.counterparty || task.provider || "unknown";
  const context = task.trustContext || task.context || task.category || "general";
  const key = task.trustKey || trustKey(actionType, counterparty, context);
  const current = getTrustProfile(actionType, counterparty, context);
  const before = Number(current.score || state.trustBaselineScore || 20);
  const normalizedOutcome = String(outcome).toLowerCase();
  const latency = responseTimeSeconds == null ? null : Math.max(0, Number(responseTimeSeconds));
  let delta = 0;
  if (["rejected", "reject", "no", "denied"].includes(normalizedOutcome)) delta = -30;
  else if (["error", "failed", "failure", "incident"].includes(normalizedOutcome)) delta = -40;
  else if (["approved", "approve", "yes", "accepted"].includes(normalizedOutcome)) {
    delta = latency == null ? 4 : latency <= 3600 ? 12 : latency <= 86400 ? 6 : latency <= 172800 ? 1 : 0;
  } else if (["deferred", "defer", "hesitated"].includes(normalizedOutcome)) delta = -2;
  const after = Math.max(0, Math.min(100, before + delta));
  const previous = state.trustProfiles[key] || {};
  state.trustProfiles[key] = {
    ...previous,
    actionType: normalizeTrustPart(actionType, "monitor"),
    counterparty: normalizeTrustPart(counterparty, "unknown"),
    context: normalizeTrustPart(context, "default"),
    score: Number(after.toFixed(2)),
    interactions: Number(previous.interactions || 0) + 1,
    approvals: Number(previous.approvals || 0) + (["approved", "approve", "yes", "accepted"].includes(normalizedOutcome) ? 1 : 0),
    rejections: Number(previous.rejections || 0) + (["rejected", "reject", "no", "denied"].includes(normalizedOutcome) ? 1 : 0),
    errors: Number(previous.errors || 0) + (["error", "failed", "failure", "incident"].includes(normalizedOutcome) ? 1 : 0),
    lastInteractionAt: new Date().toISOString(),
    lastResponseTimeSeconds: latency,
    source: "observed"
  };
  const interaction = { key, actionType: state.trustProfiles[key].actionType, counterparty: state.trustProfiles[key].counterparty, context: state.trustProfiles[key].context, outcome: normalizedOutcome, responseTimeSeconds: latency, scoreBefore: Number(before.toFixed(2)), delta, scoreAfter: Number(after.toFixed(2)), at: new Date().toISOString() };
  state.trustInteractions.unshift(interaction);
  task.trustScore = Number(after.toFixed(2));
  task.trustKey = key;
  task.trustSource = "observed";
  return interaction;
}

function trustInteractionLatency(task) {
  const createdAt = parseTrustDate(task.createdAt);
  return createdAt ? Math.max(0, (Date.now() - createdAt.getTime()) / 1000) : null;
}

function handleAssistantRequest(message) {
  const normalized = message.toLowerCase().trim();
  const requestedTitle = normalized.replace(/^(perché|perche|annulla|annullare|rifai|ripeti)\s*/, "").trim();
  if (/^(perché|perche)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle)) || state.customTasks.find((task) => task.status === "completed" || task.status === "approved");
    appendAssistantMessage(target ? `Spiegazione · ${target.title}: ${target.explanation || target.reason || "regola autorizzata e reversibile"}. Nessuna azione esterna viene eseguita dalla demo.` : "Non trovo ancora un'azione automatica da spiegare.");
    return;
  }
  if (/^(annulla|annullare)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle) && task.status !== "undone") || state.customTasks.find((task) => task.status === "completed" || task.status === "approved");
    if (target && (target.status === "completed" || target.status === "approved") && target.reversible !== false) {
      target.status = "undone";
      recordAuditEvent({ type: "action_undone", taskId: target.id });
      state.completed = Math.max(0, Number(state.completed || 0) - 1);
      state.undoLog.push({ taskId: target.id, action: "undo", at: new Date().toISOString(), source: "assistant" });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      appendAssistantMessage(`Ho annullato localmente “${target.title}”. Puoi dire “rifai” per ripristinarla.`);
    } else {
      appendAssistantMessage("Non posso annullare questa azione: richiede una procedura del servizio esterno o non è reversibile.");
    }
    return;
  }
  if (/^(rifai|ripeti)/.test(normalized)) {
    const target = state.customTasks.find((task) => requestedTitle && task.title.toLowerCase().includes(requestedTitle) && task.status === "undone") || state.customTasks.find((task) => task.status === "undone");
    if (target) {
      target.status = "completed";
      recordAuditEvent({ type: "action_redone", taskId: target.id });
      state.completed = Number(state.completed || 0) + 1;
      state.undoLog.push({ taskId: target.id, action: "redo", at: new Date().toISOString(), source: "assistant" });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      appendAssistantMessage(`Ho ripristinato localmente “${target.title}”.`);
    } else {
      appendAssistantMessage("Non trovo un'azione annullata da rifare.");
    }
    return;
  }
  const analysis = classifyRequest(message);
  const task = {
    id: createTaskId(),
    title: analysis.title,
    category: analysis.category,
    action: analysis.actionType,
    actionType: analysis.actionType,
    counterparty: analysis.counterparty,
    trustContext: analysis.trustContext,
    trustKey: analysis.trustKey,
    trustScore: analysis.trustScore,
    trustEffectiveScore: analysis.trustEffectiveScore,
    trustCap: analysis.trustCap,
    dynamicSpendLimit: analysis.dynamicSpendLimit,
    trustSource: analysis.trustSource,
    importedTrustProposal: analysis.importedTrustProposal,
    amount: analysis.amount,
    preapproved: analysis.preapproved,
    urgent: analysis.urgent,
    suspicious: analysis.suspicious,
    irreversible: analysis.irreversible,
    reversible: !analysis.irreversible,
    level: analysis.level,
    reason: analysis.reason,
    explanation: analysis.reason,
    notificationQueued: false,
    defaultOutcome: defaultOutcomeForAnalysis(analysis),
    routedTo: state.routingRules[analysis.category] || "",
    calibrationNotice: calibrationActive(),
    status: analysis.level === 3 ? "pending" : "completed",
    createdAt: new Date().toISOString()
  };
  if (analysis.importedTrustProposal && !state.trustProposals.some((item) => item.key === analysis.trustKey)) {
    state.trustProposals.unshift({ ...analysis.importedTrustProposal, createdAt: new Date().toISOString() });
  }
  state.customTasks.unshift(task);
  if (analysis.level === 1 || analysis.level === 2) {
    state.completed += 1;
    state.metrics.notificationsAvoided += calibrationActive() ? 0 : 1;
    state.metrics.timeSavedMinutes += analysis.level === 1 ? 5 : 3;
    state.businessMetrics.actionsExecuted = Number(state.businessMetrics.actionsExecuted || 0) + 1;
    state.businessMetrics.automationsNeverDisabled = Number(state.businessMetrics.automationsNeverDisabled || 0) + 1;
    state.computeEvents.push({ operation: "classify", units: 1, costEur: 0, model: "local-rules", at: new Date().toISOString() });
    if (calibrationActive()) state.metrics.calibrationNotifications = Number(state.metrics.calibrationNotifications || 0) + 1;
  } else {
    state.pending.push(task.id);
    state.metrics.level3Total += 1;
    if (analysis.urgent || analysis.suspicious || Number(state.notificationsUsed || 0) < Number(state.notificationLimit || 3)) {
      state.notificationsUsed = Number(state.notificationsUsed || 0) + 1;
      state.metrics.notificationsTotal += 1;
    } else {
      state.queuedNotifications.push(task.id);
      task.notificationQueued = true;
      analysis.notificationQueued = true;
    }
  }
  saveState();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  appendAssistantMessage(buildAssistantReply(message, analysis));
}

function navigate(viewName, updateHash = true) {
  const target = document.querySelector(`[data-view="${viewName}"]`);
  if (!target) return;
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active-view"));
  target.classList.add("active-view");
  document.querySelectorAll("[data-view-link]").forEach((link) => link.classList.toggle("active", link.dataset.viewLink === viewName));
  if (updateHash && window.location.hash !== `#${viewName}`) history.pushState({ view: viewName }, "", `#${viewName}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector(".sidebar")?.classList.remove("open");
}

function bindNavigation() {
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.dataset.viewLink);
    });
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.viewTarget));
  });
  window.addEventListener("popstate", () => navigate(window.location.hash.slice(1) || "dashboard", false));
  window.addEventListener("hashchange", () => navigate(window.location.hash.slice(1) || "dashboard", false));
  if (window.innerWidth <= 840) {
    document.getElementById("mobileMenuButton")?.addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }
}

function setupModal() {
  const backdrop = document.getElementById("modalBackdrop");
  const close = () => {
    backdrop.classList.remove("open");
    backdrop.setAttribute("aria-hidden", "true");
  };
  const open = (domain = "Generale") => {
    document.getElementById("modalTitle").textContent = `Aggiungi a ${domain}`;
    document.getElementById("modalCopy").textContent = "Dimmi cosa vuoi tenere sotto controllo.";
    const categoryByDomain = { Casa: "home", Denaro: "money", Salute: "health", Commissioni: "errands", Famiglia: "family", Contratti: "contract" };
    document.getElementById("taskCategory").value = categoryByDomain[domain] || "general";
    if (document.getElementById("taskCounterparty")) document.getElementById("taskCounterparty").value = "";
    if (document.getElementById("taskContext")) document.getElementById("taskContext").value = "";
    backdrop.classList.add("open");
    backdrop.setAttribute("aria-hidden", "false");
    window.setTimeout(() => document.getElementById("taskTitle").focus(), 80);
  };
  document.getElementById("addTaskButton")?.addEventListener("click", () => open());
  document.querySelectorAll(".add-generic-button").forEach((button) => button.addEventListener("click", () => open(button.dataset.domain)));
  document.getElementById("addCalendarButton")?.addEventListener("click", () => open("Calendario"));
  document.getElementById("addGroceryButton")?.addEventListener("click", () => open("Casa"));
  document.getElementById("addShoppingItem")?.addEventListener("click", () => open("Commissioni"));
  document.getElementById("modalClose")?.addEventListener("click", close);
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
  document.getElementById("taskForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    resetDailyNotifications();
    const title = document.getElementById("taskTitle").value.trim();
    const category = document.getElementById("taskCategory").value;
    const preapproved = document.getElementById("taskPreapproved").checked;
    const amountInput = document.getElementById("taskAmount").value.trim();
    const amount = amountInput ? parseAmount(amountInput) : null;
    const counterparty = document.getElementById("taskCounterparty")?.value.trim() || "unknown";
    const taskContext = document.getElementById("taskContext")?.value.trim() || category;
    const irreversible = document.getElementById("taskIrreversible").checked;
    const urgent = document.getElementById("taskUrgent").checked;
    if (!title) return;
    const analysis = classifyRequest(title, { category, amount, counterparty, context: taskContext, preapproved, irreversible, urgent });
    const createdAt = new Date().toISOString();
    const task = {
      title, category, amount, preapproved: analysis.preapproved, level: analysis.level,
      action: analysis.actionType, actionType: analysis.actionType, counterparty: analysis.counterparty,
      trustContext: analysis.trustContext, trustKey: analysis.trustKey, trustScore: analysis.trustScore,
      trustEffectiveScore: analysis.trustEffectiveScore, trustCap: analysis.trustCap,
      dynamicSpendLimit: analysis.dynamicSpendLimit, trustSource: analysis.trustSource,
      importedTrustProposal: analysis.importedTrustProposal, irreversible, reversible: !irreversible,
      urgent, suspicious: analysis.suspicious, sensitive: analysis.sensitive, familyImpact: category === "family",
      reason: analysis.reason, explanation: analysis.reason, notificationQueued: false,
      defaultOutcome: defaultOutcomeForAnalysis(analysis), id: createTaskId(), createdAt,
      status: analysis.level === 3 ? "pending" : "completed"
    };
    if (analysis.importedTrustProposal && !state.trustProposals.some((item) => item.key === analysis.trustKey)) {
      state.trustProposals.unshift({ ...analysis.importedTrustProposal, createdAt });
    }
    state.customTasks.unshift(task);
    if (analysis.level === 1 || analysis.level === 2) {
      state.completed += 1;
      state.metrics.notificationsAvoided += calibrationActive() ? 0 : 1;
      state.metrics.timeSavedMinutes += analysis.level === 1 ? 5 : 3;
      if (calibrationActive()) state.metrics.calibrationNotifications = Number(state.metrics.calibrationNotifications || 0) + 1;
      showToast(`“${title}” ${analysis.level === 1 ? "gestita in silenzio" : "inclusa nel digest"} · fiducia ${analysis.trustScore.toFixed(0)}/100`);
    } else {
      state.pending.push(task.id);
      state.metrics.level3Total += 1;
      if (urgent || analysis.suspicious || Number(state.notificationsUsed || 0) < Number(state.notificationLimit || 3)) {
        state.notificationsUsed = Number(state.notificationsUsed || 0) + 1;
        state.metrics.notificationsTotal += 1;
      } else {
        state.queuedNotifications.push(task.id);
        task.notificationQueued = true;
      }
      showToast(`“${title}” richiede una tua conferma · fiducia ${analysis.trustScore.toFixed(0)}/100`, "warning");
    }
    saveState();
    renderCustomTasks();
    renderCustomDecisions();
    updateDecisionCount();
    close();
    event.target.reset();
  });
}

function renderCustomDecisions() {
  const list = document.getElementById("decisionsList");
  if (!list) return;
  list.querySelectorAll(".custom-decision").forEach((node) => node.remove());
  const pendingTasks = state.customTasks.filter((task) => getTaskLevel(task) === 3 && state.pending.includes(task.id));
  list.querySelectorAll(":scope > .empty-list-state").forEach((node) => node.toggleAttribute("hidden", pendingTasks.length > 0));
  pendingTasks.forEach((task) => {
    const card = document.createElement("article");
    card.className = "decision-card custom-decision";
    card.dataset.decision = task.id;
    const defaultOutcome = task.defaultOutcome || "la richiesta resta in sospeso senza azioni esterne";
    const trust = getTrustProfile(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
    const trustScore = Number(task.trustScore ?? trust.score ?? state.trustBaselineScore);
    const trustCap = task.trustCap ?? state.trustSensitiveCaps?.[task.category];
    const trustLimit = Number(task.dynamicSpendLimit ?? 0);
    const trustSource = task.trustSource === "imported" || trust.source === "imported" ? "importata con cautela" : trust.source === "new" ? "combinazione nuova" : "storia osservata";
    const routeNote = task.routedTo ? `<div class="decision-meta">Instradata a <strong>${escapeHTML(task.routedTo)}</strong> · i permessi saranno verificati prima dell'approvazione.</div>` : "";
    const trustNote = `<div class="decision-trust"><div class="trust-line"><span>FIDUCIA · ${escapeHTML(trust.actionType)} · ${escapeHTML(trust.counterparty)}</span><strong>${trustScore.toFixed(0)}/100</strong></div><div class="trust-meter"><span style="width:${Math.max(0, Math.min(100, trustScore))}%"></span></div><small>${escapeHTML(trustSource)}${trustLimit ? ` · limite dinamico € ${trustLimit.toFixed(0)}` : ""}${trustCap != null ? ` · tetto ${trustCap}/100` : ""}</small></div>`;
    const importedNote = task.importedTrustProposal || trust.source === "imported" ? `<div class="trust-proposal">↗ Fiducia importata da una combinazione simile: richiede conferma esplicita e non abilita l'esecuzione silenziosa.</div>` : "";
    card.innerHTML = `<div class="decision-card-head"><div class="decision-category"><span class="decision-icon coral-tile">!</span><div><span class="card-kicker">RICHIESTA · FIDUCIA DINAMICA</span><h3>${escapeHTML(task.title)}</h3></div></div><span class="${task.urgent ? "urgent-label" : "date-label"}">${task.urgent ? "Urgente" : "Da decidere"}</span></div><p>Richiesta ricevuta dall'assistente. ${escapeHTML(task.reason || "Serve una decisione prima di procedere")}.</p>${trustNote}${importedNote}<div class="decision-outcome"><span>Se non rispondi</span><strong>${escapeHTML(defaultOutcome)}</strong></div>${routeNote}<label class="approver-select"><span>Chi può approvare</span><select class="decision-actor"><option value="owner">Tu · proprietario</option><option value="partner">Partner</option><option value="teen">Adolescente</option></select></label><div class="options-grid"><button class="decision-option selected" data-option="confirm" type="button"><span class="option-radio"></span><span><strong>Conferma la richiesta</strong><small>Nessuna azione esterna viene eseguita dalla demo</small></span></button><button class="decision-option" data-option="defer" type="button"><span class="option-radio"></span><span><strong>Tienila nel digest</strong><small>Rimandata senza esecuzione</small></span></button></div><div class="decision-actions"><button class="primary-button approve-decision" type="button">Registra scelta</button><button class="ghost-button defer-decision" type="button">Rimanda</button><button class="ghost-button reject-decision" type="button">Rifiuta</button></div>`;
    list.appendChild(card);
    if (state.deferred.includes(task.id)) card.classList.add("deferred");
    bindDecisionCard(card);
  });
}

function renderCustomTasks() {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;
  activityList.querySelectorAll(".custom-activity").forEach((node) => node.remove());
  if (!state.customTasks.length) {
    if (!activityList.querySelector(":scope > .empty-list-state")) activityList.innerHTML = `<div class="empty-list-state"><span>✦</span><strong>Nessuna attività ancora</strong><small>Le azioni dell’agente appariranno qui.</small></div>`;
    return;
  }
  activityList.querySelectorAll(":scope > .empty-list-state").forEach((node) => node.remove());
  state.customTasks.slice(0, 5).forEach((task, index) => {
    const row = document.createElement("article");
    row.className = "activity-row custom-activity";
    const level = `Fascia ${getTaskLevel(task)}`;
    const levelClass = getTaskLevel(task) === 1 ? "level-one" : getTaskLevel(task) === 2 ? "level-two" : "level-three";
    const symbolClass = getTaskLevel(task) === 1 ? "mint-symbol" : getTaskLevel(task) === 2 ? "blue-symbol" : "coral-symbol";
    const symbol = getTaskLevel(task) === 1 ? "✓" : getTaskLevel(task) === 2 ? "◷" : "!";
    const profile = getTrustProfile(task.actionType || task.action || "monitor", task.counterparty || task.provider || "unknown", task.trustContext || task.context || task.category || "general");
    const trustScore = Number(task.trustScore ?? profile.score ?? state.trustBaselineScore);
    const isResolved = state.dismissed.includes(task.id) || task.status === "approved" || task.status === "completed";
    const isDeferred = state.deferred.includes(task.id) || task.status === "deferred";
    const isUndone = task.status === "undone";
    const status = isUndone ? "Annullata · puoi rifarla" : getTaskLevel(task) === 1 ? "Autorizzata" : isResolved ? "Scelta registrata" : isDeferred ? "Nel prossimo digest" : getTaskLevel(task) === 2 ? "Nel prossimo digest" : "In attesa di conferma";
    const actionButtons = isResolved || isUndone ? `<div class="activity-actions"><button class="mini-action explain-action" data-task-id="${escapeHTML(task.id)}" type="button">Perché?</button>${isUndone ? `<button class="mini-action redo-action" data-task-id="${escapeHTML(task.id)}" type="button">Rifai</button>` : task.reversible === false ? "" : `<button class="mini-action undo-action" data-task-id="${escapeHTML(task.id)}" type="button">Annulla</button>`}</div>` : "";
    row.innerHTML = `<div class="activity-symbol ${symbolClass}">${symbol}</div><div class="activity-main"><strong>${escapeHTML(task.title)}</strong><span>Aggiunta ora · ${status}</span>${actionButtons}</div><span class="activity-time">ora</span><span class="trust-tag" title="Fiducia per questa combinazione">${trustScore.toFixed(0)}/100</span>`;
    activityList.insertBefore(row, activityList.firstChild);
    row.querySelector(".explain-action")?.addEventListener("click", () => showToast(`Regola applicata: ${task.explanation || task.reason || "attività autorizzata e reversibile"}.`, "info"));
    row.querySelector(".undo-action")?.addEventListener("click", () => {
      task.status = "undone";
      recordAuditEvent({ type: "action_undone", taskId: task.id });
      state.completed = Math.max(0, Number(state.completed || 0) - 1);
      state.undoLog.push({ taskId: task.id, action: "undo", at: new Date().toISOString() });
      state.actionLog.push({ taskId: task.id, action: "undo", at: new Date().toISOString() });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      showToast(`“${task.title}” annullata localmente.`, "warning");
    });
    row.querySelector(".redo-action")?.addEventListener("click", () => {
      task.status = "completed";
      recordAuditEvent({ type: "action_redone", taskId: task.id });
      state.completed = Number(state.completed || 0) + 1;
      state.undoLog.push({ taskId: task.id, action: "redo", at: new Date().toISOString() });
      state.actionLog.push({ taskId: task.id, action: "redo", at: new Date().toISOString() });
      saveState();
      renderCustomTasks();
      updateDecisionCount();
      showToast(`“${task.title}” ripristinata.`);
    });
    if (index === 4) return;
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function bindDecisionCard(card) {
  card.querySelectorAll(".decision-option").forEach((option) => option.addEventListener("click", () => {
    card.querySelectorAll(".decision-option").forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
  }));
  card.querySelector(".approve-decision")?.addEventListener("click", () => {
    const choice = card.querySelector(".decision-option.selected") || card.querySelector(".decision-option");
    if (choice?.dataset.option === "defer") {
      card.querySelector(".defer-decision")?.click();
      return;
    }
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    const actor = card.querySelector(".decision-actor")?.value || "owner";
    if (!customTask || !permissionAllows(actor, customTask.category)) {
      showToast("Questo membro non ha il permesso per approvare questo dominio.", "warning");
      return;
    }
    if (state.manualMode && actor !== "owner") {
      showToast("Modalità manuale globale: la conferma deve arrivare dal proprietario.", "warning");
      return;
    }
    const label = choice?.querySelector("strong")?.textContent || "opzione selezionata";
    state.pending = state.pending.filter((item) => item !== card.dataset.decision);
    state.queuedNotifications = state.queuedNotifications.filter((item) => item !== card.dataset.decision);
    state.deferred = state.deferred.filter((item) => item !== card.dataset.decision);
    if (!state.dismissed.includes(card.dataset.decision)) state.dismissed.push(card.dataset.decision);
    customTask.status = "approved";
    customTask.approvedBy = actor;
    updateTrustProfile(customTask, "approved", trustInteractionLatency(customTask));
    state.completed += 1;
    state.metrics.level3Approved += 1;
    state.businessMetrics.actionsExecuted = Number(state.businessMetrics.actionsExecuted || 0) + 1;
    state.businessMetrics.automationsNeverDisabled = Number(state.businessMetrics.automationsNeverDisabled || 0) + 1;
    recordAuditEvent({ type: "decision_approved", taskId: customTask.id, actor, trustScore: customTask.trustScore });
    const suggested = recordApproval(customTask);
    card.classList.add("completed");
    card.querySelector(".decision-actions").innerHTML = `<span class="trust-updated">Scelta registrata · ${escapeHTML(label)} · fiducia aggiornata a ${Number(customTask.trustScore || 0).toFixed(0)}/100</span>`;
    updateDecisionCount();
    saveState();
    renderCustomTasks();
    showToast(suggested ? "Approvazione ripetuta: vuoi trasformarla in una regola automatica?" : "Scelta registrata. Nessuna azione esterna è stata eseguita.");
  });
  card.querySelector(".defer-decision")?.addEventListener("click", () => {
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    if (customTask) {
      customTask.status = "deferred";
      updateTrustProfile(customTask, "deferred", trustInteractionLatency(customTask));
    }
    if (!state.deferred.includes(card.dataset.decision)) state.deferred.push(card.dataset.decision);
    if (!state.queuedNotifications.includes(card.dataset.decision)) state.queuedNotifications.push(card.dataset.decision);
    saveState();
    updateDecisionCount();
    showToast("Va bene. Te lo ricorderò nel prossimo digest.");
    card.classList.add("deferred");
  });
  card.querySelector(".reject-decision")?.addEventListener("click", () => {
    const customTask = state.customTasks.find((item) => item.id === card.dataset.decision);
    if (!customTask) return;
    updateTrustProfile(customTask, "rejected", trustInteractionLatency(customTask));
    recordAuditEvent({ type: "decision_rejected", taskId: customTask.id });
    customTask.status = "rejected";
    if (!state.rejections.includes(customTask.title)) state.rejections.push(customTask.title);
    if (!state.rejectionKeys.includes(customTask.trustKey)) state.rejectionKeys.push(customTask.trustKey);
    state.pending = state.pending.filter((item) => item !== customTask.id);
    state.queuedNotifications = state.queuedNotifications.filter((item) => item !== customTask.id);
    state.deferred = state.deferred.filter((item) => item !== customTask.id);
    saveState();
    renderCustomDecisions();
    renderCustomTasks();
    updateDecisionCount();
    showToast(`Rifiuto memorizzato: la fiducia è scesa a ${Number(customTask.trustScore || 0).toFixed(0)}/100.`, "warning");
  });
}

function setupDecisions() {
  document.querySelectorAll(".decision-card").forEach(bindDecisionCard);
  state.deferred.forEach((id) => {
    const card = document.querySelector(`[data-decision="${id}"]`);
    if (card) card.classList.add("deferred");
  });
  state.dismissed.forEach((id) => {
    const card = document.querySelector(`[data-decision="${id}"]`);
    if (card) {
      card.classList.add("completed");
      const action = card.querySelector(".decision-actions");
      if (action) action.innerHTML = '<span class="level-tag level-one">Decisione già registrata</span>';
    }
  });
  renderCustomDecisions();
  updateDecisionCount();
}

function setupCalendar() {
  const calendar = document.getElementById("calendarDays");
  if (!calendar) return;
  const days = [27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 1, 2, 3, 4, 5, 6];
  days.forEach((day, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `calendar-day ${index < 5 || index > 35 ? "muted" : ""} ${day === 25 && index === 29 ? "today" : ""}`;
    button.innerHTML = `<span class="day-number">${day}</span>`;
    button.addEventListener("click", () => showToast(`${day} agosto 2026 · Puoi aggiungere un evento qui.`));
    calendar.appendChild(button);
  });
}

function setupGrocery() {
  document.querySelectorAll(".check-line input").forEach((input) => input.addEventListener("change", () => {
    input.closest(".check-line").classList.toggle("checked", input.checked);
    const total = document.querySelectorAll(".check-line").length;
    const checked = document.querySelectorAll(".check-line input:checked").length;
    const progress = document.querySelector(".shopping-progress");
    const bar = document.querySelector(".shopping-progress-bar span");
    if (progress) progress.textContent = `${checked} / ${total}`;
    if (bar) bar.style.width = `${(checked / total) * 100}%`;
    showToast(input.checked ? "Prodotto segnato come acquistato." : "Prodotto rimosso dagli acquistati.");
  }));
}

function setupAssistant() {
  const form = document.getElementById("assistantForm");
  const input = document.getElementById("assistantInput");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    appendAssistantMessage(message, "user-message");
    input.value = "";
    window.setTimeout(() => handleAssistantRequest(message), 180);
  });
  document.getElementById("assistantFab")?.addEventListener("click", () => {
    document.getElementById("assistantCard")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => input?.focus(), 350);
  });
}

function renderDigestPreview() {
  const content = document.getElementById("digestPreviewContent");
  if (!content) return;
  const pending = state.pending.length;
  const recent = state.customTasks.slice(0, 4);
  const queued = state.queuedNotifications.length;
  const elementCount = state.completed + pending + queued;
  document.getElementById("digestElementCount")?.replaceChildren(`${elementCount} element${elementCount === 1 ? "o" : "i"}`);
  content.innerHTML = `<div class="digest-preview-row"><span>✅ Fatto</span><strong>${state.completed} attività gestite</strong></div><div class="digest-preview-row"><span>👀 Da monitorare</span><strong>${pending} decision${pending === 1 ? "e" : "i"}</strong></div><div class="digest-preview-row"><span>🔕 In coda</span><strong>${queued} notific${queued === 1 ? "a" : "he"}</strong></div><div class="digest-preview-row"><span>🔒 Privacy</span><strong>Nessuna azione esterna</strong></div>${recent.length ? `<div class="digest-preview-list">${recent.map((task) => `<span>${escapeHTML(task.title)}</span>`).join("")}</div>` : ""}`;
}

function setupDigest() {
  const digestBackdrop = document.getElementById("digestBackdrop");
  const closeDigest = () => {
    digestBackdrop?.classList.remove("open");
    digestBackdrop?.setAttribute("aria-hidden", "true");
  };
  document.getElementById("previewDigestButton")?.addEventListener("click", () => {
    renderDigestPreview();
    digestBackdrop?.classList.add("open");
    digestBackdrop?.setAttribute("aria-hidden", "false");
  });
  document.getElementById("digestClose")?.addEventListener("click", closeDigest);
  document.getElementById("digestCloseButton")?.addEventListener("click", closeDigest);
  document.getElementById("clearActivityButton")?.addEventListener("click", (event) => {
    event.currentTarget.textContent = "Tutto letto ✓";
    showToast("Attività archiviate nel digest serale.");
  });
}

function setupBackendAccount() {
  const view = document.getElementById("view-settings");
  const settingsLayout = view?.querySelector(".settings-layout");
  if (!view || !settingsLayout || document.getElementById("backendAccountPanel")) return;
  const panel = document.createElement("section");
  panel.className = "glass-panel backend-account-panel";
  panel.id = "backendAccountPanel";
  panel.innerHTML = `
    <div class="section-heading no-margin">
      <div>
        <span class="card-kicker">BACKEND LOCALE</span>
        <h2>Spazio protetto</h2>
        <span class="muted-label">Account, sessioni e stato persistente sul tuo computer.</span>
      </div>
      <span class="governance-badge" id="backendModeBadge">solo locale</span>
    </div>
    <p class="backend-account-copy" id="backendAccountStatus">Avvia il backend locale per creare un account e salvare lo spazio in SQLite.</p>
    <div id="backendUnauthenticatedPanel" class="backend-auth-layout">
      <form class="backend-auth-form" id="backendRegisterForm">
        <strong>Crea account locale</strong>
        <label>Nome<input id="backendRegisterName" autocomplete="name" maxlength="80" required /></label>
        <label>Email<input id="backendRegisterEmail" autocomplete="email" type="email" maxlength="254" required /></label>
        <label>Password<input id="backendRegisterPassword" autocomplete="new-password" type="password" minlength="12" maxlength="256" required /></label>
        <label class="form-check backend-policy-check"><input id="backendRegisterPolicy" type="checkbox" required /> <span>Accetto i confini operativi e il salvataggio locale.</span></label>
        <button class="primary-button" type="submit">Crea spazio protetto</button>
      </form>
      <form class="backend-auth-form" id="backendLoginForm">
        <strong>Accedi al backend</strong>
        <label>Email<input id="backendLoginEmail" autocomplete="email" type="email" maxlength="254" required /></label>
        <label>Password<input id="backendLoginPassword" autocomplete="current-password" type="password" maxlength="256" required /></label>
        <button class="outline-button" type="submit">Accedi</button>
        <small>La password non viene memorizzata dalla dashboard; il server conserva solo un hash scrypt.</small>
      </form>
    </div>
    <div id="backendAuthenticatedPanel" class="backend-authenticated" hidden>
      <div><strong id="backendIdentity"></strong><small id="backendStateVersion"></small></div>
      <div class="backend-account-actions">
        <button class="outline-button" id="backendSyncButton" type="button">Sincronizza ora</button>
        <button class="ghost-button" id="backendLoadButton" type="button">Carica server</button>
        <button class="ghost-button" id="backendLogoutButton" type="button">Esci</button>
      </div>
    </div>
    <small class="backend-security-note" id="backendSyncStatus">I dati restano in localStorage finché non accedi al backend locale.</small>
    <div class="backend-security-note backend-boundary-note"><span>◈</span><span>Il backend non contiene token bancari, non contatta terzi e blocca esecuzioni esterne. Per la produzione servono TLS, vault dei segreti, OAuth/PSD2 e review di sicurezza.</span></div>
  `;
  settingsLayout.insertAdjacentElement("afterend", panel);

  const registerName = document.getElementById("backendRegisterName");
  if (registerName) registerName.value = getUserName();
  document.getElementById("backendRegisterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await backendRequest("/auth/register", {
        method: "POST",
        body: {
          name: document.getElementById("backendRegisterName")?.value.trim(),
          email: document.getElementById("backendRegisterEmail")?.value.trim(),
          password: document.getElementById("backendRegisterPassword")?.value,
          policiesAcknowledged: Boolean(document.getElementById("backendRegisterPolicy")?.checked)
        }
      });
      setBackendSession(response);
      await syncStateToBackend({ notify: false });
      showToast("Spazio protetto creato e sincronizzato nel backend locale.");
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
    }
  });
  document.getElementById("backendLoginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const response = await backendRequest("/auth/login", {
        method: "POST",
        body: {
          email: document.getElementById("backendLoginEmail")?.value.trim(),
          password: document.getElementById("backendLoginPassword")?.value
        }
      });
      setBackendSession(response);
      await loadStateFromBackend({ initializeEmpty: false, notify: false });
      showToast("Accesso eseguito. Puoi scegliere se usare i dati server o sincronizzare quelli locali.");
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
    }
  });
  document.getElementById("backendSyncButton")?.addEventListener("click", () => { void syncStateToBackend({ notify: true }); });
  document.getElementById("backendLoadButton")?.addEventListener("click", () => { void loadStateFromBackend({ initializeEmpty: false, notify: true }); });
  document.getElementById("backendLogoutButton")?.addEventListener("click", async () => {
    try {
      await backendRequest("/auth/logout", { method: "POST", body: {}, csrf: true });
    } catch (error) {
      showToast(backendErrorMessage(error), "warning");
      return;
    }
    backend.authenticated = false;
    backend.csrfToken = "";
    backend.user = null;
    backend.workspace = null;
    backend.stateVersion = null;
    backend.status = "Sessione chiusa. La copia locale della dashboard resta sul dispositivo.";
    updateBackendAccountUI();
    showToast("Sessione backend chiusa.");
  });
  updateBackendAccountUI();
}

function setupSettings() {
  const threshold = document.getElementById("spendingThreshold");
  const limit = document.getElementById("notificationLimit");
  const channel = document.getElementById("notificationChannel");
  const neverAutomate = document.getElementById("neverAutomateInput");
  if (threshold) threshold.value = state.threshold;
  if (limit) {
    limit.value = state.notificationLimit;
    limit.textContent = state.notificationLimit;
  }
  const digestTimes = state.digestTimes || ["08:00", "19:00"];
  const morning = document.getElementById("morningDigestTime");
  const evening = document.getElementById("eveningDigestTime");
  if (morning) morning.value = digestTimes[0];
  if (evening) evening.value = digestTimes[1];
  if (channel) channel.value = state.notificationChannel || "push";
  if (neverAutomate) neverAutomate.value = state.neverAutomate.join(", ");
  document.querySelectorAll("[data-boundary]").forEach((input) => {
    input.checked = state.boundaries?.[input.dataset.boundary] !== false;
  });
  document.querySelectorAll("[data-stepper]").forEach((button) => button.addEventListener("click", () => {
    const direction = button.dataset.stepper === "up" ? 1 : -1;
    state.notificationLimit = Math.max(1, Math.min(10, state.notificationLimit + direction));
    if (limit) {
      limit.value = state.notificationLimit;
      limit.textContent = state.notificationLimit;
    }
  }));
  document.getElementById("saveSettingsButton")?.addEventListener("click", () => {
    if (threshold) state.threshold = Math.max(0, Number(threshold.value || 50));
    state.notificationLimit = Math.max(1, Math.min(10, Number(limit?.textContent || state.notificationLimit)));
    state.digestTimes = [morning?.value || "08:00", evening?.value || "19:00"];
    state.notificationChannel = channel?.value || "push";
    state.neverAutomate = (neverAutomate?.value || "").split(",").map((item) => item.trim()).filter(Boolean);
    state.boundaries = Object.fromEntries([...document.querySelectorAll("[data-boundary]")].map((input) => [input.dataset.boundary, input.checked]));
    saveState();
    updateDecisionCount();
    showToast("Regole salvate. La fiducia dinamica decide caso per caso; i tetti di sicurezza restano fissi.");
  });
}

function setupIntegrations() {
  document.querySelectorAll(".integration-card").forEach((card) => {
    const key = card.querySelector(".integration-toggle")?.getAttribute("aria-label")?.match(/calendario|email|conti|lista|casa|farmacia|prenotazioni|documenti famiglia/)?.[0];
    const integrationKey = { calendario: "calendar", email: "email", conti: "bank", lista: "grocery", casa: "home", farmacia: "health", prenotazioni: "bookings", "documenti famiglia": "familyDocs" }[key];
    const button = card.querySelector(".integration-toggle");
    if (button && integrationKey) button.classList.toggle("active", Boolean(state.integrations[integrationKey]));
    if (button && integrationKey) {
      card.classList.toggle("connected", Boolean(state.integrations[integrationKey]));
      const status = card.querySelector(".connection-state");
      if (status) {
        status.textContent = state.integrations[integrationKey] ? "Connesso" : "Disponibile";
        status.classList.toggle("muted-state", !state.integrations[integrationKey]);
      }
    }
    button?.addEventListener("click", () => {
      const active = button.classList.toggle("active");
      card.classList.toggle("connected", active);
      const status = card.querySelector(".connection-state");
      if (status) {
        status.textContent = active ? "Connesso" : "Disponibile";
        status.classList.toggle("muted-state", !active);
      }
      if (integrationKey) state.integrations[integrationKey] = active;
      showToast(active ? "Integrazione attivata localmente." : "Integrazione disconnessa.");
      saveState();
    });
  });
}

function renderTechnicalIssues() {
  const list = document.getElementById("technicalIssueList");
  if (!list) return;
  const issues = state.technicalIssues.filter((issue) => issue.status !== "resolved");
  list.innerHTML = issues.length ? issues.map((issue) => `<div class="technical-issue"><span class="technical-icon">⌁</span><div><strong>${escapeHTML(issue.connector || "Integrazione")}</strong><small>${escapeHTML(issue.message || "Accesso non disponibile")}</small></div><span class="technical-priority">${escapeHTML(issue.priority || "tecnico")}</span><button class="mini-action technical-resolve" data-issue-id="${escapeHTML(issue.id || "")}" type="button">Risolto</button></div>`).join("") : `<div class="empty-list-state"><span>⌁</span><strong>Nessun problema tecnico</strong><small>Un accesso scaduto apparirà qui con priorità distinta.</small></div>`;
  list.querySelectorAll(".technical-resolve").forEach((button) => button.addEventListener("click", () => {
    const issue = state.technicalIssues.find((item) => item.id === button.dataset.issueId);
    if (issue) issue.status = "resolved";
    saveState();
    updateGovernanceUI();
    showToast("Problema tecnico marcato come risolto.");
  }));
}

function renderSeasonalPeriods() {
  const list = document.getElementById("seasonalPeriodList");
  if (!list) return;
  list.innerHTML = state.seasonalPeriods.length ? state.seasonalPeriods.map((period) => `<span class="seasonal-chip"><strong>${escapeHTML(period.name)}</strong><small>${escapeHTML(period.day || 1)}/${escapeHTML(period.month)} · anticipo ${escapeHTML(period.lead_days || 30)} giorni</small></span>`).join("") : `<span class="muted-label">Nessun periodo personalizzato</span>`;
}

function renderTrustProfiles() {
  const list = document.getElementById("trustProfileList");
  const overall = document.getElementById("trustOverallScore");
  const count = document.getElementById("trustCombinationCount");
  const summary = document.getElementById("trustEngineSummary");
  const profiles = Object.keys(state.trustProfiles || {}).map((key) => {
    const stored = state.trustProfiles[key] || {};
    return getTrustProfile(stored.actionType || key.split("|")[0], stored.counterparty || key.split("|")[1], stored.context || key.split("|")[2]);
  }).sort((a, b) => b.score - a.score);
  const average = profiles.length ? profiles.reduce((total, profile) => total + profile.score, 0) / profiles.length : Number(state.trustBaselineScore || 20);
  if (overall) overall.textContent = `${average.toFixed(0)}/100`;
  if (count) count.textContent = `${profiles.length} combinazion${profiles.length === 1 ? "e" : "i"} osservat${profiles.length === 1 ? "a" : "e"}`;
  if (summary) summary.textContent = profiles.length ? "La fiducia resta specifica per azione, controparte e contesto." : "Ogni combinazione nuova parte prudentemente da 20/100.";
  if (!list) return;
  if (!profiles.length) {
    list.innerHTML = `<div class="empty-list-state"><span>◌</span><strong>Nessuna storia ancora</strong><small>Approva o rifiuta una richiesta per costruire il primo profilo.</small></div>`;
    return;
  }
  list.innerHTML = profiles.slice(0, 6).map((profile) => {
    const decay = profile.decayApplied > 0.5 ? ` · −${profile.decayApplied.toFixed(0)} nel tempo` : "";
    const source = profile.source === "imported" ? "importata" : profile.source === "new" ? "nuova" : "osservata";
    return `<article class="trust-profile-row"><div class="trust-profile-copy"><strong>${escapeHTML(profile.actionType)} · ${escapeHTML(profile.counterparty)}</strong><small>${escapeHTML(profile.context)} · ${source}${decay}</small></div><div class="trust-profile-score"><strong>${profile.score.toFixed(0)}</strong><small>/100</small></div><div class="trust-meter compact"><span style="width:${Math.max(0, Math.min(100, profile.score))}%"></span></div></article>`;
  }).join("");
}

function auditPayload(payload, previousHash = state.auditHead || "") {
  const entry = {
    sequence: state.auditLog.length + 1,
    at: new Date().toISOString(),
    event: payload,
    previousHash
  };
  // La UI locale non pretende di offrire un audit qualificato: conserva però
  // una catena hash per rendere rilevabili alterazioni accidentali.
  const canonical = JSON.stringify(entry);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) hash = Math.imul(hash ^ canonical.charCodeAt(index), 16777619);
  entry.hash = (hash >>> 0).toString(16).padStart(8, "0");
  state.auditLog.unshift(entry);
  state.auditHead = entry.hash;
  return entry;
}

function recordAuditEvent(event) {
  auditPayload(event);
  saveState();
}

function auditIsValid() {
  let previousHash = "";
  const entries = [...state.auditLog].reverse();
  return entries.every((entry, index) => {
    const expected = { sequence: index + 1, at: entry.at, event: entry.event, previousHash };
    const canonical = JSON.stringify(expected);
    let hash = 2166136261;
    for (let charIndex = 0; charIndex < canonical.length; charIndex += 1) hash = Math.imul(hash ^ canonical.charCodeAt(charIndex), 16777619);
    const expectedHash = (hash >>> 0).toString(16).padStart(8, "0");
    const valid = entry.sequence === expected.sequence && entry.previousHash === previousHash && entry.hash === expectedHash;
    previousHash = entry.hash;
    return valid;
  }) && (!state.auditLog.length || state.auditHead === state.auditLog[0].hash);
}

function recordDomainConsent(domain, scope = "autonomy", actor = "owner") {
  const normalized = String(domain || "general").toLowerCase();
  const consent = { domain: normalized, scope, actor, granted: true, grantedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + Number(state.autonomyConsentRenewalDays || 180) * 86400000).toISOString() };
  state.domainConsents[normalized] = consent;
  recordAuditEvent({ type: "domain_consent_granted", ...consent });
  return consent;
}

function updateGovernanceUI() {
  const status = document.getElementById("calibrationStatus");
  if (status) status.textContent = calibrationMessage();
  const badge = document.getElementById("calibrationBadge");
  if (badge) {
    badge.hidden = !calibrationActive();
    badge.textContent = calibrationActive() ? "attiva" : "completata";
  }
  const retention = document.getElementById("retentionDaysLabel");
  if (retention) retention.textContent = `${Number(state.privacy?.retentionDays || 90)} giorni`;
  const pauseButton = document.getElementById("pauseAgentButton");
  if (pauseButton) pauseButton.textContent = state.paused ? "Riprendi agente" : "Metti in pausa";
  const presence = document.querySelector(".agent-presence strong");
  const presenceCopy = document.querySelector(".agent-presence small");
  if (presence) presence.textContent = state.paused ? "Agente in pausa" : "Agente attivo";
  if (presenceCopy) presenceCopy.textContent = state.paused ? "Nessuna automazione" : "Spazio locale pronto";
  const dndBadge = document.getElementById("dndStatusBadge");
  if (dndBadge) {
    const active = smartDndActive();
    dndBadge.textContent = active ? "attivo" : "normale";
    dndBadge.classList.toggle("active-badge", active);
  }
  const consentLabel = document.getElementById("consentStatusLabel");
  if (consentLabel) {
    const consents = Object.values(state.domainConsents || {}).filter((consent) => consent?.granted && (!consent.expiresAt || new Date(consent.expiresAt) > new Date()));
    consentLabel.textContent = consents.length ? `${consents.length} consenso${consents.length === 1 ? "" : "i"} attivo${consents.length === 1 ? "" : "i"}` : "Nessun consenso di dominio";
  }
  const auditValid = auditIsValid();
  const auditBadge = document.getElementById("auditBadge");
  const auditStatus = document.getElementById("auditStatusLabel");
  if (auditBadge) auditBadge.textContent = state.auditLog.length ? (auditValid ? "audit verificato" : "audit da verificare") : "audit locale";
  if (auditStatus) auditStatus.textContent = state.auditLog.length ? (auditValid ? `${state.auditLog.length} eventi verificati` : "catena non valida") : "nessun evento ancora";
  const phase = document.getElementById("coldStartPhaseBadge");
  const coldStatus = document.getElementById("coldStartStatus");
  if (phase) phase.textContent = state.coldStart?.phase === "calibration" || calibrationActive() ? "calibrazione" : state.coldStart?.phase || "importazione";
  if (coldStatus) coldStatus.textContent = state.coldStart?.historicalImported ? "Pattern storici importati con consenso: ora la fiducia continua a calibrarsi sulle interazioni reali." : "Parto prudente da 20/100. Puoi importare pattern storici soltanto dopo un consenso separato.";
  const manualLabel = document.getElementById("manualModeLabel");
  const manualButton = document.getElementById("manualModeButton");
  const secondaryManual = document.getElementById("manualModeButtonSecondary");
  if (manualLabel) manualLabel.textContent = state.manualMode ? "modalità manuale globale" : "fiducia dinamica attiva";
  if (manualButton) manualButton.textContent = state.manualMode ? "Riattiva fiducia" : "Chiedimi sempre";
  if (secondaryManual) secondaryManual.textContent = state.manualMode ? "Riattiva fiducia" : "Chiedimi sempre";
  const errorRate = document.getElementById("kpiErrorRate");
  const computeCost = document.getElementById("kpiComputeCost");
  const businessActions = document.getElementById("businessActionsMetric");
  const businessAutomations = document.getElementById("businessAutomationMetric");
  const errorCount = Number(state.businessMetrics?.executionErrors || 0);
  const actionCount = Number(state.businessMetrics?.actionsExecuted || 0);
  if (errorRate) errorRate.textContent = `${actionCount ? ((errorCount / actionCount) * 1000).toFixed(1) : "0"}/1000`;
  if (computeCost) computeCost.textContent = `€${Number((state.computeEvents || []).reduce((total, item) => total + Number(item.costEur || 0), 0)).toFixed(2).replace(".", ",")}`;
  if (businessActions) businessActions.textContent = actionCount;
  if (businessAutomations) businessAutomations.textContent = Number(state.businessMetrics?.automationsNeverDisabled || 0);
  const crisisBadge = document.getElementById("crisisStatusBadge");
  const crisisStatus = document.getElementById("crisisStatusLabel");
  const openErrors = (state.executionErrors || []).filter((item) => item.status !== "resolved");
  if (crisisBadge) crisisBadge.textContent = openErrors.length ? `${openErrors.length} da gestire` : "nessun errore";
  if (crisisStatus) crisisStatus.textContent = openErrors.length ? openErrors[0].userMessage || "Errore registrato: revisione aperta." : "Promessa: correzione verificabile, non “zero errori”.";
  const offboardingStatus = document.getElementById("offboardingStatusLabel");
  if (offboardingStatus) offboardingStatus.textContent = state.offboarding?.handoverCreatedAt ? `Pacchetto creato il ${new Date(state.offboarding.handoverCreatedAt).toLocaleString("it-IT")}.` : "Nessun pacchetto di passaggio creato.";
  const dependencyStatus = document.getElementById("dependencyStatus");
  if (dependencyStatus) dependencyStatus.textContent = state.manualMode ? "Modalità manuale attiva: ogni richiesta richiede la tua decisione." : "Nessun segnale di affidamento eccessivo. Puoi sempre fermare tutto in un passaggio.";
  const computeEvents = document.getElementById("computeEventsMetric");
  const computeCostMetric = document.getElementById("computeCostMetric");
  if (computeEvents) computeEvents.textContent = (state.computeEvents || []).length;
  if (computeCostMetric) computeCostMetric.textContent = `€${Number((state.computeEvents || []).reduce((total, item) => total + Number(item.costEur || 0), 0)).toFixed(2).replace(".", ",")}`;
  renderTechnicalIssues();
  renderSeasonalPeriods();
  renderTrustProfiles();
}

function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function resetLocalState() {
  Object.keys(defaultState).forEach((key) => {
    const value = defaultState[key];
    state[key] = value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  });
  state.notificationDate = todayKey();
  saveState();
  updatePersonalization();
  updateDecisionCount();
  renderCustomTasks();
  renderCustomDecisions();
  showOnboarding();
}

function setupGovernance() {
  const contextInput = document.getElementById("smartContextInput");
  const dndToggle = document.getElementById("smartDndToggle");
  if (contextInput) contextInput.value = state.context || "";
  if (dndToggle) dndToggle.checked = state.smartDnd !== false;
  document.getElementById("saveDndButton")?.addEventListener("click", () => {
    state.context = contextInput?.value.trim() || "";
    state.smartDnd = dndToggle?.checked !== false;
    saveState();
    updateGovernanceUI();
    showToast(state.context && state.smartDnd ? "Non disturbare intelligente aggiornato." : "Rilevamento Non disturbare disattivato.");
  });
  const setManualMode = () => {
    state.manualMode = !state.manualMode;
    recordAuditEvent({ type: "manual_mode_changed", enabled: state.manualMode });
    updateGovernanceUI();
    showToast(state.manualMode ? "Modalità manuale attiva: ti chiederò sempre." : "Fiducia dinamica riattivata.");
  };
  document.getElementById("manualModeButton")?.addEventListener("click", setManualMode);
  document.getElementById("manualModeButtonSecondary")?.addEventListener("click", () => {
    if (!state.manualMode) state.manualMode = true;
    recordAuditEvent({ type: "manual_mode_changed", enabled: true });
    updateGovernanceUI();
    showToast("Modalità manuale attiva: ti chiederò sempre.");
  });
  document.getElementById("grantMoneyConsentButton")?.addEventListener("click", () => {
    const consent = recordDomainConsent("money");
    showToast(`Consenso locale per denaro valido fino al ${new Date(consent.expiresAt).toLocaleDateString("it-IT")}.`);
    updateGovernanceUI();
  });
  document.getElementById("importHistoryButton")?.addEventListener("click", () => {
    state.coldStart = { ...state.coldStart, phase: "calibration", historicalImported: true, importedAt: new Date().toISOString(), source: "demo locale" };
    recordAuditEvent({ type: "historical_import", source: "demo locale", imported: 1 });
    updateGovernanceUI();
    showToast("Importazione dimostrativa registrata con consenso. Nessun dato esterno è stato letto.");
  });
  document.getElementById("simulateErrorButton")?.addEventListener("click", () => {
    const task = { title: "Aggiornamento locale", category: "home", actionType: "repair", counterparty: "fornitore demo", trustContext: "manutenzione" };
    const profile = getTrustProfile(task.actionType, task.counterparty, task.trustContext);
    const previous = Number(profile.score || state.trustBaselineScore);
    const error = { id: createTaskId(), type: "execution_error", task, domain: task.category, error: "Il servizio demo ha restituito un risultato inatteso.", detectedAt: new Date().toISOString(), severity: "standard", trustKey: profile.key, trustBefore: previous, trustAfter: Math.max(0, previous - 40), status: "open", userMessage: "Ho rilevato un errore: ho ridotto la fiducia solo per questa combinazione e aperto una revisione." };
    state.executionErrors.unshift(error);
    state.crisisEvents.unshift({ errorId: error.id, at: error.detectedAt, trustReduced: true });
    state.businessMetrics.executionErrors = Number(state.businessMetrics.executionErrors || 0) + 1;
    recordAuditEvent({ type: "execution_error", errorId: error.id, domain: error.domain });
    updateGovernanceUI();
    showToast("Errore registrato e fiducia locale ridotta solo per questa combinazione.", "warning");
  });
  document.getElementById("viewAuditButton")?.addEventListener("click", () => showToast(auditIsValid() ? `Audit verificato: ${state.auditLog.length} eventi nella catena locale.` : "Audit non valido: controlla la cronologia locale.", auditIsValid() ? "success" : "warning"));
  document.getElementById("runDependencyCheckButton")?.addEventListener("click", () => {
    const message = state.manualMode ? "Modalità manuale già attiva: nessuna autonomia resta attiva." : "Revisione completata: puoi ridurre l'autonomia in un solo passaggio.";
    showToast(message, "info");
    updateGovernanceUI();
  });
  document.querySelectorAll("[data-permission-member]").forEach((select) => {
    const member = select.dataset.permissionMember;
    const domain = select.dataset.permissionDomain;
    const value = state.familyPermissions?.[member]?.[domain];
    select.value = Array.isArray(value) && value.includes("manage") ? "manage" : Array.isArray(value) && value.includes("approve") ? "approve" : "none";
  });
  document.getElementById("savePermissionMatrixButton")?.addEventListener("click", () => {
    document.querySelectorAll("[data-permission-member]").forEach((select) => {
      const member = select.dataset.permissionMember;
      const domain = select.dataset.permissionDomain;
      state.familyPermissions[member] = state.familyPermissions[member] || {};
      if (select.value === "none") delete state.familyPermissions[member][domain];
      else state.familyPermissions[member][domain] = [select.value];
    });
    saveState();
    showToast("Matrice dei permessi salvata.");
  });
  document.getElementById("simulateFailureButton")?.addEventListener("click", () => {
    const issue = { id: createTaskId(), connector: "Conti bancari", message: "Accesso scaduto: rinnova l'autorizzazione", priority: "tecnico", status: "open", at: new Date().toISOString() };
    state.technicalIssues.unshift(issue);
    saveState();
    updateGovernanceUI();
    showToast("Problema tecnico registrato separatamente dalle decisioni.", "warning");
  });
  document.getElementById("restartCalibrationButton")?.addEventListener("click", () => {
    state.calibrationStartedAt = new Date().toISOString();
    state.metrics.calibrationNotifications = 0;
    saveState();
    updateGovernanceUI();
    showToast("Periodo di calibrazione riavviato.");
  });
  document.getElementById("exportDataButton")?.addEventListener("click", () => {
    downloadJSON("everyday-agent-dati.json", { exportedAt: new Date().toISOString(), privacy: state.privacy, state });
    showToast("Esportazione GDPR preparata sul dispositivo.");
  });
  document.getElementById("deleteDataButton")?.addEventListener("click", () => {
    if (!window.confirm("Cancellare tutti i dati locali e le automazioni? Questa azione non si può annullare.")) return;
    resetLocalState();
    showToast("Dati locali cancellati. Puoi ricominciare dalla calibrazione.", "warning");
  });
  document.getElementById("saveSeasonalButton")?.addEventListener("click", () => {
    const input = document.getElementById("seasonalPeriodInput");
    const [name, monthText, dayText] = (input?.value || "").split(",").map((item) => item.trim());
    const month = Number(monthText);
    const day = Number(dayText || 1);
    if (!name || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
      showToast("Inserisci nome, mese (1-12) e opzionalmente giorno.", "warning");
      return;
    }
    state.seasonalPeriods.push({ name, month, day, lead_days: 30 });
    saveState();
    renderSeasonalPeriods();
    input.value = "";
    showToast(`Periodo “${name}” aggiunto al radar stagionale.`);
  });
  document.getElementById("pauseAgentButton")?.addEventListener("click", () => {
    state.paused = !state.paused;
    state.offboarding = { ...state.offboarding, paused: state.paused, mode: state.paused ? "paused" : "active" };
    saveState();
    updateGovernanceUI();
    showToast(state.paused ? "Agente in pausa: le nuove richieste resteranno ferme." : "Agente riattivato.");
  });
  document.getElementById("offboardAgentButton")?.addEventListener("click", () => {
    const createdAt = new Date().toISOString();
    const handover = { createdAt, pending: state.pending.map((id) => state.customTasks.find((task) => task.id === id)).filter(Boolean), queuedNotifications: state.queuedNotifications, preferences: state.preferences, automationSuggestions: state.automationSuggestions, deadlines: state.hiddenDeadlines, documents: state.documents, technicalIssues: state.technicalIssues, trustProfiles: state.trustProfiles, activeConsents: state.domainConsents, nextStep: "assegna manualmente le scadenze aperte, revoca i token esterni e conferma il passaggio" };
    state.offboarding = { paused: true, mode: "offboarding", handoverCreatedAt: createdAt, handover, externalTokensToRevoke: true, automationsCancelled: false };
    state.paused = true;
    recordAuditEvent({ type: "offboarding_package_created", createdAt, pendingCount: handover.pending.length });
    downloadJSON("everyday-agent-passaggio.json", handover);
    updateGovernanceUI();
    showToast("Pacchetto di passaggio creato: nessuna scadenza viene persa.", "warning");
  });
  updateGovernanceUI();
}

function setupSearch() {
  const popover = document.getElementById("searchPopover");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const searchable = [];
  document.getElementById("searchButton")?.addEventListener("click", () => {
    popover.classList.toggle("open");
    if (popover.classList.contains("open")) input.focus();
  });
  input?.addEventListener("input", () => {
    const query = input.value.toLowerCase().trim();
    results.innerHTML = "";
    searchable.filter(([title, meta]) => !query || `${title} ${meta}`.toLowerCase().includes(query)).forEach(([title, meta]) => {
      const result = document.createElement("button");
      result.type = "button";
      result.className = "search-result";
      result.innerHTML = `<strong>${title}</strong><small>${meta}</small>`;
      result.addEventListener("click", () => { popover.classList.remove("open"); showToast(`Aperto: ${title}`); });
      results.appendChild(result);
    });
  });
  input?.dispatchEvent(new Event("input"));
  document.addEventListener("click", (event) => {
    if (!popover.contains(event.target) && event.target.id !== "searchButton") popover.classList.remove("open");
  });
}

function setupSecondaryActions() {
  document.getElementById("notificationButton")?.addEventListener("click", () => navigate("decisions"));
  document.getElementById("profileButton")?.addEventListener("click", () => navigate("settings"));
  document.getElementById("clearMemoryButton")?.addEventListener("click", () => {
    if (!window.confirm("Cancellare preferenze e regole apprese da questo dispositivo?")) return;
    state.preferences = [];
    state.rejections = [];
    state.rejectionKeys = [];
    state.neverAutomate = [];
    saveState();
    showToast("Memoria locale cancellata.", "warning");
  });
  document.getElementById("addPreferenceButton")?.addEventListener("click", () => showToast("Scrivi una preferenza nella prossima attività da aggiungere."));
  document.querySelectorAll(".edit-button").forEach((button) => button.addEventListener("click", () => showToast("Preferenza pronta per la modifica.")));
  document.querySelectorAll(".small-action").forEach((button) => button.addEventListener("click", () => showToast("Regola pronta: conferma prima di automatizzare.")));
  document.querySelectorAll(".view-toggle").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".view-toggle").forEach((item) => item.classList.remove("active")); button.classList.add("active"); showToast(`${button.textContent} selezionata.`); }));
}

function init() {
  bindNavigation();
  setupOnboarding();
  updatePersonalization();
  setupModal();
  setupDecisions();
  setupCalendar();
  setupGrocery();
  setupDigest();
  setupAssistant();
  setupSettings();
  setupBackendAccount();
  setupIntegrations();
  setupGovernance();
  setupSearch();
  setupSecondaryActions();
  renderCustomTasks();
  renderCustomDecisions();
  updateDecisionCount();
  navigate(window.location.hash.slice(1) || "dashboard", false);
  renderTrustProfiles();
  showOnboarding();
  void initializeBackend();
}

if (typeof window !== "undefined") {
  window.everydayAgent = {
    classifyRequest,
    getTrustProfile,
    evaluateTrust,
    updateTrustProfile,
    trustKey,
    decayedTrustScore,
    getState: () => state,
    backend: () => ({ available: backend.available, authenticated: backend.authenticated, stateVersion: backend.stateVersion, status: backend.status })
  };
}

document.addEventListener("DOMContentLoaded", init);
