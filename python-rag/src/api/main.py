"""
API FastAPI — MOMsoft RAG Backend
===================================
Endpoints :
  POST /upload/{category}      → upload fichier + indexation ChromaDB
  POST /generate/exigences     → génère exigences depuis CdC
  POST /api/generate           → génération générique (AFD, exigences, planning)
  GET  /health                 → statut serveur + nb docs ChromaDB
"""
from __future__ import annotations

import os
import sys
import shutil
import tempfile
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

# Mode hors-ligne HuggingFace — AVANT tout import de sentence_transformers
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("HF_DATASETS_OFFLINE", "1")

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    query: str
    generation_type: str = "exigences"
    category: Optional[str] = "CdC"
    top_k: int = 8
    project_name: Optional[str] = None
    project_id: Optional[str] = None
    client: Optional[str] = None
    language: str = "Français"
    product_context: Optional[str] = None


class GenerateExigencesRequest(BaseModel):
    cdc_text: str
    project_name: str = ""
    client_name: str = ""
    product_name: str = "Smart Factory MOMsoft"
    top_k: int = 8


class TestGenerationRequest(BaseModel):
    afd_titre: str
    exigence_description: str = ""
    champs: str = ""
    regles: str = ""
    gaps: str = ""
    top_k: int = 4


# ── Singleton pipeline ────────────────────────────────────────────────────────
_pipeline = None
_pipeline_lock = threading.Lock()


def get_pipeline():
    """Retourne (ou crée) le pipeline RAG singleton."""
    global _pipeline
    with _pipeline_lock:
        if _pipeline is None:
            from src.generation.rag_pipeline import RAGPipeline
            print("[API] Initialisation pipeline 'exigences'...")
            _pipeline = RAGPipeline(generation_type="exigences")
    return _pipeline


# ── Cycle de vie ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[API] Démarrage — chargement du pipeline...")
    try:
        get_pipeline()
        print("[API] Pipeline prêt.")
    except Exception as e:
        print(f"[API] Avertissement : impossible de pré-charger le pipeline ({e})")
    yield
    print("[API] Arrêt du serveur.")


# ── Application FastAPI ───────────────────────────────────────────────────────

app = FastAPI(
    title="MOMsoft RAG API",
    version="2.0.0",
    description="API de génération d'exigences depuis documents industriels.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Vérifie que le serveur est opérationnel + nb docs ChromaDB."""
    nb_docs = 0
    try:
        import chromadb
        client = chromadb.PersistentClient(path="./vector_db")
        collection = client.get_collection(name="documents")
        nb_docs = collection.count()
    except Exception:
        pass

    llm_provider = os.getenv("LLM_PROVIDER", "gemini")
    return {
        "status": "ok",
        "service": "momsoft-rag",
        "chromadb_docs": nb_docs,
        "llm_provider": llm_provider,
    }


@app.post("/upload/{category}")
async def upload_document(
    category: str,
    file: UploadFile = File(...),
):
    """Upload un fichier et l'indexe dans ChromaDB.

    Args:
        category: CdC | Exigences | Guide | AFD
        file:     Fichier uploadé (multipart)

    Returns:
        {success, filename, category, chunks_added}
    """
    valid_categories = {"CdC", "Exigences", "Guide", "AFD"}
    # Normalisation
    _category_map = {
        "cdc": "CdC", "project": "CdC",
        "exigences": "Exigences", "exigence": "Exigences",
        "afd": "AFD", "guide": "Guide",
    }
    normalized = _category_map.get(category.lower(), category)
    if normalized not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Catégorie invalide. Acceptées: {valid_categories}")

    allowed_ext = {".pdf", ".docx", ".xlsx", ".csv", ".txt", ".html", ".png", ".jpg", ".jpeg"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Extension non supportée: {ext}")

    # Sauvegarder le fichier dans src/document/{category}/
    dest_dir = Path("src/document") / normalized
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / file.filename

    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    # Indexer dans ChromaDB
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent.parent))
        from scripts.ingestion import indexer_document
        chunks_added = indexer_document(str(dest_path), normalized)
    except Exception as e:
        return {
            "success": False,
            "filename": file.filename,
            "category": normalized,
            "error": str(e),
            "chunks_added": 0,
        }

    return {
        "success": True,
        "filename": file.filename,
        "category": normalized,
        "size_bytes": len(content),
        "chunks_added": chunks_added,
    }


@app.post("/generate/exigences")
def generate_exigences(request: GenerateExigencesRequest):
    """Génère les exigences depuis un CdC brut.

    Body JSON:
    {
        "cdc_text": "...",
        "project_name": "Digitalisation Usine",
        "client_name": "CEVITAL",
        "product_name": "Smart Factory MOMsoft",
        "top_k": 8
    }
    """
    if not request.cdc_text or len(request.cdc_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="cdc_text trop court (min 50 caractères)")

    try:
        pipeline = get_pipeline()
        result = pipeline.generate_exigences(
            cdc_text=request.cdc_text,
            project_name=request.project_name,
            client_name=request.client_name,
            product_name=request.product_name,
            top_k=request.top_k,
        )
        resp = result["response"]
        return {
            "success": resp["success"] and resp["parsed_json"] is not None,
            "generation_type": "exigences",
            "parsed_json": resp["parsed_json"],
            "raw_text": resp["raw_text"] if not resp["parsed_json"] else None,
            "provider": resp["provider"],
            "pipeline_metadata": result["pipeline_metadata"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/project/generate")
async def project_generate(
    file: UploadFile = File(...),
    project_name: str = Form(""),
    project_id: str = Form(""),
    client_name: str = Form(""),
    product_name: str = Form("Smart Factory MOMsoft"),
    language: str = Form("Français"),
    top_k: int = Form(8),
):
    """Upload CdC + extraction texte + indexation + génération exigences en un seul appel.

    Multipart form:
      file:          fichier CdC (PDF, DOCX, TXT)
      project_name:  nom du projet
      project_id:    identifiant projet
      client_name:   nom du client
      product_name:  produit MOMsoft
      language:      langue de génération
      top_k:         nb docs pour la recherche RAG

    Returns:
      {success, filename, chunks_added, exigences: {...}, extracted_text_length}
    """
    allowed_ext = {".pdf", ".docx", ".txt"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Extension non supportée: {ext}. Acceptées: {allowed_ext}")

    # Vérifier taille (10 Mo max)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 Mo)")

    # Sauvegarder dans src/document/CdC/
    dest_dir = Path("src/document/CdC")
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / file.filename
    with open(dest_path, "wb") as f:
        f.write(content)

    # Extraire le texte brut
    try:
        from scripts.ingestion import lire_document, nettoyer_texte, indexer_document
        texte_brut, extraction_method, _ = lire_document(str(dest_path))
        texte_propre = nettoyer_texte(texte_brut) if texte_brut else ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur extraction texte: {e}")

    if not texte_propre or len(texte_propre.strip()) < 50:
        raise HTTPException(status_code=400, detail="Texte extrait trop court ou vide")

    # Indexer dans ChromaDB (background-safe)
    chunks_added = 0
    try:
        chunks_added = indexer_document(str(dest_path), "CdC")
    except Exception as e:
        print(f"[API] Warning indexation: {e}")

    # Générer les exigences
    try:
        pipeline = get_pipeline()
        result = pipeline.generate_exigences(
            cdc_text=texte_propre,
            project_name=project_name,
            client_name=client_name,
            product_name=product_name,
            top_k=top_k,
        )
        resp = result["response"]
        success = resp["success"] and resp["parsed_json"] is not None
        error_msg = resp.get("error")
        if not success and not error_msg:
            if not resp["success"]:
                error_msg = "Le modèle IA n'a pas pu générer de réponse."
            else:
                preview = (resp.get("raw_text") or "")[:200]
                error_msg = f"JSON introuvable dans la réponse du modèle. Aperçu: {preview}"
        return {
            "success": success,
            "filename": file.filename,
            "chunks_added": chunks_added,
            "extracted_text_length": len(texte_propre),
            "extracted_text": texte_propre,
            "exigences": resp["parsed_json"],
            "raw_text": resp.get("raw_text") if not resp["parsed_json"] else None,
            "provider": resp["provider"],
            "error": error_msg,
            "pipeline_metadata": result["pipeline_metadata"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération: {e}")


@app.post("/api/generate")
def generate(request: GenerateRequest):
    """Génération générique (AFD, exigences, planning)."""
    valid_types = {"exigences", "afd", "planning", "generic"}
    if request.generation_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"generation_type invalide. Valeurs acceptées: {valid_types}"
        )
    try:
        from src.generation.rag_pipeline import RAGPipeline
        pipeline = RAGPipeline(generation_type=request.generation_type)
        project_context = {
            k: v for k, v in {
                "project_name": request.project_name,
                "project_id": request.project_id,
                "client": request.client,
                "language": request.language,
                "product_context": request.product_context,
            }.items() if v
        }
        result = pipeline.run(
            query=request.query,
            category=request.category,
            top_k=request.top_k,
            project_context=project_context,
        )
        resp = result["response"]
        return {
            "success": resp["success"],
            "generation_type": request.generation_type,
            "parsed_json": resp["parsed_json"],
            "raw_text": resp["raw_text"] if not resp["success"] else None,
            "provider": resp["provider"],
            "pipeline_metadata": result["pipeline_metadata"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── LLM-as-a-Judge : client Groq séparé ──────────────────────────────────────

_JUDGE_GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
_JUDGE_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

def _get_judge_client():
    if not _JUDGE_GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY non configurée — judge indisponible.")
    try:
        from groq import Groq
        return Groq(api_key=_JUDGE_GROQ_API_KEY)
    except ImportError:
        raise HTTPException(status_code=503, detail="Package 'groq' non installé. Lance: pip install groq>=0.9.0")


class EvaluationRequest(BaseModel):
    cdc_text: str
    guide_chunks: str
    requirements: str


_JUDGE_SYSTEM_PROMPT = """Tu es un évaluateur expert en spécification fonctionnelle industrielle.
Tu travailles pour MOMsoft. Ton rôle est d'évaluer la qualité d'une liste d'exigences générées
par un système RAG à partir d'un Cahier des Charges client et d'un Guide Smart Factory.

Évalue selon ces critères (score 0-10 chacun) :
- faithfulness        : les exigences sont fidèles au CdC (pas d'hallucinations)
- answer_relevance    : les exigences répondent bien aux besoins exprimés dans le CdC
- context_precision   : le Guide Smart Factory est bien utilisé pour les solutions proposées
- solution_relevance  : les solutions MOMsoft proposées sont pertinentes et réalistes
- completeness        : toutes les exigences importantes du CdC sont couvertes

Retourne UNIQUEMENT ce JSON, sans texte avant ni après, sans bloc <think> :
{
  "faithfulness": 0,
  "answer_relevance": 0,
  "context_precision": 0,
  "solution_relevance": 0,
  "completeness": 0,
  "overall_score": 0,
  "issues": [],
  "strengths": [],
  "recommendation": ""
}

overall_score = moyenne arrondie des 5 critères.
issues = liste de problèmes détectés (strings).
strengths = liste de points forts (strings).
recommendation = conseil d'amélioration en 1-2 phrases."""


def _parse_judge_json(raw: str):
    """Strip <think> blocks and markdown fences, then parse JSON."""
    import re, json

    # Remove <think>...</think>
    text = re.sub(r"<think>[\s\S]*?</think>", "", raw).strip()
    # Handle unclosed <think>
    if "<think>" in text:
        idx = text.rfind("</think>")
        text = text[idx + 8:].strip() if idx != -1 else ""

    # Markdown fence
    fence = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except (json.JSONDecodeError, ValueError):
            pass

    # Brace extraction
    start = text.find("{")
    if start != -1:
        depth, end = 0, -1
        for i, ch in enumerate(text[start:], start):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end != -1:
            try:
                return json.loads(text[start:end])
            except (json.JSONDecodeError, ValueError):
                pass

    # Direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        return None


@app.post("/evaluate/exigences")
def evaluate_exigences(request: EvaluationRequest):
    """Évalue la qualité des exigences générées via LLM-as-a-Judge (Groq qwen-qwq-32b).

    Body JSON:
    {
        "cdc_text":      "Texte brut du cahier des charges",
        "guide_chunks":  "Extraits pertinents du Guide Smart Factory",
        "requirements":  "JSON ou texte des exigences à évaluer"
    }

    Returns:
        Scores RAGAS-like + issues + strengths + recommendation
    """
    client = _get_judge_client()

    user_message = (
        f"=== CAHIER DES CHARGES CLIENT ===\n{request.cdc_text}\n\n"
        f"=== GUIDE SMART FACTORY (extraits) ===\n{request.guide_chunks}\n\n"
        f"=== EXIGENCES GÉNÉRÉES (à évaluer) ===\n{request.requirements}\n\n"
        "Évalue ces exigences selon les critères demandés et retourne le JSON d'évaluation."
    )

    try:
        completion = client.chat.completions.create(
            model=_JUDGE_MODEL,
            messages=[
                {"role": "system", "content": _JUDGE_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            max_tokens=2048,
            temperature=0.1,
        )
        raw_text = completion.choices[0].message.content or ""
        parsed = _parse_judge_json(raw_text)

        if parsed is None:
            return {
                "success": False,
                "model": _JUDGE_MODEL,
                "error": "JSON d'évaluation introuvable dans la réponse du juge.",
                "raw_text": raw_text[:500],
            }

        return {
            "success": True,
            "model": _JUDGE_MODEL,
            "scores": parsed,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur judge: {e}")
@app.post("/generate/tests")
async def generate_tests(request: TestGenerationRequest):
    """Génère des scénarios de test fonctionnels depuis une AFD.

    Body JSON:
    {
        "afd_titre": "AFD-003 - Gestion des machines",
        "exigence_description": "Le système doit permettre de gérer les machines",
        "champs": "Nom, Type, Site, Statut",
        "regles": "Nom unique, Statut actif par défaut",
        "gaps": "Import CSV non couvert",
        "top_k": 4
    }

    Returns:
        {success, scenarios: [...], raw}
    """
    if not request.afd_titre or len(request.afd_titre.strip()) < 3:
        raise HTTPException(status_code=400, detail="afd_titre trop court (min 3 caractères)")

    try:
        pipeline = get_pipeline()

        # Rechercher des exemples AFD similaires dans la KB
        exemples = pipeline.retriever.search(
            query_text = f"cas de test {request.afd_titre}",
            top_k      = request.top_k,
            category   = "AFD",
        )

        from src.generation.prompt_builder import PromptBuilder
        pb = PromptBuilder(generation_type="testing")
        prompt = pb.build_testing(
            afd_titre            = request.afd_titre,
            afd_docs             = exemples,
            exigence_description = request.exigence_description,
            champs               = request.champs,
            regles               = request.regles,
            gaps                 = request.gaps,
        )

        result = pipeline.llm.generate(prompt)

        return {
            "success":   result["success"],
            "scenarios": result["parsed_json"].get("scenarios", []) if result["parsed_json"] else [],
            "raw":       result["raw_text"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ── Point d'entrée direct ─────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)