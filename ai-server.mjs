#!/usr/bin/env node
/**
 * Everyday Agent — AI Server
 * 
 * Real AI backend powering the dashboard chatbot, task classifier,
 * smart calendar, and trust engine. No external API keys required.
 * 
 * Run: node ai-server.mjs [--port 4180]
 * API: http://127.0.0.1:4180/api/
 */

import http from "http";
import { randomUUID } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.AI_PORT || "4180", 10);
const LLM_PYTHON_URL = process.env.LLM_PYTHON_URL || "http://127.0.0.1:4181";

// ─── NLP ENGINE ───────────────────────────────────────────────────────────────

const ITALIAN_PATTERNS = {
  home: {
    keywords: ["casa", "rubinetto", "doccia", "boiler", "caldaia", "filtro", "finestra", "lucchetto", "puliz", "tappeto", "lavatrice", "asciugatrice", "frigorifero", "forno", "microonde", "condizionatore", "ventilatore", "tenda", "parquet", "piastrelle", "tubo", "scarico", "scarico WC", "guarnizione", "radiatore", "termosifone", "lampada", "interruttore", "presa", "caldaia", "gas", "acqua", "elettricità", "impianto"],
    verbs: ["ripara", "sostituisci", "controlla", "pulisci", "ordina", "compra", "monta", "installa", "aggiusta"],
  },
  money: {
    keywords: ["bolletta", "fattura", "pagamento", "spesa", "budget", "conta", "conto", "banca", "carta", "addebito", "bonifico", "soldi", "euro", "prezzo", "costo", "abbonamento", "ricevuta", "imposta", "tasse", "reddito", "mutuo", "affitto", "rate"],
    verbs: ["paga", "paga", "versa", "trasferisci", "preleva", "deposita", "controlla", "saldi"],
  },    health: {
    keywords: ["medico", "farmacia", "farmaco", "medicina", "ricetta", "visita", "esame", "analisi", "dentista", "oculista", "specialista", "ospedale", "clinica", "terapia", "vaccino", "vaccinazione", "allergia", "pressionsangue", "temperatura", "febbre", "mal di testa", "mal di stomaco", "salute", "benessere"],
    verbs: ["prenota", "richiama", "rinnova", "controlla", "acquista"],
    boost: ["medicine", "medicinale", "farmaco", "ricetta"],
  },
  errands: {
    keywords: ["spesa", "supermercato", "farmacia", "list", "ordine", "consegna", "pacco", "poste", "banco", "taglier", "barber", "parrucchiere", "lavanderia", "meccanico", "auto", "benzina", "gommista", "vetro", "assicurazione auto"],
    verbs: ["ordina", "compra", "prenota", "ritira", "consegna", "acquista"],
  },
  family: {
    keywords: ["figlio", "figlia", "bambino", "bambina", "partner", "moglie", "marito", "genitore", "famiglia", "scuola", "compito", "lezione", ".activity", "calcio", "nuoto", "palestra", " kompleanno", "regalo", "asilo"],
    verbs: ["prenota", "riporta", "paga", "controlla", "ricorda"],
  },
};

const TIME_EXPRESSIONS = [
  { pattern: /\b(oggi|stamani|stasera)\b/i, offset: 0 },
  { pattern: /\b(domani|domattina)\b/i, offset: 1 },
  { pattern: /\b(dopodomani)\b/i, offset: 2 },
  { pattern: /(^|\s)(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)(\s|$)/i, offset: null },
  { pattern: /\b(prossim[aoe]|futur[aoe])\b/i, offset: 7 },
  { pattern: /\b(mese prossimo|il mese venturo)\b/i, offset: 30 },
  { pattern: /\b(tra (\d+) (giorni|ore|minuti))\b/i, offset: null },
];

const URGENCY_KEYWORDS = {
  high: ["urgent", "urgente", "subito", "ora", "immediat", "critical", "critico", "pericolo", "emergenz", "rotto", "allagamento", "incendio", "fuga"],
  medium: ["questa settimana", "non posso aspettare", "appena possibile", "non rimandare"],
  low: ["quando puoi", "non urgente", "alla bisogna", "un giorno sì uno no", "ogni tanto"],
};

function extractTimeOffset(message) {
  const lower = message.toLowerCase();
  for (const expr of TIME_EXPRESSIONS) {
    const match = lower.match(expr.pattern);
    if (match) {
      if (expr.offset !== null) return expr.offset;
      if (match[2]) return parseInt(match[2], 10) * (match[3] === "ore" ? 1/24 : match[3] === "minuti" ? 1/1440 : 1);
    }
  }
  return null;
}

function extractUrgency(message) {
  const lower = message.toLowerCase();
  for (const [level, keywords] of Object.entries(URGENCY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return level;
  }
  return "low";
}

function extractAmount(message) {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro|euri)/i) || message.match(/(?:€|euro)\s*(\d+(?:[.,]\d+)?)/i);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}

function extractCounterparty(message) {
  const knownProviders = [
    "enel", "eni", "hera", "acea", "tre", "wind", "vodafone", "tim", "fastweb",
    "poste", "amazon", "esse2", "conad", "coop", "esselunga", "lidl", "aldi",
    "parafarmacia", "farmacia", "casa di riposo",
  ];
  const lower = message.toLowerCase();
  for (const provider of knownProviders) {
    if (lower.includes(provider)) return provider;
  }
  // Try to extract a name after common prepositions
  const nameMatch = lower.match(/(?:di|del|della|allo?|alla|per|con)\s+([a-zà-ú]{3,20})/i);
  return nameMatch ? nameMatch[1] : null;
}

function classifyIntent(message) {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (/^(ciao|salve|hey|buongiorno|buonasera|buonanotte|hello|hi|hey)\b/i.test(lower)) {
    return { type: "greeting", domain: null };
  }

  // Questions about the agent
  if (/^(cosa sai|cosa puoi|come funzioni|come funziona|cosa fai|what can you|how do you|chi sei)\b/i.test(lower)) {
    return { type: "capability_question", domain: null };
  }

  // Questions about trust
  if (/fiducia|trust|punteggio|score|livello/i.test(lower)) {
    return { type: "trust_query", domain: null };
  }

  // Questions about status
  if (/^(che succede|stato|status|aggiornamento|riepilogo|come stai|what.s up|status)\b/i.test(lower)) {
    return { type: "status_query", domain: null };
  }

  // Undo requests
  if (/^(annulla|undo|revert|indietro|cambia idea)\b/i.test(lower)) {
    return { type: "undo_request", domain: null };
  }

  // Explanation requests (no \b — é is not a \w char in JS)
  if (/^(perché|perche|why|come mai|spiegami|motivo)(\s|$)/i.test(lower)) {
    return { type: "explanation_request", domain: null };
  }

  // Task creation (the main intent)
  return { type: "task_request", domain: null };
}

function classifyDomain(message) {
  const scores = {};
  const lower = message.toLowerCase();

  for (const [domain, config] of Object.entries(ITALIAN_PATTERNS)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (lower.includes(kw)) score += 2;
    }
    for (const v of config.verbs) {
      if (lower.includes(v)) score += 3;
    }
    if (config.boost) {
      for (const b of config.boost) {
        if (lower.includes(b)) score += 5;
      }
    }
    if (score > 0) scores[domain] = score;
  }

  if (Object.keys(scores).length === 0) return "general";
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function analyzeTask(message) {
  const intent = classifyIntent(message);
  const domain = classifyDomain(message);
  const urgency = extractUrgency(message);
  const amount = extractAmount(message);
  const counterparty = extractCounterparty(message);
  const timeOffset = extractTimeOffset(message);

  const dueDate = timeOffset !== null
    ? new Date(Date.now() + timeOffset * 86400000).toISOString().split("T")[0]
    : null;

  // Build task object
  const task = {
    id: randomUUID(),
    title: message.slice(0, 120),
    domain,
    urgency,
    amount,
    counterparty: counterparty || "generico",
    dueDate,
    intent: intent.type,
    createdAt: new Date().toISOString(),
    level: 3, // default: ask first
  };

  return task;
}

// ─── TRUST ENGINE ─────────────────────────────────────────────────────────────

const trustProfiles = new Map();
const TRUST_BASELINE = 20;
const TRUST_CEILINGS = {
  money: 85,
  health: 75,
  legal: 60,
  family: 80,
  home: 95,
  errands: 95,
  general: 90,
};

function trustKey(action, counterparty, context) {
  return `${action}|${counterparty}|${context}`;
}

function getTrustScore(action, counterparty, context) {
  const key = trustKey(action, counterparty, context);
  const profile = trustProfiles.get(key);
  if (!profile) return { score: TRUST_BASELINE, interactions: 0, source: "new" };
  // Apply time decay: lose 1 point per 7 days of inactivity
  const daysSinceInteraction = (Date.now() - new Date(profile.lastInteractionAt).getTime()) / 86400000;
  const decay = Math.min(profile.score - TRUST_BASELINE, Math.floor(daysSinceInteraction / 7));
  const currentScore = Math.max(TRUST_BASELINE, profile.score - decay);
  return { ...profile, score: currentScore };
}

function updateTrust(action, counterparty, context, outcome, responseTimeMs = null) {
  const key = trustKey(action, counterparty, context);
  const existing = trustProfiles.get(key) || {
    action, counterparty, context,
    score: TRUST_BASELINE,
    interactions: 0, approvals: 0, rejections: 0,
    lastInteractionAt: new Date().toISOString(),
  };

  let delta = 0;
  if (outcome === "approved") {
    const latencyHours = responseTimeMs ? responseTimeMs / 3600000 : null;
    delta = latencyHours === null ? 4 : latencyHours <= 1 ? 12 : latencyHours <= 24 ? 6 : latencyHours <= 48 ? 1 : 0;
  } else if (outcome === "rejected") {
    delta = -30;
  } else if (outcome === "error") {
    delta = -40;
  }

  const ceiling = TRUST_CEILINGS[context] || TRUST_CEILINGS.general;
  const newScore = Math.max(0, Math.min(ceiling, existing.score + delta));

  const updated = {
    ...existing,
    score: newScore,
    interactions: existing.interactions + 1,
    approvals: existing.approvals + (outcome === "approved" ? 1 : 0),
    rejections: existing.rejections + (outcome === "rejected" ? 1 : 0),
    lastInteractionAt: new Date().toISOString(),
  };

  trustProfiles.set(key, updated);
  return updated;
}

function getAutonomyLevel(score, domain) {
  const ceiling = TRUST_CEILINGS[domain] || TRUST_CEILINGS.general;
  // Even at 100 trust, money/health/legal never reach level 1
  if (domain === "money" || domain === "health" || domain === "legal") {
    if (score >= 70) return 2;
    return 3;
  }
  if (score >= 70) return 1;
  if (score >= 40) return 2;
  return 3;
}

function getDynamicSpendLimit(score) {
  // Base €50 at trust 20, up to €500 at trust 100
  return Math.round(50 + (score - 20) * (450 / 80));
}

// ─── AI CHATBOT ───────────────────────────────────────────────────────────────

const conversationMemory = new Map(); // sessionId -> [{role, content, timestamp}]
const MAX_MEMORY = 50;

function getConversation(sessionId) {
  if (!conversationMemory.has(sessionId)) conversationMemory.set(sessionId, []);
  return conversationMemory.get(sessionId);
}

function addToMemory(sessionId, role, content) {
  const memory = getConversation(sessionId);
  memory.push({ role, content, timestamp: Date.now() });
  if (memory.length > MAX_MEMORY) memory.shift();
}

async function callLLM(query) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(`${LLM_PYTHON_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_tokens: 300, language: "auto" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null; // Fallback to rule-based
  }
}

async function generateResponse(message, sessionId, state) {
  const task = analyzeTask(message);
  const intent = classifyIntent(message);

  addToMemory(sessionId, "user", message);

  // Try real LLM first for general queries
  if (intent.type === "task_request" || intent.type === "capability_question" || intent.type === "explanation_request") {
    const llmResult = await callLLM(message);
    if (llmResult && llmResult.response) {
      const response = {
        text: llmResult.response,
        level: null,
        task: intent.type === "task_request" ? task : null,
        source: "llm",
        model: llmResult.model || "TinyLlama",
        sources: llmResult.sources || [],
      };
      addToMemory(sessionId, "assistant", response.text);
      return response;
    }
  }

  let response;
  switch (intent.type) {
    case "greeting":
      response = handleGreeting(sessionId, state);
      break;
    case "capability_question":
      response = handleCapabilityQuestion(state);
      break;
    case "trust_query":
      response = handleTrustQuery(task, state);
      break;
    case "status_query":
      response = handleStatusQuery(state);
      break;
    case "undo_request":
      response = handleUndoRequest(message, state);
      break;
    case "explanation_request":
      response = handleExplanationRequest(message, state);
      break;
    case "task_request":
      response = handleTaskRequest(task, state);
      break;
    default:
      response = { text: "Non sono sicuro di aver capito. Puoi riformulare?", level: null, task: null };
  }

  addToMemory(sessionId, "assistant", response.text);
  return response;
}

function handleGreeting(sessionId, state) {
  const memory = getConversation(sessionId);
  const userName = state?.userName || "utente";
  const isFirstVisit = memory.length <= 2;
  const calibrationDays = state?.calibrationDaysRemaining || 14;

  if (isFirstVisit) {
    return {
      text: `Ciao ${userName}! Sono il tuo Everyday Agent. Sono qui per gestire le piccole cose della tua vita quotidiana — casa, soldi, salute, commissioni e famiglia — senza romperti le scatole con notifiche inutili.\n\nPer le decisioni che contano davvero, ti chiederò prima. Per il resto, imparo dai tuoi gesti e agisco in silenzio.\n\nCosa posso fare per te oggi?`,
      level: null,
      task: null,
    };
  }

  if (calibrationDays > 0) {
    return {
      text: `Ciao ${userName}! Sono ancora in fase di calibrazione (${calibrationDays} giorni rimasti). Potrei chiederti qualcosa in più del necessario — è per imparare come preferisci che operi. Non preoccuparti, con il tempo chiederò meno e farò di più.`,
      level: null,
      task: null,
    };
  }

  return {
    text: `Ciao ${userName}! Sono pronto. La mia fiducia per le combinazioni più usate sta crescendo — vedrai sempre meno interruzioni.\n\nCosa hai bisogno?`,
    level: null,
    task: null,
  };
}

function handleCapabilityQuestion() {
  return {
    text: `Ecco cosa posso fare:\n\n🏠 **Casa** — Manutenzione, scorte, scadenze garanzia, filter tracking\n💰 **Denaro** — Budget, pagamenti ricorrenti, spese, abbonamenti\n🏥 **Salute** — Promemoria farmacia, visite, ricette (mai consigli medici)\n🛒 **Commissioni** — Liste della spesa, ordini, prenotazioni\n👨‍👩‍👧 **Famiglia** — Scadenze scuola, attività, calendario condiviso\n\nPer ogni azione, calcolo un punteggio di fiducia dinamico. Più mi fidi, più agisco in silenzio. Per le decisioni grandi o sensibili, chiedo sempre prima.\n\nProva a dirmi cosa vuoi delegare!`,
    level: null,
    task: null,
  };
}

function handleTrustQuery(task, state) {
  const profiles = state?.trustProfiles || {};
  const topProfiles = Object.entries(profiles)
    .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
    .slice(0, 5);

  if (topProfiles.length === 0) {
    return {
      text: `Al momento non ho profili di fiducia registrati. Ogni volta che mi approvi o rifiuti un'azione, il mio motore di fiducia si aggiorna per quella specifica combinazione di azione + controparte + contesto.\n\nProva a farmi una richiesta e poi approvala o rifiutala — vedrai come cambia il punteggio!`,
      level: null,
      task: null,
    };
  }

  let text = `Ecco i tuoi profili di fiducia attuali:\n\n`;
  for (const [key, profile] of topProfiles) {
    const level = getAutonomyLevel(profile.score, profile.context);
    const levelText = level === 1 ? "🟢 Eseguo in silenzio" : level === 2 ? "🟡 Informo nel digest" : "🔴 Chiedo conferma";
    text += `• **${profile.action}** + **${profile.counterparty}** (${profile.context}): ${profile.score.toFixed(0)}/100 → ${levelText}\n`;
  }
  text += `\nIl tetto massimo per denaro è 85/100, per salute 75/100, per legale 60/100 — anche con fiducia piena.`;

  return { text, level: null, task: null };
}

function handleStatusQuery(state) {
  const tasks = state?.customTasks || [];
  const pending = tasks.filter(t => t.status === "pending" || t.status === "awaiting_decision");
  const completed = tasks.filter(t => t.status === "completed" || t.status === "approved");
  const trustProfiles = Object.keys(state?.trustProfiles || {}).length;
  const calibrationDays = state?.calibrationDaysRemaining || 0;

  let text = `📊 **Stato del tuo Everyday Agent**\n\n`;
  text += `• Task attivi: ${pending.length}\n`;
  text += `• Task completati: ${completed.length}\n`;
  text += `• Profili fiducia: ${trustProfiles}\n`;
  text += `• Calibrazione: ${calibrationDays > 0 ? `${calibrationDays} giorni rimasti` : "completata"}\n`;
  text += `• Notifiche oggi: ${state?.notificationsToday || 0}\n`;

  if (pending.length > 0) {
    text += `\n📋 **In sospeso:**\n`;
    for (const task of pending.slice(0, 3)) {
      text += `• ${task.title} (livello ${task.level || 3})\n`;
    }
  }

  return { text, level: null, task: null };
}

function handleUndoRequest(message, state) {
  const tasks = state?.customTasks || [];
  const undoable = tasks.find(t =>
    (t.status === "completed" || t.status === "approved") && t.reversible !== false
  );

  if (!undoable) {
    return {
      text: "Non trovo azioni annullabili al momento. Le azioni irreversibili (cancellazioni, invii di denaro) non possono essere annullate per design — ti chiedo sempre conferma prima.",
      level: null,
      task: null,
    };
  }

  return {
    text: `Ho trovato un'azione annullabile: **${undoable.title}**.\n\nProcedo con l'annullamento? Questa azione è reversibile e non ha effetti esterni.`,
    level: 3,
    task: { ...undoable, action: "undo" },
  };
}

function handleExplanationRequest(message, state) {
  const tasks = state?.customTasks || [];
  const target = tasks.find(t => t.status === "completed" || t.status === "approved");

  if (!target) {
    return {
      text: "Non ho ancora eseguito azioni da spiegare. Ogni mia azione automatica è tracciata e puoi sempre chiedermi 'perché' dopo averla approvata.",
      level: null,
      task: null,
    };
  }

  return {
    text: `🔍 **Spiegazione per: ${target.title}**\n\n` +
      `• **Regola applicata:** ${target.level === 1 ? "Livello 1 — fiducia sufficiente per eseguire in silenzio" : target.level === 2 ? "Livello 2 — fiducia media, ho eseguito e ti ho informato" : "Livello 3 — ho chiesto conferma prima"}\n` +
      `• **Fiducia al momento dell'azione:** ${target.trustScore || "N/A"}/100\n` +
      `• **Categoria:** ${target.category || "generale"}\n` +
      `• **Controparte:** ${target.counterparty || "non specificata"}\n` +
      `• **Reversibile:** ${target.reversible !== false ? "Sì" : "No"}\n` +
      `• **Motivo:** ${target.reason || "Regola standard del motore di fiducia"}\n\n` +
      `Vuoi che annulli questa azione?`,
    level: null,
    task: null,
  };
}

function handleTaskRequest(task, state) {
  // Calculate trust for this combination
  const trust = getTrustScore(task.intent, task.counterparty, task.domain);
  const level = getAutonomyLevel(trust.score, task.domain);
  const spendLimit = getDynamicSpendLimit(trust.score);

  task.trustScore = trust.score;
  task.level = level;
  task.dynamicSpendLimit = spendLimit;

  // Check for sensitive amounts
  if (task.amount && task.amount > spendLimit) {
    task.level = 3;
    task.reason = `Importo €${task.amount} supera il limite dinamico di €${spendLimit} per questa combinazione (fiducia ${trust.score.toFixed(0)}/100)`;
  }

  // Check for suspicious activity
  const lower = task.title.toLowerCase();
  if (/\b(frode|truffa|scam|phishing|sospett)\b/i.test(lower)) {
    task.level = 3;
    task.suspicious = true;
    task.reason = "Attività sospetta rilevata — richiede verifica immediata";
  }

  // Check for irreversible actions
  if (/\b(cancell|elimin|rimuovi|chiudi|disdett|recesso)\b/i.test(lower)) {
    task.level = 3;
    task.irreversible = true;
    task.reason = "Azione irreversibile — richiede conferma esplicita";
  }

  // Build response based on level
  let text;
  if (level === 1 && !task.amount) {
    text = `✅ **Fiducia ${trust.score.toFixed(0)}/100** · ${task.title}\n\n` +
      `Gestisco in silenzio. La combinazione ${task.intent} + ${task.counterparty} (${task.domain}) ha fiducia sufficiente.\n` +
      `Limite dinamico: €${spendLimit}. Azione reversibile e tracciata.` +
      (trust.interactions > 0 ? `\nDopo ${trust.interactions} interazioni, questa è automatica.` : "");
    task.status = "approved";
    task.autoExecuted = true;
  } else if (level === 2) {
    text = `✅ **Fiducia ${trust.score.toFixed(0)}/100** · ${task.title}\n\n` +
      `Lo gestisco e lo includo nel prossimo digest.\n` +
      `Fiducia: ${trust.score.toFixed(0)}/100 · Contesto: ${task.domain} · Controparte: ${task.counterparty}\n` +
      `Ti informo al termine.`;
    task.status = "approved";
    task.inDigest = true;
  } else {
    const deadline = task.urgency === "high" ? "Scadenza: serve risposta oggi." : "Scadenza: nessuna immediata.";
    const defaultOutcome = task.irreversible
      ? "Se non rispondi, l'azione non viene eseguita."
      : task.suspicious
        ? "Se non rispondi, la segnalo come sospetta e non procedo."
        : "Se non rispondi entro 48 ore, la richiesta scade e la riapro nel digest.";
    text = `⚠️ **Serve una tua decisione** · fiducia ${trust.score.toFixed(0)}/100\n\n` +
      `${task.title}\n\n` +
      `• Contesto: ${task.domain} · Controparte: ${task.counterparty}\n` +
      `• Se non rispondi: ${defaultOutcome}\n` +
      `• Limite dinamico: €${spendLimit}\n` +
      `${deadline}\n\n` +
      `Vuoi che proceda o preferisci gestirlo tu?`;
    task.status = "awaiting_decision";
  }

  // Add explanation for auto-executed tasks
  if (task.autoExecuted) {
    task.explanation = `Livello 1: fiducia ${trust.score.toFixed(0)}/100 per ${task.intent}+${task.counterparty}+${task.domain}. Azione reversibile, tracciata, entro il limite dinamico di €${spendLimit}.`;
  }

  return { text, level, task };
}

// ─── SMART CALENDAR ───────────────────────────────────────────────────────────

const calendarEvents = new Map();

function createEvent(event) {
  const id = randomUUID();
  const now = new Date();
  const startDate = event.startDate ? new Date(event.startDate) : now;
  const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 3600000);

  const calendarEvent = {
    id,
    title: event.title || "Evento senza titolo",
    domain: event.domain || "general",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    description: event.description || "",
    recurrence: event.recurrence || null, // "daily", "weekly", "monthly", "yearly"
    recurrenceEnd: event.recurrenceEnd || null,
    reminder: event.reminder || 15, // minutes before
    notifications: [],
    smartSuggestions: [],
    createdAt: now.toISOString(),
  };

  // Generate smart suggestions
  calendarEvent.smartSuggestions = generateSmartSuggestions(calendarEvent);

  calendarEvents.set(id, calendarEvent);
  return calendarEvent;
}

function generateSmartSuggestions(event) {
  const suggestions = [];
  const start = new Date(event.startDate);
  const dayOfWeek = start.getDay();
  const hour = start.getHours();

  // Time-based suggestions
  if (hour < 8) suggestions.push("⚠️ Questo evento è prestissimo. Vuoi impostare un promemoria extra?");
  if (hour > 20) suggestions.push("⚠️ Evento serotino. Assicurati di averlo nell'agenda prima di coricarti.");
  if (dayOfWeek === 0 || dayOfWeek === 6) suggestions.push("📅 È weekend. Vuoi che lo sposti al lunedì?");

  // Domain-specific suggestions
  if (event.domain === "health") {
    suggestions.push("🏥 Per le visite mediche, portare eventuali referti precedenti.");
    suggestions.push("💊 Verificare la farmacia di zona aperta nel caso servano farmaci.");
  }
  if (event.domain === "money") {
    suggestions.push("💰 Verificare che il conto corrente sia coperto per l'importo previsto.");
  }
  if (event.domain === "family") {
    suggestions.push("👨‍👩‍👧 Vuoi che avvisi anche gli altri membri della famiglia?");
  }

  return suggestions;
}

function exportToICS(event) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const formatICSDate = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let rrule = "";
  if (event.recurrence) {
    const freqMap = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY" };
    rrule = `RRULE:FREQ=${freqMap[event.recurrence] || "WEEKLY"}`;
    if (event.recurrenceEnd) rrule += `;UNTIL=${formatICSDate(new Date(event.recurrenceEnd))}`;
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Everyday Agent//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ""}`,
    rrule ? `${rrule}` : "",
    `BEGIN:VALARM`,
    `TRIGGER:-PT${event.reminder}M`,
    `ACTION:DISPLAY`,
    `DESCRIPTION:${event.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function getUpcomingEvents(days = 7) {
  const now = new Date();
  const limit = new Date(now.getTime() + days * 86400000);
  return Array.from(calendarEvents.values())
    .filter(e => new Date(e.startDate) >= now && new Date(e.startDate) <= limit)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

function getSmartNotifications() {
  const now = new Date();
  const upcoming = getUpcomingEvents(3);
  const notifications = [];

  for (const event of upcoming) {
    const start = new Date(event.startDate);
    const hoursUntil = (start - now) / 3600000;

    if (hoursUntil <= event.reminder / 60 && hoursUntil > 0) {
      notifications.push({
        type: "reminder",
        eventId: event.id,
        title: event.title,
        message: `Tra ${Math.round(hoursUntil * 60)} minuti: ${event.title}`,
        urgency: hoursUntil < 0.5 ? "high" : "medium",
        domain: event.domain,
      });
    }

    // Seasonal warnings
    const month = start.getMonth();
    if (event.domain === "money" && (month === 10 || month === 11)) {
      notifications.push({
        type: "seasonal",
        eventId: event.id,
        title: "Rinnovi fine anno",
        message: `A dicembre potrebbero arrivare rinnovi assicurativi e fiscali. Vuoi che li anticipi?`,
        urgency: "low",
        domain: "money",
      });
    }
  }

  return notifications;
}

// ─── INTEGRATION STATUS ──────────────────────────────────────────────────────

function getIntegrationStatus() {
  return {
    calendar: { status: "local_only", message: "Calendario locale funzionante. Integrazione Google Calendar non ancora connessa." },
    email: { status: "simulated", message: "Lettura email simulata. Nessun account email connesso." },
    banking: { status: "simulated", message: "Dati bancari simulati. Nessuna integrazione Open Banking attiva." },
    health: { status: "simulated", message: "Promemoria sanitari simulati. Nessuna cartella clinica connessa." },
    shopping: { status: "simulated", message: "Liste della spesa locali. Nessuna integrazione e-commerce attiva." },
    smart_home: { status: "simulated", message: "Domotica simulata. Nessun sistema smart home connesso." },
  };
}

// ─── HTTP SERVER ──────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > 256 * 1024) { req.destroy(); reject(new Error("Body too large")); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function sendICS(res, icsString, filename) {
  res.writeHead(200, {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(icsString);
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // ── Chat endpoint ──
    if (path === "/api/chat" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const sessionId = body.sessionId || randomUUID();
      const response = await generateResponse(body.message || "", sessionId, body.state || {});
      return sendJSON(res, 200, { ...response, sessionId });
    }

    // ── LLM status endpoint ──
    if (path === "/api/llm-status" && req.method === "GET") {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const llmRes = await fetch(`${LLM_PYTHON_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timeout);
        const llmData = await llmRes.json();
        return sendJSON(res, 200, { python_llm: "connected", ...llmData });
      } catch (e) {
        return sendJSON(res, 200, { python_llm: "disconnected", fallback: "rule-based NLP" });
      }
    }

    // ── Task analysis endpoint ──
    if (path === "/api/analyze" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const task = analyzeTask(body.message || "");
      const trust = getTrustScore(task.intent, task.counterparty, task.domain);
      const level = getAutonomyLevel(trust.score, task.domain);
      return sendJSON(res, 200, { task, trust, level, dynamicSpendLimit: getDynamicSpendLimit(trust.score) });
    }

    // ── Trust endpoints ──
    if (path === "/api/trust" && req.method === "GET") {
      const profiles = Array.from(trustProfiles.values());
      return sendJSON(res, 200, { profiles, baselines: TRUST_BASELINE, ceilings: TRUST_CEILINGS });
    }

    if (path === "/api/trust/update" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const updated = updateTrust(body.action, body.counterparty, body.context, body.outcome, body.responseTimeMs);
      return sendJSON(res, 200, { profile: updated });
    }

    // ── Calendar endpoints ──
    if (path === "/api/calendar/events" && req.method === "GET") {
      const days = parseInt(url.searchParams.get("days") || "7", 10);
      const events = getUpcomingEvents(days);
      return sendJSON(res, 200, { events, total: calendarEvents.size });
    }

    if (path === "/api/calendar/events" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const event = createEvent(body);
      return sendJSON(res, 201, { event });
    }

    if (path === "/api/calendar/notifications" && req.method === "GET") {
      const notifications = getSmartNotifications();
      return sendJSON(res, 200, { notifications });
    }

    if (path.startsWith("/api/calendar/export/") && req.method === "GET") {
      const eventId = path.split("/").pop();
      const event = calendarEvents.get(eventId);
      if (!event) return sendJSON(res, 404, { error: "Event not found" });
      const ics = exportToICS(event);
      return sendICS(res, ics, `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`);
    }

    // ── Integration status ──
    if (path === "/api/integrations" && req.method === "GET") {
      return sendJSON(res, 200, getIntegrationStatus());
    }

    // ── Health check ──
    if (path === "/api/health") {
      return sendJSON(res, 200, { status: "ok", version: "1.0.0", uptime: process.uptime() });
    }

    // 404
    sendJSON(res, 404, { error: "Endpoint not found" });

  } catch (err) {
    console.error("AI Server error:", err.message);
    sendJSON(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  🤖 Everyday Agent AI Server`);
  console.log(`  ─────────────────────────`);
  console.log(`  http://127.0.0.1:${PORT}/api/`);
  console.log(`  LLM Backend: ${LLM_PYTHON_URL}`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/chat          — AI chatbot (LLM + rule fallback)`);
  console.log(`    POST /api/analyze       — Task classifier`);
  console.log(`    GET  /api/trust         — Trust profiles`);
  console.log(`    POST /api/trust/update  — Update trust`);
  console.log(`    GET  /api/calendar/events — Upcoming events`);
  console.log(`    POST /api/calendar/events — Create event`);
  console.log(`    GET  /api/calendar/notifications — Smart notifications`);
  console.log(`    GET  /api/calendar/export/:id — ICS export`);
  console.log(`    GET  /api/integrations  — Integration status`);
  console.log(`    GET  /api/health        — Health check\n`);
});

export {
  analyzeTask,
  classifyDomain,
  classifyIntent,
  createEvent,
  exportToICS,
  getAutonomyLevel,
  getDynamicSpendLimit,
  getSmartNotifications,
  getTrustScore,
  trustProfiles,
  updateTrust,
};
