import { createServer } from "node:http";
import { readFile, writeFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 4182);
const output = resolve("video/hermes-ai-hackathon-demo.webm");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webm": "video/webm",
  ".json": "application/json; charset=utf-8"
};

function send(response, status, body, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  response.end(body);
}

async function serveStatic(requestPath, response) {
  const relative = normalize(decodeURIComponent(requestPath).replace(/^\/+/, ""));
  const filePath = resolve(root, relative);
  if (!filePath.startsWith(root)) return send(response, 403, "Forbidden");
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return send(response, 404, "Not found");
    const body = await readFile(filePath);
    send(response, 200, body, types[extname(filePath)] || "application/octet-stream");
  } catch {
    send(response, 404, "Not found");
  }
}

const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/__save-video") {
    const chunks = [];
    let bytes = 0;
    request.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > 100 * 1024 * 1024) request.destroy(new Error("Video too large"));
      else chunks.push(chunk);
    });
    request.on("end", async () => {
      try {
        await writeFile(output, Buffer.concat(chunks));
        send(response, 200, JSON.stringify({ ok: true, bytes }), "application/json; charset=utf-8");
        console.log(`Saved ${output} (${bytes} bytes)`);
      } catch (error) {
        send(response, 500, JSON.stringify({ ok: false, error: error.message }), "application/json; charset=utf-8");
      }
    });
    request.on("error", error => send(response, 500, error.message));
    return;
  }

  const path = new URL(request.url || "/", `http://127.0.0.1:${port}`).pathname;
  serveStatic(path === "/" ? "/video/generate-demo.html" : path, response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Video generator: http://127.0.0.1:${port}/video/generate-demo.html?record=1`);
});
