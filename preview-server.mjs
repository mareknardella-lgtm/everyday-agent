import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);
const execFileAsync = promisify(execFile);
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'"
};

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

async function fileExists(filePath) {
  try { await stat(filePath); return true; } catch { return false; }
}

async function serveFile(response, filePath, statusCode = 200) {
  try {
    const body = await readFile(filePath);
    const ext = extname(filePath);
    response.writeHead(statusCode, { "Content-Type": contentTypes[ext] || "application/octet-stream", ...securityHeaders });
    response.end(body);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8", ...securityHeaders });
    response.end("Internal server error");
  }
}

async function resolveFile(baseDir, relativePath) {
  // Strip trailing slashes
  const clean = relativePath.replace(/\/+$/, "") || ".";
  const filePath = join(root, baseDir, clean);
  if (!filePath.startsWith(root)) return null;

  // Exact file match
  if (await fileExists(filePath)) {
    const st = await stat(filePath);
    if (st.isDirectory()) return join(filePath, "index.html");
    return filePath;
  }

  // Try .html extension (clean URLs: /faq/ -> faq.html)
  const htmlPath = filePath + ".html";
  if (await fileExists(htmlPath)) return htmlPath;

  // Try index.html inside directory
  const indexPath = join(filePath, "index.html");
  if (await fileExists(indexPath)) return indexPath;

  return null;
}

async function serveSimulationReport(response, requestUrl) {
  const parsed = new URL(requestUrl, "http://127.0.0.1");
  const requestedDays = Number(parsed.searchParams.get("days") || 365);
  const days = Number.isInteger(requestedDays) ? Math.min(730, Math.max(180, requestedDays)) : 365;
  const seed = Number(parsed.searchParams.get("seed") || 20260831);
  const scenarioParam = parsed.searchParams.get("scenario") || "{}";
  let scenario = {};
  try {
    scenario = JSON.parse(scenarioParam);
    if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) scenario = {};
  } catch {
    scenario = {};
  }
  const scenarioJson = JSON.stringify(scenario);
  const python = process.platform === "win32" ? "py" : "python3";
  const args = process.platform === "win32"
    ? ["-3", "lifecycle_simulation.py", "--days", String(days), "--seed", String(seed), "--scenario-json", scenarioJson, "--output", "-"]
    : ["lifecycle_simulation.py", "--days", String(days), "--seed", String(seed), "--scenario-json", scenarioJson, "--output", "-"];
  try {
    const result = await execFileAsync(python, args, { cwd: root, maxBuffer: 8 * 1024 * 1024 });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...securityHeaders });
    response.end(result.stdout);
  } catch (error) {
    response.writeHead(503, { "Content-Type": "application/json; charset=utf-8", ...securityHeaders });
    response.end(JSON.stringify({ error: "simulation_unavailable", message: "Il simulatore Python non è disponibile in questo ambiente." }));
  }
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

const server = createServer(async (request, response) => {
  const requestUrl = request.url || "/";
  const requestPath = decodeURIComponent(requestUrl.split("?")[0]);

  if (requestPath === "/simulation-report.json") {
    await serveSimulationReport(response, requestUrl);
    return;
  }

  // The root serves the dashboard HTML directly, so resolve its relative
  // assets from the app directory as well.
  const rootAppAsset = ["styles.css", "ops-overrides.css", "simulation.css", "app.js", "manifest.webmanifest"].includes(requestPath.slice(1));
  if (rootAppAsset) {
    const filePath = await resolveFile("app", requestPath.slice(1));
    if (filePath) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // Root opens the same dashboard as /app/.
  if (requestPath === "/") {
    const filePath = await resolveFile("app", "");
    if (filePath) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // /site/*
  if (requestPath.startsWith("/site/")) {
    const relativePath = requestPath.slice(6); // remove "/site"
    const filePath = await resolveFile("site", relativePath);
    if (filePath) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // /app/*
  if (requestPath.startsWith("/app/")) {
    const relativePath = requestPath.slice(5); // remove "/app"
    const filePath = await resolveFile("app", relativePath);
    if (filePath) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // /robots.txt, /sitemap.xml
  if (requestPath === "/robots.txt" || requestPath === "/sitemap.xml") {
    const filePath = join(root, requestPath.slice(1));
    if (await fileExists(filePath)) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // /favicon.svg
  if (requestPath === "/favicon.svg" || requestPath === "/favicon.ico") {
    const filePath = join(root, "site", "favicon.svg");
    if (await fileExists(filePath)) { await serveFile(response, filePath); }
    else { await serve404(response); }
    return;
  }

  // Everything else: 404
  await serve404(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Everyday Agent preview: http://127.0.0.1:${port}`);
  console.log(`  Landing site: http://127.0.0.1:${port}/site/`);
  console.log(`  App dashboard: http://127.0.0.1:${port}/app/`);
  console.log(`  FAQ: http://127.0.0.1:${port}/site/faq/`);
});
