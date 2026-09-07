import { connect } from "node:net";
import { createHash, randomBytes } from "node:crypto";

const endpointUrl = process.argv[2] || "http://127.0.0.1:9222/json/list";
const timeoutMs = 240_000;

function readHttpJson(url) {
  return fetch(url).then(async response => {
    if (!response.ok) throw new Error(`Chrome endpoint returned HTTP ${response.status}`);
    return response.json();
  });
}

function websocketAccept(key) {
  return createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
}

function encodeClientFrame(text) {
  const payload = Buffer.from(text);
  const mask = randomBytes(4);
  let header;
  if (payload.length < 126) {
    header = Buffer.from([0x81, 0x80 | payload.length]);
  } else if (payload.length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(payload.length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(payload.length), 2);
  }
  const masked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i += 1) masked[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

class CDP {
  constructor(wsUrl) {
    this.wsUrl = new URL(wsUrl);
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.id = 0;
    this.pending = new Map();
    this.handshake = false;
    this.handshakeBuffer = Buffer.alloc(0);
  }

  async open() {
    const port = Number(this.wsUrl.port || 80);
    const host = this.wsUrl.hostname;
    const path = `${this.wsUrl.pathname}${this.wsUrl.search}`;
    const key = randomBytes(16).toString("base64");
    this.socket = connect({ host, port });
    await new Promise((resolve, reject) => {
      const onError = error => { this.socket?.destroy(); reject(error); };
      this.socket.once("error", onError);
      this.socket.once("connect", () => {
        this.socket.off("error", onError);
        this.socket.write([
          `GET ${path} HTTP/1.1`,
          `Host: ${host}:${port}`,
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Key: ${key}`,
          "Sec-WebSocket-Version: 13",
          "",
          ""
        ].join("\r\n"));
      });
      const checkHandshake = () => {
        const marker = this.handshakeBuffer.indexOf("\r\n\r\n");
        if (marker < 0) return;
        const header = this.handshakeBuffer.subarray(0, marker).toString();
        if (!header.includes("101 Switching Protocols")) {
          reject(new Error(`WebSocket handshake failed: ${header}`));
          return;
        }
        const expected = websocketAccept(key);
        const match = header.match(/Sec-WebSocket-Accept:\s*(.+)/i);
        if (!match || match[1].trim() !== expected) {
          reject(new Error("WebSocket accept key mismatch"));
          return;
        }
        this.handshake = true;
        const remaining = this.handshakeBuffer.subarray(marker + 4);
        this.handshakeBuffer = Buffer.alloc(0);
        if (remaining.length) this.consume(remaining);
        resolve();
      };
      this.socket.on("data", data => {
        if (!this.handshake) {
          this.handshakeBuffer = Buffer.concat([this.handshakeBuffer, data]);
          checkHandshake();
        } else {
          this.consume(data);
        }
      });
    });
  }

  consume(data) {
    this.buffer = Buffer.concat([this.buffer, data]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      let offset = 2;
      let length = second & 0x7f;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }
      const masked = Boolean(second & 0x80);
      if (masked) offset += 4;
      if (this.buffer.length < offset + length) return;
      let payload = this.buffer.subarray(offset, offset + length);
      if (masked) {
        const maskOffset = offset - 4;
        const mask = this.buffer.subarray(maskOffset, offset);
        const decoded = Buffer.alloc(length);
        for (let i = 0; i < length; i += 1) decoded[i] = payload[i] ^ mask[i % 4];
        payload = decoded;
      }
      this.buffer = this.buffer.subarray(offset + length);
      const opcode = first & 0x0f;
      if (opcode === 0x8) return;
      if (opcode === 0x1) {
        try {
          const message = JSON.parse(payload.toString());
          if (message.id && this.pending.has(message.id)) {
            const pending = this.pending.get(message.id);
            this.pending.delete(message.id);
            if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
            else pending.resolve(message.result);
          }
        } catch {
          // Ignore non-JSON protocol frames.
        }
      }
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.write(encodeClientFrame(JSON.stringify({ id, method, params })));
    });
  }

  close() {
    this.socket?.end();
  }
}

async function main() {
  const deadline = Date.now() + timeoutMs;
  let target;
  while (Date.now() < deadline) {
    try {
      const targets = await readHttpJson(endpointUrl);
      target = targets.find(item => item.type === "page" && item.url.includes("generate-demo.html")) || targets.find(item => item.type === "page");
      if (target?.webSocketDebuggerUrl) break;
    } catch {
      // Chrome is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!target?.webSocketDebuggerUrl) throw new Error("Could not find the video generator Chrome tab");

  const cdp = new CDP(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Runtime.enable");
  const result = await cdp.send("Runtime.evaluate", {
    expression: `new Promise(resolve => {
      const started = Date.now();
      const check = () => {
        if (window.generationDone) resolve({ done: true, size: window.generationSavedBytes || window.generationSize || 0 });
        else if (window.generationError) resolve({ done: false, error: window.generationError });
        else if (Date.now() - started > ${timeoutMs - 5000}) resolve({ done: false, error: "Timed out waiting for recording" });
        else setTimeout(check, 1000);
      };
      check();
    })`,
    awaitPromise: true,
    returnByValue: true
  });
  cdp.close();
  if (!result?.result?.value?.done) throw new Error(result?.result?.value?.error || "Video generation failed");
  console.log(JSON.stringify(result.result.value));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
