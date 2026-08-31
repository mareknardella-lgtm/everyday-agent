import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const port = Number(process.env.PORT || 4174);
const root = resolve(".");
const html = await readFile(resolve(root, "app", "index.html"), "utf8");

// This launcher keeps the local app available on localhost. A native tray shell
// can point its WebView to this URL without changing the dashboard code.
const server = createServer((request, response) => {
  if (request.url === "/" || request.url === "/app/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }
  response.writeHead(404);
  response.end("Not found");
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Everyday Agent desktop shell target: http://127.0.0.1:${port}/`);
  console.log("Keep this process running in the background for local reminders.");
});

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
