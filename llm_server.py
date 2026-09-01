"""
Everyday Agent — LLM API Server
Exposes the RAG engine (TinyLlama + FAISS) as an HTTP API for the dashboard.
Run: py -3 llm_server.py [--port 4181]
API: http://127.0.0.1:4181/api/
"""

import json
import sys
import time
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

# ── Lazy init RAG engine ────────────────────────────────────────────────────

_rag = None
_rag_lock = threading.Lock()

def get_rag():
    global _rag
    if _rag is None:
        with _rag_lock:
            if _rag is None:
                import rag_engine
                rag_engine.initialize(preload=True)
                _rag = rag_engine
    return _rag


# ── HTTP Handler ─────────────────────────────────────────────────────────────

class LLMHandler(BaseHTTPRequestHandler):
    """HTTP handler for the LLM API."""

    def log_message(self, format, *args):
        # Suppress default logging for cleaner output
        pass

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._cors_headers()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 512 * 1024:
            return None
        return json.loads(self.rfile.read(length)) if length > 0 else {}

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Health check
        if path == "/api/health":
            return self._send_json(200, {
                "status": "ok",
                "model": "TinyLlama-1.1B-Chat",
                "engine": "RAG (FAISS + sentence-transformers)",
                "uptime": time.time() - _start_time,
            })

        # RAG stats
        if path == "/api/stats":
            rag = get_rag()
            return self._send_json(200, rag.get_stats())

        # Retrieve only (no generation)
        if path == "/api/retrieve":
            qs = parse_qs(parsed.query)
            query_text = qs.get("query", [""])[0]
            top_k = int(qs.get("top_k", ["5"])[0])
            if not query_text:
                return self._send_json(400, {"error": "Missing ?query= parameter"})
            rag = get_rag()
            chunks = rag.retrieve(query_text, top_k=top_k)
            return self._send_json(200, {
                "query": query_text,
                "results": [
                    {
                        "text": c["text"][:500],
                        "source": c["source"],
                        "relevance": round(c["relevance"], 3),
                    }
                    for c in chunks
                ],
            })

        self._send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # Full RAG query: retrieve + generate
        if path == "/api/chat":
            body = self._read_body()
            if body is None:
                return self._send_json(413, {"error": "Body too large"})

            query_text = body.get("query", "").strip()
            if not query_text:
                return self._send_json(400, {"error": "Missing 'query' field"})

            top_k = body.get("top_k", 5)
            max_tokens = body.get("max_tokens", 300)
            language = body.get("language", "auto")

            try:
                rag = get_rag()
                result = rag.query(
                    query_text,
                    top_k=top_k,
                    max_tokens=max_tokens,
                    language=language,
                )
                return self._send_json(200, result)
            except Exception as e:
                return self._send_json(500, {"error": str(e)})

        # Classify a task using NLP + trust context
        if path == "/api/classify":
            body = self._read_body()
            if body is None:
                return self._send_json(413, {"error": "Body too large"})

            query_text = body.get("query", "").strip()
            if not query_text:
                return self._send_json(400, {"error": "Missing 'query' field"})

            # Use RAG to classify the task
            rag = get_rag()
            chunks = rag.retrieve(f"classify task: {query_text}", top_k=3)
            context = "\n".join([c["text"][:200] for c in chunks])

            # Build classification prompt
            classify_prompt = (
                f"Based on this context from the Everyday Agent policy:\n{context}\n\n"
                f"Classify this user request into a domain (home/money/health/errands/family) "
                f"and determine the autonomy level (1=execute silently, 2=execute and inform, "
                f"3=ask first). Return JSON with keys: domain, level, reason.\n\n"
                f"User request: {query_text}"
            )

            try:
                response = rag.generate_response(
                    classify_prompt,
                    context_chunks=chunks,
                    max_new_tokens=150,
                    temperature=0.3,
                )
                return self._send_json(200, {
                    "query": query_text,
                    "classification": response,
                    "model": "TinyLlama-1.1B-Chat",
                })
            except Exception as e:
                return self._send_json(500, {"error": str(e)})

        # Quick RAG search (no generation, just retrieval)
        if path == "/api/search":
            body = self._read_body()
            if body is None:
                return self._send_json(413, {"error": "Body too large"})

            query_text = body.get("query", "").strip()
            if not query_text:
                return self._send_json(400, {"error": "Missing 'query' field"})

            rag = get_rag()
            chunks = rag.retrieve(query_text, top_k=body.get("top_k", 5))
            return self._send_json(200, {
                "query": query_text,
                "results": [
                    {
                        "text": c["text"][:500],
                        "source": c["source"],
                        "relevance": round(c["relevance"], 3),
                    }
                    for c in chunks
                ],
            })

        self._send_json(404, {"error": "Endpoint not found"})


# ── Server ───────────────────────────────────────────────────────────────────

_start_time = time.time()

def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4181

    # Pre-initialize RAG in background thread
    print(f"\n  🧠 Everyday Agent LLM Server")
    print(f"  ────────────────────────────")

    def init_background():
        get_rag()

    init_thread = threading.Thread(target=init_background, daemon=True)
    init_thread.start()

    server = ThreadingHTTPServer(("127.0.0.1", port), LLMHandler)
    print(f"  http://127.0.0.1:{port}/api/")
    print(f"  Endpoints:")
    print(f"    POST /api/chat          — Full RAG query (retrieve + generate)")
    print(f"    POST /api/classify      — Classify task with LLM")
    print(f"    POST /api/search        — Semantic search (no generation)")
    print(f"    GET  /api/retrieve?query= — Retrieve chunks")
    print(f"    GET  /api/stats         — RAG system stats")
    print(f"    GET  /api/health        — Health check")
    print(f"  Model: TinyLlama-1.1B-Chat")
    print(f"  Engine: FAISS + sentence-transformers (all-MiniLM-L6-v2)")
    print(f"  Running on http://127.0.0.1:{port}\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Shutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()
