#!/usr/bin/env node
/**
 * Everyday Agent — Unified Production Server
 * Serves both static files (landing, dashboard, demo) and AI API on a single port.
 * 
 * Run: node server.js
 * Railway: automatically uses PORT env variable
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, join } from "node:path";
import { randomUUID } from "node:crypto";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

// ─── STATIC FILE SERVING ─────────────────────────────────────────────────────

async function fileExists(filePath) {
  try { await stat(filePath); return true; } catch { return false; }
}

async function serveFile(response, filePath, statusCode = 200) {
  try {
    const body = await readFile(filePath);
    const ext = extname(filePath);
    response.writeHead(statusCode, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      ...securityHeaders,
    });
    response.end(body);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("Internal server error");
  }
}

async function resolveFile(baseDir, relativePath) {
  const clean = relativePath.replace(/\/+$/, "") || ".";
  const filePath = join(root, baseDir, clean);
  if (!filePath.startsWith(root)) return null;

  if (await fileExists(filePath)) {
    const st = await stat(filePath);
    if (st.isDirectory()) return join(filePath, "index.html");
    return filePath;
  }

  const htmlPath = filePath + ".html";
  if (await fileExists(htmlPath)) return htmlPath;

  const indexPath = join(filePath, "index.html");
  if (await fileExists(indexPath)) return indexPath;

  return null;
}

async function serve404(response) {
  const notFoundPath = join(root, "site", "404.html");
  if (await fileExists(notFoundPath)) {
    await serveFile(response, notFoundPath, 404);
  } else {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("404 Not Found");
  }
}

// ─── AI API (inline from ai-server.mjs) ──────────────────────────────────────

// NLP Engine
const ITALIAN_PATTERNS = {
  home: {
    keywords: ["casa", "rubinetto", "doccia", "boiler", "caldaia", "filtro", "finestra", "lucchetto", "puliz", "tappeto", "lavatrice", "frigorifero", "forno", "condizionatore", "tenda", "parquet", "piastrelle", "tubo", "scarico", "guarnizione", "radiatore", "termosifone", "lampada", "interruttore", "presa", "gas", "acqua", "elettricità", "impianto"],
    verbs: ["ripara", "sostituisci", "controlla", "pulisci", "ordina", "compra", "monta", "installa", "aggiusta"],
  },
  money: {
    keywords: ["bolletta", "fattura", "pagamento", "spesa", "budget", "conto", "banca", "carta", "addebito", "bonifico", "soldi", "euro", "prezzo", "costo", "abbonamento", "ricevuta", "imposta", "tasse", "reddito", "mutuo", "affitto", "rate"],
    verbs: ["paga", "versa", "trasferisci", "preleva", "deposita", "controlla", "saldi"],
  },
  health: {
    keywords: ["medico", "farmacia", "farmaco", "medicina", "ricetta", "visita", "esame", "analisi", "dentista", "oculista", "specialista", "ospedale", "clinica", "terapia", "vaccino", "allergia", "pressionsangue", "febbre", "salute", "benessere"],
    verbs: ["prenota", "richiama", "rinnova", "controlla", "acquista"],
    boost: ["medicine", "medicinale", "farmaco", "ricetta"],
  },
  errands: {
    keywords: ["spesa", "supermercato", "farmacia", "lista", "ordine", "consegna", "pacco", "poste", "taglier", "barber", "parrucchiere", "lavanderia", "meccanico", "auto", "benzina", "gommista", "assicurazione auto"],
    verbs: ["ordina", "compra", "prenota", "ritira", "consegna", "acquista"],
  },
  family: {
    keywords: ["figlio", "figlia", "bambino", "bambina", "partner", "moglie", "marito", "genitore", "famiglia", "scuola", "compito", "lezione", "calcio", "nuoto", "palestra", "compleanno", "regalo", "asilo"],
    verbs: ["prenota", "riporta", "paga", "controlla", "ricorda"],
  },
};

const URGENCY_KEYWORDS = {
  high: ["urgent", "urgente", "subito", "ora", "immediat", "critical", "critico", "pericolo", "emergenz", "rotto", "allagamento", "incendio", "fuga"],
  medium: ["questa settimana", "non posso aspettare", "appena possibile", "non rimandare"],
  low: ["quando puoi", "non urgente", "alla bisogna", "ogni tanto"],
};

function extractAmount(message) {
  const match = message.match(/(\d+(?:[.,]\d+)?)\s*(?:€|euro)/i) || message.match(/(?:€|euro)\s*(\d+(?:[.,]\d+)?)/i);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}

function extractCounterparty(message) {
  const known = ["enel", "eni", "hera", "acea", "tre", "wind", "vodafone", "tim", "fastweb", "poste", "amazon", "conad", "coop", "esselunga", "lidl", "aldi", "farmacia"];
  const lower = message.toLowerCase();
  for (const p of known) { if (lower.includes(p)) return p; }
  const m = lower.match(/(?:di|del|della|allo?|alla|per|con)\s+([a-zà-ú]{3,20})/i);
  return m ? m[1] : "generico";
}

function classifyDomain(message) {
  const scores = {};
  const lower = message.toLowerCase();
  for (const [domain, cfg] of Object.entries(ITALIAN_PATTERNS)) {
    let s = 0;
    for (const kw of cfg.keywords) { if (lower.includes(kw)) s += 2; }
    for (const v of cfg.verbs) { if (lower.includes(v)) s += 3; }
    if (cfg.boost) { for (const b of cfg.boost) { if (lower.includes(b)) s += 5; } }
    if (s > 0) scores[domain] = s;
  }
  if (!Object.keys(scores).length) return "general";
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function classifyIntent(message) {
  const lower = message.toLowerCase().trim();
  if (/^(ciao|salve|hey|buongiorno|buonasera|hello|hi)\b/i.test(lower)) return { type: "greeting", domain: null };
  if (/^(cosa sai|cosa puoi|come funzioni|cosa fai|what can you|how do you|chi sei)\b/i.test(lower)) return { type: "capability_question", domain: null };
  if (/fiducia|trust|punteggio|score|livello/i.test(lower)) return { type: "trust_query", domain: null };
  if (/^(che succede|stato|status|aggiornamento|riepilogo|come stai|what.s up)\b/i.test(lower)) return { type: "status_query", domain: null };
  if (/^(annulla|undo|revert|indietro|cambia idea)\b/i.test(lower)) return { type: "undo_request", domain: null };
  if (/^(perché|perche|why|come mai|spiegami|motivo)/i.test(lower)) return { type: "explanation_request", domain: null };
  return { type: "task_request", domain: null };
}

// Trust Engine
const trustProfiles = new Map();
const TRUST_BASELINE = 20;
const TRUST_CEILINGS = { money: 85, health: 75, legal: 60, family: 80, home: 95, errands: 95, general: 90 };

function getTrustScore(action, counterparty, context) {
  const key = `${action}|${counterparty}|${context}`;
  const p = trustProfiles.get(key);
  if (!p) return { score: TRUST_BASELINE, interactions: 0, source: "new" };
  const days = (Date.now() - new Date(p.lastInteractionAt).getTime()) / 86400000;
  const decay = Math.min(p.score - TRUST_BASELINE, Math.floor(days / 7));
  return { ...p, score: Math.max(TRUST_BASELINE, p.score - decay) };
}

function getAutonomyLevel(score, domain) {
  if (["money", "health", "legal"].includes(domain)) return score >= 70 ? 2 : 3;
  if (score >= 70) return 1;
  if (score >= 40) return 2;
  return 3;
}

function getDynamicSpendLimit(score) {
  return Math.round(50 + (score - 20) * (450 / 80));
}

// Chat
const conversationMemory = new Map();

function generateResponse(message, sessionId, state) {
  const intent = classifyIntent(message);
  const domain = classifyDomain(message);
  const amount = extractAmount(message);
  const counterparty = extractCounterparty(message);
  const urgency = Object.entries(URGENCY_KEYWORDS).find(([_, kws]) => kws.some(k => message.toLowerCase().includes(k)));

  if (!conversationMemory.has(sessionId)) conversationMemory.set(sessionId, []);
  conversationMemory.get(sessionId).push({ role: "user", content: message, timestamp: Date.now() });

  let response;
  const userName = state?.userName || "utente";

  switch (intent.type) {
    case "greeting":
      response = { text: `Ciao ${userName}! Sono il tuo Everyday Agent. Gestisco casa, soldi, salute, commissioni e famiglia. Per le decisioni che contano, ti chiedo prima. Per il resto, imparo e agisco. Cosa posso fare per te?`, level: null, task: null };
      break;
    case "capability_question":
      response = { text: `Cosa posso fare:\n\n🏠 Casa — Manutenzione, scorte, scadenze garanzia\n💰 Denaro — Budget, pagamenti ricorrenti, spese\n🏥 Salute — Promemoria farmacia, visite, ricette\n🛒 Commissioni — Liste della spesa, ordini, prenotazioni\n👨‍👩‍👧 Famiglia — Scadenze scuola, attività, calendario\n\nPer ogni azione calcolo un punteggio di fiducia dinamico. Più mi fidi, più agisco in silenzio. Prova a dirmi cosa vuoi delegare!`, level: null, task: null };
      break;
    case "trust_query": {
      const top = Array.from(trustProfiles.values()).sort((a, b) => b.score - a.score).slice(0, 5);
      if (!top.length) {
        response = { text: `Non ho profili di fiducia ancora. Ogni interazione aggiorna il motore. Prova a farmi una richiesta e poi approvala o rifiutala!`, level: null, task: null };
      } else {
        let t = `I tuoi profili di fiducia:\n\n`;
        for (const p of top) {
          const lv = getAutonomyLevel(p.score, p.context);
          const icon = lv === 1 ? "🟢 Eseguo" : lv === 2 ? "🟡 Informo" : "🔴 Chiedo";
          t += `• ${p.action} + ${p.counterparty} (${p.context}): ${p.score.toFixed(0)}/100 → ${icon}\n`;
        }
        t += `\nTetto massimo: denaro 85, salute 75, legale 60.`;
        response = { text: t, level: null, task: null };
      }
      break;
    }
    case "status_query": {
      const tasks = state?.customTasks || [];
      const pending = tasks.filter(t => t.status === "pending");
      const done = tasks.filter(t => t.status === "completed");
      response = { text: `📊 Stato:\n• Task attivi: ${pending.length}\n• Completati: ${done.length}\n• Profili fiducia: ${trustProfiles.size}\n• Calibrazione: ${state?.calibrationDaysRemaining > 0 ? state.calibrationDaysRemaining + " giorni" : "completata"}`, level: null, task: null };
      break;
    }
    case "undo_request":
      response = { text: `Puoi dire "annulla" dopo un'azione completata. Le azioni irreversible (cancellazioni, invii denaro) richiedono sempre conferma prima.`, level: null, task: null };
      break;
    case "explanation_request":
      response = { text: `Ogni mia azione è spiegabile. Chiedimi "perché" dopo un'azione e timostro la regola applicata, il livello di fiducia e il motivo.`, level: null, task: null };
      break;
    default: {
      const trust = getTrustScore(intent.type, counterparty, domain);
      const level = getAutonomyLevel(trust.score, domain);
      const limit = getDynamicSpendLimit(trust.score);
      let text;

      if (level === 1 && !amount) {
        text = `✅ Fiducia ${trust.score.toFixed(0)}/100 · ${message.slice(0, 80)}\n\nGestisco in silenzio. Limite dinamico: €${limit}. Azione reversibile e tracciata.`;
        response = { text, level, task: { title: message.slice(0, 120), domain, counterparty, trustScore: trust.score, level, status: "approved", autoExecuted: true } };
      } else if (level === 2) {
        text = `✅ Fiducia ${trust.score.toFixed(0)}/100 · ${message.slice(0, 80)}\n\nLo gestisco e lo includo nel prossimo digest. Ti informo al termine.`;
        response = { text, level, task: { title: message.slice(0, 120), domain, counterparty, trustScore: trust.score, level, status: "approved", inDigest: true } };
      } else {
        const outcome = `Se non rispondi entro 48h, la richiesta scade.`;
        text = `⚠️ Serve una tua decisione · fiducia ${trust.score.toFixed(0)}/100\n\n${message.slice(0, 80)}\n\n• Contesto: ${domain} · Controparte: ${counterparty}\n• Se non rispondi: ${outcome}\n• Limite dinamico: €${limit}\n\nVuoi che proceda o preferisci gestirlo tu?`;
        response = { text, level, task: { title: message.slice(0, 120), domain, counterparty, trustScore: trust.score, level, status: "awaiting_decision" } };
      }
    }
  }

  conversationMemory.get(sessionId).push({ role: "assistant", content: response.text, timestamp: Date.now() });
  return response;
}

// ─── REQUEST BODY READER ─────────────────────────────────────────────────────

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
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...securityHeaders,
  });
  res.end(body);
}

// ─── SERVER ──────────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${port}`);
  const requestPath = decodeURIComponent(url.pathname);

  try {
    // ── AI API ROUTES ──

    if (requestPath === "/api/chat" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const sessionId = body.sessionId || randomUUID();
      const response = generateResponse(body.message || "", sessionId, body.state || {});
      return sendJSON(res, 200, { ...response, sessionId });
    }

    if (requestPath === "/api/analyze" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const domain = classifyDomain(body.message || "");
      const intent = classifyIntent(body.message || "");
      const trust = getTrustScore(intent.type, extractCounterparty(body.message || ""), domain);
      const level = getAutonomyLevel(trust.score, domain);
      return sendJSON(res, 200, { domain, intent: intent.type, trust, level, dynamicSpendLimit: getDynamicSpendLimit(trust.score) });
    }

    if (requestPath === "/api/trust" && req.method === "GET") {
      return sendJSON(res, 200, { profiles: Array.from(trustProfiles.values()), baseline: TRUST_BASELINE, ceilings: TRUST_CEILINGS });
    }

    if (requestPath === "/api/health") {
      return sendJSON(res, 200, { status: "ok", version: "2.0.0", uptime: process.uptime(), mode: "production" });
    }

    if (requestPath === "/api/llm-status") {
      return sendJSON(res, 200, { python_llm: "not_bundled", note: "Start llm_server.py separately for RAG responses", fallback: "rule-based NLP active" });
    }

    // ── STATIC FILE ROUTES ──

    // Simulation report
    if (requestPath === "/simulation-report.json") {
      return sendJSON(res, 200, { error: "simulation_requires_python", message: "Run lifecycle_simulation.py locally" });
    }

    // Root app assets
    const rootAppAsset = ["styles.css", "ops-overrides.css", "simulation.css", "app.js", "manifest.webmanifest"].includes(requestPath.slice(1));
    if (rootAppAsset) {
      const filePath = await resolveFile("app", requestPath.slice(1));
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // Root → dashboard
    if (requestPath === "/") {
      const filePath = await resolveFile("app", "");
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // /site/*
    if (requestPath.startsWith("/site/")) {
      const rel = requestPath.slice(6);
      const filePath = await resolveFile("site", rel);
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // /app/*
    if (requestPath.startsWith("/app/")) {
      const rel = requestPath.slice(5);
      const filePath = await resolveFile("app", rel);
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // Trust demo (root level)
    if (requestPath === "/trust-demo.html" || requestPath === "/trust-demo") {
      const filePath = await resolveFile(".", "trust-demo.html");
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // Gallery
    if (requestPath.startsWith("/gallery/")) {
      const rel = requestPath.slice(9);
      const filePath = await resolveFile("gallery", rel);
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // Video
    if (requestPath.startsWith("/video/")) {
      const rel = requestPath.slice(7);
      const filePath = await resolveFile("video", rel);
      if (filePath) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // robots.txt, sitemap.xml
    if (requestPath === "/robots.txt" || requestPath === "/sitemap.xml") {
      const filePath = join(root, requestPath.slice(1));
      if (await fileExists(filePath)) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // favicon
    if (requestPath === "/favicon.svg" || requestPath === "/favicon.ico") {
      const filePath = join(root, "site", "favicon.svg");
      if (await fileExists(filePath)) return await serveFile(res, filePath);
      return await serve404(res);
    }

    // Everything else → try as file
    const filePath = await resolveFile(".", requestPath.slice(1));
    if (filePath) return await serveFile(res, filePath);

    await serve404(res);
  } catch (err) {
    console.error("Server error:", err.message);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders });
    res.end("Internal server error");
  }
});

// Listen on 0.0.0.0 for Railway (not 127.0.0.1)
server.listen(port, "0.0.0.0", () => {
  console.log(`\n  Everyday Agent — Production Server`);
  console.log(`  ────────────────────────────────`);
  console.log(`  http://localhost:${port}`);
  console.log(`  http://0.0.0.0:${port} (Railway)`);
  console.log(`  `);
  console.log(`  Routes:`);
  console.log(`    /                    → Dashboard`);
  console.log(`    /site/               → Landing page`);
  console.log(`    /site/faq/           → FAQ`);
  console.log(`    /trust-demo.html     → Trust Engine Demo`);
  console.log(`    /api/chat            → AI chatbot (POST)`);
  console.log(`    /api/analyze         → Task classifier (POST)`);
  console.log(`    /api/trust           → Trust profiles (GET)`);
  console.log(`    /api/health          → Health check`);
  console.log(`    /gallery/*           → Screenshots`);
  console.log(`    /video/*             → Demo video\n`);
});
