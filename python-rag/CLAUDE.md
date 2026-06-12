# MOMsoft RAG Backend — Project Context

## What this project is

A Python/FastAPI RAG (Retrieval-Augmented Generation) pipeline that reads industrial MOMsoft documents (CdC, Exigences, Guide Smart Factory) and generates structured requirement lists (exigences) as JSON. Used by MOMsoft to automatically produce project requirement specs from client Cahiers des Charges, grounded in a knowledge base of past requirements and the Smart Factory product guide.

---

## Stack

| Layer | Technology |
|---|---|
| API | FastAPI + uvicorn, port 8000 |
| Embedding | `paraphrase-multilingual-MiniLM-L12-v2` (384 dims, sentence-transformers) |
| Vector DB | ChromaDB persistent (`./vector_db`, cosine distance, collection = `documents`) |
| Reranker | `cross-encoder/ms-marco-MiniLM-L-6-v2` (sigmoid → 0–100 score) |
| LLM primary | Google Gemini `gemini-2.5-flash` (env: `GEMINI_MODEL`), dual-key failover |
| LLM fallback | Groq `llama-3.3-70b-versatile` (env: `GROQ_MODEL`) |
| Doc parsing | PyMuPDF → pdfplumber → PyPDF2 (PDF), python-docx (DOCX), openpyxl (XLSX), BeautifulSoup (HTML), pytesseract/easyocr (OCR fallback) |
| Integration | Angular front-end + Spring Boot gateway |

---

## Project Structure

```
python-rag/
├── src/
│   ├── api/
│   │   └── main.py              ← FastAPI app, all endpoints
│   ├── generation/
│   │   ├── llm.py               ← LLMConnector (Groq + Gemini, JSON parser)
│   │   ├── prompt_builder.py    ← PromptBuilder (3-section prompt assembly)
│   │   └── rag_pipeline.py      ← RAGPipeline orchestrator
│   ├── retrieval/
│   │   ├── retriever.py         ← ChromaDB embedding search
│   │   ├── reranker.py          ← Cross-encoder reranker
│   │   └── faiss_store.py       ← (unused/legacy)
│   └── document/
│       ├── CdC/                 ← Client cahiers des charges (input docs)
│       ├── Exigences/           ← Past requirement examples (RAG knowledge base)
│       ├── Guide/               ← Smart Factory product guide
│       └── AFD/                 ← Analyse Fonctionnelle Détaillée docs
├── scripts/
│   ├── ingestion.py             ← Full ingestion pipeline (Phase 1 + Phase 2)
│   ├── inspect_vector_db.py
│   ├── export_vector_db_to_sqlite.py
│   └── extraction_audit.csv / coverage_report.csv (generated)
├── integration/
│   ├── angular/                 ← Angular component/service/model stubs
│   └── spring-boot/             ← Spring Boot proxy/gateway stubs
├── vector_db/                   ← ChromaDB persistent storage
├── test_ui.html                 ← Standalone HTML test page
├── requirements.txt
├── .env                         ← API keys (not committed)
└── .env.example                 ← Env var template
```

---

## 3-Step Pipeline

### Step 1 — Ingestion (`scripts/ingestion.py`)

- **Formats:** PDF, DOCX, XLSX, CSV, HTML, TXT, JRXML/XML, PNG/JPG
- **PDF strategy:** PyMuPDF → pdfplumber (+ tables) → PyPDF2 fallback
- **Chunking:** 800-char chunks, 100-char overlap, paragraph-first then sentence-then-word split
- **PII masking:** emails, phones, passwords, JWT tokens in free text; sensitive column names in CSV/XLSX (`[REDACTED]`)
- **Embedding:** `paraphrase-multilingual-MiniLM-L12-v2`, no prefix needed (unlike e5 models)
- **Deduplication:** stable ID = `{category}_{sha1(source)[:8]}_{chunk_id:04d}`
- **Current state:** 161 docs indexed, 3204 chunks
- **Outputs:** `scripts/extraction_audit.csv`, `scripts/coverage_report.csv`, timestamped `chunks_*.csv`

Document categories are inferred from folder path: `afd` → AFD, `cdc` → CdC, `exigences` → Exigences, `guide` → Guide.

### Step 2 — Retrieval

**Retriever** (`src/retrieval/retriever.py`):
- `search(query, top_k, category)` — cosine search in ChromaDB, `MIN_SCORE = 0.30`
- `search_for_exigences(query, top_k)` — 3 parallel searches (CdC + Exigences + Guide), returns `(docs_cdc_exig, docs_guide)`
- Score conversion: `1.0 - (distance / 2.0)` (ChromaDB cosine distance ∈ [0,2])

**Reranker** (`src/retrieval/reranker.py`):
- Cross-encoder pairs `(query, doc_text)` → raw score → sigmoid → [0–100]
- Passthrough fallback if model unavailable (preserves retriever order)

### Step 3 — Generation

**PromptBuilder** (`src/generation/prompt_builder.py`):
- `build_exigences()`: 3-section user message:
  1. `=== EXEMPLES EXIGENCES PASSEES ===` (chunks CdC + Exigences, up to `MAX_CONTEXT_CHARS = 20000`)
  2. `=== GUIDE SMART FACTORY ===` (Guide chunks)
  3. `=== CAHIER DES CHARGES CLIENT ===` (raw CdC text, truncated to `CDC_MAX_CHARS = 5000`)
- `build()`: generic 4-section prompt (project context + CdC/exigences + guide + query)
- System prompts defined per type: `exigences`, `afd`, `planning`, `generic`

**LLMConnector** (`src/generation/llm.py`):
- Provider selected via `LLM_PROVIDER` env var (`groq` or `gemini`)
- Gemini: dual-key failover (`GOOGLE_API_KEY` + `GOOGLE_API_KEY_2`), 2 retries with 60s/120s waits on quota errors
- Extracts only non-thinking parts from Gemini 2.5 Flash responses (skips `thought=True` parts)
- JSON parser pipeline: strip `<think>` → markdown fence → brace counting → direct parse → truncation repair
- Mock response if no API key configured

**RAGPipeline** (`src/generation/rag_pipeline.py`):
- `generate_exigences(cdc_text, project_name, client_name, product_name, top_k)` — dedicated CdC flow
- `run(query, category, top_k, project_context)` — generic flow

---

## JSON Output Schema (exigences)

```json
{
  "exigences": [
    {
      "id": "EX-001",
      "type": "Fonctionnelle",
      "intitule": "Titre court (5-8 mots)",
      "objectifClient": "Objectif métier du client en 1-2 phrases",
      "description": "Description technique détaillée en 2-3 phrases",
      "solutionProposee": "Module MOMsoft Smart Factory correspondant",
      "limitesHypotheses": "Contraintes ou hypothèses connues"
    }
  ],
  "nb_exigences": 0,
  "resume": "Synthèse courte du périmètre fonctionnel extrait"
}
```

Types allowed: `"Fonctionnelle"`, `"Non-fonctionnelle"`, `"Sécurité"`, `"Performance"`

---

## API Endpoints (`src/api/main.py`)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status + ChromaDB doc count + active LLM provider |
| POST | `/upload/{category}` | Upload file (PDF/DOCX/XLSX/CSV/TXT/HTML/PNG/JPG) → index in ChromaDB |
| POST | `/generate/exigences` | Body: `{cdc_text, project_name, client_name, product_name, top_k}` |
| POST | `/project/generate` | Multipart form: file + metadata → extract + index + generate in one call |
| POST | `/api/generate` | Generic: `{query, generation_type, category, top_k, project_context...}` |

Valid categories: `CdC`, `Exigences`, `Guide`, `AFD` (also accepts lowercase aliases).
Valid generation types: `exigences`, `afd`, `planning`, `generic`.

---

## Environment Variables (`.env`)

```env
LLM_PROVIDER=gemini             # active provider (gemini or groq)
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # used only when LLM_PROVIDER=groq
GOOGLE_API_KEY=AIza...
GOOGLE_API_KEY_2=AIza...        # second Gemini key for failover
GEMINI_MODEL=gemini-2.5-flash
LLM_MAX_TOKENS=16384
LLM_TEMPERATURE=0.2
COLLECTION_NAME=documents
EMBEDDING_MODEL_NAME=paraphrase-multilingual-MiniLM-L12-v2
```

---

## Integration

**Angular** (`integration/angular/`):
- `NouveauProjetComponent` — form to upload CdC + fill project metadata
- `services/` — HTTP service calling the FastAPI backend
- `models/` — TypeScript interfaces matching JSON schema
- Route: `/projet/nouveau`

**Spring Boot** (`integration/spring-boot/`):
- Acts as proxy/gateway between Angular (port 4200) and FastAPI (port 8000)
- Runs on port 8081

**Start command:**
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Important Technical Notes

- **HuggingFace offline mode** is forced at startup (`TRANSFORMERS_OFFLINE=1`, `HF_HUB_OFFLINE=1`) — embedding and reranker models must be pre-downloaded in the venv cache.
- **Two venvs exist:** `.venv/` (newer, includes easyocr/tesseract/pymupdf) and `venv/` (older). Use `.venv/` for running.
- **Singleton pipeline:** `get_pipeline()` in `main.py` initializes `RAGPipeline` once at startup (thread-safe lock).
- **Image indexing:** PNG/JPG files are indexed by filename-based description (not OCR), to avoid noise from screenshot images.
- DOCX images > 50KB get a text description `[Capture ecran Smart Factory: {name}]` embedded in the chunk.
- ChromaDB collection uses `hnsw:space = cosine`.
