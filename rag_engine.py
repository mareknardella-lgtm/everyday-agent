"""
Everyday Agent — RAG Engine
Local retrieval-augmented generation using TinyLlama + FAISS + sentence-transformers.
No API keys, no cloud, everything runs on your machine.
"""

import os
import json
import re
import time
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import numpy as np

# Lazy imports to avoid slow startup if not needed
_model = None
_tokenizer = None
_embedder = None
_faiss_index = None
_chunks: List[Dict[str, Any]] = []
_lock = threading.Lock()
_initialized = False

BASE_DIR = Path(__file__).parent
DOCS_DIR = BASE_DIR  # project root

# Documents to ingest for RAG knowledge base
RAG_SOURCES = [
    "MASTER_POLICY.md",
    "LEGAL_COMPLIANCE_BASELINE.md",
    "ARCHITECTURE.md",
    "README.md",
    "SUBMISSION.md",
    "TESTING.md",
    "PRELAUNCH_SIMULATION.md",
    "DESKTOP.md",
    "everyday_agent.py",
    "ai-server.mjs",
]


def _chunk_text(text: str, chunk_size: int = 600, overlap: int = 80) -> List[str]:
    """Split text into overlapping chunks by character count, respecting paragraph boundaries."""
    # First split by double newlines (paragraphs)
    paragraphs = re.split(r'\n\s*\n', text)
    chunks = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        # If adding this paragraph exceeds chunk_size, save current and start new
        if len(current) + len(para) + 2 > chunk_size and current:
            chunks.append(current.strip())
            # Keep overlap from end of current chunk
            if overlap > 0 and len(current) > overlap:
                current = current[-overlap:] + "\n\n" + para
            else:
                current = para
        else:
            current = current + "\n\n" + para if current else para

    if current.strip():
        chunks.append(current.strip())

    return chunks


def _load_documents() -> List[Dict[str, Any]]:
    """Load and chunk all source documents."""
    all_chunks = []

    for filename in RAG_SOURCES:
        filepath = DOCS_DIR / filename
        if not filepath.exists():
            print(f"  ⚠️  Skipping {filename} (not found)")
            continue

        try:
            text = filepath.read_text(encoding="utf-8")
        except Exception as e:
            print(f"  ⚠️  Error reading {filename}: {e}")
            continue

        # Skip binary-like files
        if len(text) < 50:
            continue

        chunks = _chunk_text(text)
        for i, chunk in enumerate(chunks):
            all_chunks.append({
                "text": chunk,
                "source": filename,
                "chunk_index": i,
                "char_count": len(chunk),
            })

        print(f"  📄 {filename}: {len(chunks)} chunks ({len(text)} chars)")

    return all_chunks


def _get_embedder():
    """Lazy-load sentence-transformers embedder."""
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        print("  🔧 Loading embedding model (all-MiniLM-L6-v2)...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _get_llm():
    """Lazy-load TinyLlama model and tokenizer."""
    global _model, _tokenizer
    if _model is None:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        print("  🧠 Loading TinyLlama 1.1B (first time may take ~30s)...")
        model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _model = AutoModelForCausalLM.from_pretrained(
            model_name,
            dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if hasattr(__import__("transformers"), "device_map") else None,
            low_cpu_mem_usage=True,
        )
        print("  ✅ TinyLlama loaded")
    return _model, _tokenizer


def _build_faiss_index(chunks: List[Dict[str, Any]]):
    """Build FAISS index from chunk embeddings."""
    global _faiss_index, _chunks
    import faiss

    embedder = _get_embedder()
    texts = [c["text"] for c in chunks]
    print(f"  🔢 Embedding {len(texts)} chunks...")
    embeddings = embedder.encode(texts, show_progress_bar=False, batch_size=32)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings, dtype=np.float32))

    _faiss_index = index
    _chunks = chunks
    print(f"  ✅ FAISS index built: {index.ntotal} vectors, dim={dim}")


def initialize(preload: bool = True):
    """Initialize the RAG system: load docs, build index, load LLM.
    If preload=True (default), the model is fully loaded into memory
    so the first query doesn't have a 45s delay.
    """
    global _initialized
    if _initialized:
        return

    with _lock:
        if _initialized:
            return

        print("\n  Initializing Everyday Agent RAG Engine...")
        print("  Loading documents...")
        chunks = _load_documents()
        print(f"  Total chunks: {len(chunks)}")

        if not chunks:
            print("  No documents found! Check RAG_SOURCES.")
            return

        _build_faiss_index(chunks)
        if preload:
            print("  Pre-loading TinyLlama into memory...")
            _get_llm()
            # Warm up with a dummy inference to ensure CUDA/caches are ready
            import torch
            model, tokenizer = _get_llm()
            warmup = tokenizer("Hello", return_tensors="pt")
            with torch.no_grad():
                model.generate(**warmup, max_new_tokens=5)
            print("  Model warmed up")
        _initialized = True
        print("  RAG Engine ready!\n")


def retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve most relevant chunks for a query."""
    if not _initialized:
        initialize()

    embedder = _get_embedder()
    query_embedding = embedder.encode([query])
    distances, indices = _faiss_index.search(
        np.array(query_embedding, dtype=np.float32), min(top_k, len(_chunks))
    )

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(_chunks):
            continue
        chunk = _chunks[idx].copy()
        chunk["distance"] = float(dist)
        chunk["relevance"] = max(0, 1 - dist / 100)  # normalize to 0-1
        results.append(chunk)

    return results


def generate_response(
    query: str,
    context_chunks: Optional[List[Dict[str, Any]]] = None,
    max_new_tokens: int = 250,
    temperature: float = 0.5,
    system_prompt: str = "",
    language: str = "auto",
) -> str:
    """Generate a response using TinyLlama with RAG context."""
    if not _initialized:
        initialize()

    if context_chunks is None:
        context_chunks = retrieve(query)

    # Detect language
    is_italian = language == "it" or bool(re.search(r'[àèéìòùÀÈÉÌÒÙ]', query)) or any(w in query.lower() for w in ["ciao", "come", "cosa", "quale", "perché", "dimmi"])

    # Build context — max 2 chunks, truncated to keep prompt small
    context_parts = []
    for c in context_chunks[:2]:
        text = c['text'][:600]  # truncate long chunks
        context_parts.append(f"[{c['source']}]: {text}")
    context_text = "\n\n".join(context_parts)

    if is_italian:
        system_prompt = (
            "Sei Everyday Agent, un assistente AI che gestisce la vita quotidiana: "
            "casa, soldi, salute, commissioni, famiglia. "
            "Rispondi SEMPRE in italiano. "
            "Sii CONCISO: max 3-4 frasi. "
            "NON copiare il testo dei documenti. "
            "Rispondi in modo diretto e pratico. "
            "Cita le fonti solo se necessario."
        )
    else:
        system_prompt = (
            "You are Everyday Agent, a helpful AI assistant for managing daily life. "
            "Be CONCISE: max 3-4 sentences. "
            "Do NOT copy-paste document text. "
            "Answer directly and practically. "
            "Cite sources only if needed."
        )

    # Format prompt for TinyLlama ChatML format
    prompt = (
        f"<|system|>\n{system_prompt}\n</|system|>\n"
        f"<|user|>\n"
        f"Informazioni dal database:\n{context_text}\n\n"
        f"Domanda: {query}\n"
        f"</|user|>\n"
        f"<|assistant|>\n"
    )

    model, tokenizer = _get_llm()
    import torch

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1500)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=0.85,
            top_k=40,
            repetition_penalty=1.15,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )

    # Decode only the new tokens
    generated = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
    return generated.strip()


def query(
    question: str,
    top_k: int = 5,
    max_tokens: int = 300,
    language: str = "auto",
) -> Dict[str, Any]:
    """Full RAG query: retrieve + generate. Returns response with sources."""
    start = time.time()

    # Detect language
    if language == "auto":
        has_italian = bool(re.search(r'[àèéìòùÀÈÉÌÒÙ]', question))
        language = "it" if has_italian or any(w in question.lower() for w in ["ciao", "come", "cosa", "quale"]) else "en"

    # Retrieve relevant chunks
    chunks = retrieve(question, top_k=top_k)

    # Generate response
    response = generate_response(question, context_chunks=chunks, max_new_tokens=max_tokens, language=language)

    elapsed = time.time() - start

    return {
        "response": response,
        "sources": [
            {
                "source": c["source"],
                "relevance": round(c["relevance"], 3),
                "excerpt": c["text"][:200] + "..." if len(c["text"]) > 200 else c["text"],
            }
            for c in chunks
        ],
        "model": "TinyLlama-1.1B-Chat",
        "retrieval_time_ms": round((time.time() - start) * 1000 - elapsed * 300, 1),
        "generation_time_ms": round(elapsed * 1000, 1),
        "language": language,
    }


def get_stats() -> Dict[str, Any]:
    """Get RAG system statistics."""
    return {
        "initialized": _initialized,
        "total_chunks": len(_chunks),
        "sources": list(set(c["source"] for c in _chunks)) if _chunks else [],
        "index_size": _faiss_index.ntotal if _faiss_index else 0,
        "embedding_dim": _faiss_index.d if _faiss_index else 0,
    }


if __name__ == "__main__":
    # Quick test
    initialize()
    print("\n--- Test Query ---")
    result = query("What is the Dynamic Trust Engine?")
    print(f"Response: {result['response']}")
    print(f"Sources: {[s['source'] for s in result['sources']]}")
    print(f"Time: {result['generation_time_ms']:.0f}ms")
