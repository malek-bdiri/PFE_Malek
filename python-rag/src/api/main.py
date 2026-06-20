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
from typing import Optional, Union, Any

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
    project_id: Optional[Union[str, int]] = None
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
    """Corps de requête pour générer des cas de test depuis une AFD."""
    afd_titre: str
    exigence_description: str = ""
    champs: str = ""
    regles: str = ""
    gaps: str = ""
    top_k: int = 4


class AfdFromExigencesRequest(BaseModel):
    """Corps de requête pour générer des AFDs depuis une liste d'exigences."""
    exigences: list
    project_name: str = ""
    project_id: Optional[Union[str, int]] = None
    code_projet: Optional[str] = None
    client_name: str = ""
    validateur: Optional[str] = None
    product_name: str = "Smart Factory MOMsoft"
    top_k: int = 4


class EvaluateExigencesRequest(BaseModel):
    """Corps de requête pour l'évaluation LLM-as-Judge des exigences."""
    cdc_text: str
    exigences: list
    project_name: str = ""


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


@app.post("/api/project/generate")
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
    try:
        dest_dir = Path("src/document/CdC")
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / file.filename
        with open(dest_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier: {e}")

    # Extraire le texte brut
    try:
        _root = Path(__file__).resolve().parent.parent.parent
        if str(_root) not in sys.path:
            sys.path.insert(0, str(_root))
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
        raw_error = resp.get("error") or ""
        if not success:
            raw_lower = raw_error.lower()
            if "quota" in raw_lower or "429" in raw_lower or "resourceexhausted" in raw_lower or "rate" in raw_lower:
                error_msg = ("Quota API Gemini dépassé (5 req/min sur le plan gratuit). "
                             "Attendez 60 secondes puis réessayez.")
            elif raw_error:
                error_msg = f"Erreur LLM : {raw_error[:300]}"
            elif not resp["success"]:
                error_msg = "Le modèle IA n'a pas pu générer de réponse."
            else:
                preview = (resp.get("raw_text") or "")[:200]
                error_msg = f"JSON introuvable dans la réponse du modèle. Aperçu : {preview}"
        else:
            error_msg = None
        return {
            "success": success,
            "filename": file.filename,
            "chunks_added": chunks_added,
            "extracted_text_length": len(texte_propre),
            "cdc_text_preview": texte_propre[:5000],  # pour /api/evaluate/exigences côté Angular
            "exigences": resp["parsed_json"],
            "raw_text": resp.get("raw_text") if not resp["parsed_json"] else None,
            "provider": resp["provider"],
            "error": error_msg,
            "pipeline_metadata": result["pipeline_metadata"],
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
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


# ── Nouveaux endpoints ────────────────────────────────────────────────────────

_VERIFY_SYSTEM = (
    "Tu es un expert en gestion de projet industriel et informatique. "
    "Analyse l'extrait de document fourni et détermine s'il s'agit d'un "
    "Cahier des Charges (CDC).\n\n"
    "Un CDC décrit les BESOINS et EXIGENCES d'un projet informatique ou industriel : "
    "ce que le système doit faire, le périmètre fonctionnel, les contraintes, les livrables. "
    "Un CDC peut être pour un usage interne (sans forcément mentionner 'appel d'offre' ou 'prestataire'). "
    "Un CDC peut avoir une table des matières, une introduction, un résumé — cela ne le disqualifie pas.\n\n"
    "NE SONT PAS des CDC : rapport de stage, mémoire universitaire, thèse, rapport de PFE, "
    "rapport d'activité post-projet, compte-rendu de réunion, CV, facture, article scientifique, "
    "manuel utilisateur d'un logiciel existant, rapport d'audit, bilan.\n\n"
    "La différence clé : un CDC décrit ce qu'un système DOIT FAIRE (futur, besoins à satisfaire). "
    "Un rapport décrit ce qui A ÉTÉ FAIT (passé, résultats obtenus).\n\n"
    "Retourne UNIQUEMENT ce JSON, sans texte avant ni après :\n"
    '{"document_type":"CDC|CV|RAPPORT|FACTURE|CONTRAT|AUTRE",'
    '"is_cdc":true|false,"confidence":0-100,"reason":"explication courte en français (1 phrase)"}'
)


@app.post("/api/verify/document")
async def verify_document(file: UploadFile = File(...)):
    """Vérifie si le document uploadé est un Cahier des Charges en lisant son contenu.

    Returns:
        {is_valid, document_type, confidence, message}
    """
    allowed_ext = {".pdf", ".docx", ".txt"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        return {
            "is_valid": False,
            "document_type": "Format non supporté",
            "confidence": 100,
            "message": f"Extension {ext} non supportée. Acceptées : PDF, DOCX, TXT",
        }

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        return {
            "is_valid": False,
            "document_type": "Fichier trop volumineux",
            "confidence": 100,
            "message": "Fichier trop volumineux (max 10 Mo)",
        }

    # Sauvegarder dans un fichier temporaire pour l'extraction texte
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        _root = Path(__file__).resolve().parent.parent.parent
        if str(_root) not in sys.path:
            sys.path.insert(0, str(_root))
        from scripts.ingestion import lire_document, nettoyer_texte
        texte_brut, _, _ = lire_document(tmp_path)
        texte = nettoyer_texte(texte_brut)[:5000] if texte_brut else ""
    except Exception as e:
        return {
            "is_valid": False,
            "document_type": "Erreur extraction",
            "confidence": 0,
            "message": f"Impossible d'extraire le texte : {e}",
        }
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if not texte or len(texte.strip()) < 30:
        return {
            "is_valid": False,
            "document_type": "Document vide",
            "confidence": 90,
            "message": "Le document semble vide ou illisible.",
        }

    # Étape 1 — pré-filtrage mots-clés évidents (pas de LLM pour CV / facture / rapport)
    texte_low = texte.lower()
    kw_cv = ["curriculum vitae", "expériences professionnelles", "né le", "poste recherché", "nationalité"]
    kw_facture = ["facture n°", "numéro de facture", "montant ttc", "montant ht", "bulletin de salaire"]
    # Marqueurs vraiment spécifiques aux rapports académiques/de stage (absents des CdC)
    kw_rapport = [
        "rapport de stage", "mémoire de fin d'études", "mémoire de master",
        "mémoire de licence", "rapport de pfe", "rapport de fin d'études",
        "encadrant pédagogique", "encadrant professionnel", "tuteur de stage",
        "soutenu par", "présenté devant le jury", "année universitaire",
        "stage de fin d'études", "stage effectué", "promotion 20",
    ]
    if sum(1 for k in kw_cv if k in texte_low) >= 2:
        return {"is_valid": False, "document_type": "CV", "confidence": 92,
                "message": "Ce document est un CV, pas un Cahier des Charges."}
    if sum(1 for k in kw_facture if k in texte_low) >= 2:
        return {"is_valid": False, "document_type": "FACTURE", "confidence": 92,
                "message": "Ce document est une facture, pas un Cahier des Charges."}
    if sum(1 for k in kw_rapport if k in texte_low) >= 2:
        return {"is_valid": False, "document_type": "RAPPORT", "confidence": 92,
                "message": "Ce document est un rapport/mémoire académique, pas un Cahier des Charges."}

    # Étape 1b — "cahier des charges" dans le texte = CDC certain (phrase très spécifique)
    if "cahier des charges" in texte_low or "cahier de charges" in texte_low:
        return {
            "is_valid": True,
            "document_type": "CDC",
            "confidence": 85,
            "message": "Expression 'Cahier des Charges' détectée dans le document.",
        }

    # Étape 2 — classification LLM via Groq llama-4-scout (quota séparé de Gemini)
    try:
        from groq import Groq as _Groq
        import json as _json, re as _re
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        if groq_key:
            _gc = _Groq(api_key=groq_key)
            _verify_models = [
                "meta-llama/llama-4-scout-17b-16e-instruct",
                "llama-3.3-70b-versatile",
                "llama3-70b-8192",
            ]
            raw = ""
            for _vm in _verify_models:
                try:
                    completion = _gc.chat.completions.create(
                        model=_vm,
                        messages=[
                            {"role": "system", "content": _VERIFY_SYSTEM},
                            {"role": "user", "content": f"Document (extrait) :\n\n{texte[:4000]}"},
                        ],
                        max_tokens=128,
                        temperature=0.0,
                    )
                    raw = completion.choices[0].message.content or ""
                    break
                except Exception as _ve:
                    print(f"  [Verify] {_vm} indisponible : {_ve}")
                    continue
            fence = _re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
            candidate = fence.group(1) if fence else raw
            start = candidate.find("{")
            end = candidate.rfind("}") + 1
            parsed = _json.loads(candidate[start:end]) if start != -1 else {}
            if "is_cdc" in parsed:
                return {
                    "is_valid": bool(parsed["is_cdc"]),
                    "document_type": parsed.get("document_type", "AUTRE"),
                    "confidence": int(parsed.get("confidence", 70)),
                    "message": parsed.get("reason", ""),
                }
    except Exception:
        pass  # fallback keyword si Groq indisponible

    # Étape 3 — fallback mots-clés (si Groq indisponible)
    # "cahier des charges" / "cahier de charges" seuls suffisent : phrase ultra-spécifique
    if "cahier des charges" in texte_low or "cahier de charges" in texte_low:
        return {
            "is_valid": True,
            "document_type": "CDC",
            "confidence": 80,
            "message": "Expression 'Cahier des Charges' détectée — document reconnu comme CDC.",
        }

    # Termes courants dans les CdC industriels internes (pas forcément "appel d'offre")
    kw_cdc = [
        "exigences fonctionnelles", "exigence fonctionnelle",
        "exigences techniques", "exigence technique",
        "besoins fonctionnels", "besoin fonctionnel",
        "spécification fonctionnelle", "spécifications fonctionnelles",
        "périmètre du projet", "périmètre fonctionnel",
        "fonctions attendues", "fonctions principales",
        "conditions de réception", "recette fonctionnelle",
        "livrables", "livrable attendu",
        "prestataire", "maître d'ouvrage",
        "appel d'offre", "appel d'offres",
        "réception des livrables",
        "mode opératoire",
    ]
    score = sum(1 for k in kw_cdc if k in texte_low)
    is_cdc = score >= 2
    return {
        "is_valid": is_cdc,
        "document_type": "CDC" if is_cdc else "AUTRE",
        "confidence": min(75, max(40, score * 12)),
        "message": ("Cahier des Charges détecté (analyse hors-ligne)." if is_cdc
                    else "Ce document ne ressemble pas à un Cahier des Charges."),
    }


@app.post("/api/generate/afd")
async def generate_afd(request: AfdFromExigencesRequest):
    """Génère des AFDs depuis une liste d'exigences.

    Body JSON:
    {
        "exigences": [{id, type, intitule, description, solutionProposee, ...}],
        "project_name": "...",
        "project_id": "PRJ-001",
        "code_projet": "FA-003",
        "client_name": "...",
        "validateur": "...",
        "product_name": "Smart Factory MOMsoft",
        "top_k": 4
    }

    Returns:
        {success, afds, nb_afds, project_name, code_projet, client_name, validateur, provider, pipeline_metadata}
    """
    if not request.exigences:
        raise HTTPException(status_code=400, detail="La liste d'exigences est vide")
    if len(request.exigences) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 exigences par appel")

    try:
        pipeline = get_pipeline()
        result = pipeline.generate_afd_from_exigences(
            exigences_list=request.exigences,
            project_name=request.project_name,
            client_name=request.client_name,
            product_name=request.product_name,
            top_k=request.top_k,
        )
        resp = result["response"]
        parsed = resp["parsed_json"] or {}
        afds = parsed.get("afds", [])
        return {
            "success": resp["success"] and bool(afds),
            "afds": afds,
            "nb_afds": len(afds),
            "resume": parsed.get("resume", ""),
            # Métadonnées projet — renvoyées telles quelles pour la table AFD
            "project_name": request.project_name,
            "project_id": request.project_id,
            "code_projet": request.code_projet,
            "client_name": request.client_name,
            "validateur": request.validateur,
            "provider": resp["provider"],
            "error": resp.get("error") if not resp["success"] else None,
            "raw_text": resp.get("raw_text") if not afds else None,
            "pipeline_metadata": result["pipeline_metadata"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération AFD: {e}")


@app.post("/api/evaluate/exigences")
async def evaluate_exigences(request: EvaluateExigencesRequest):
    """Évalue la qualité des exigences générées par LLM-as-Judge (Groq llama-4-scout).

    Body JSON:
    {
        "cdc_text": "...",
        "exigences": [{id, type, intitule, description, ...}],
        "project_name": ""
    }

    Returns:
        {success, evaluation: {scores, score_global, points_forts, axes_amelioration, commentaire},
         nb_exigences, model, provider}
    """
    if not request.exigences:
        raise HTTPException(status_code=400, detail="Liste d'exigences vide")
    if not request.cdc_text or len(request.cdc_text.strip()) < 30:
        raise HTTPException(status_code=400, detail="cdc_text trop court (min 30 caractères)")

    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if not groq_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY manquante — évaluation indisponible")

    try:
        from src.generation.prompt_builder import PromptBuilder
        import json as _json, re as _re

        builder = PromptBuilder(generation_type="judge")
        prompt = builder.build_judge(
            cdc_text=request.cdc_text,
            exigences_list=request.exigences,
            project_name=request.project_name,
        )

        raw_text = ""
        used_model = "unknown"
        last_err = None

        # Essai Groq (si le package est installé)
        try:
            from groq import Groq as _Groq
            gc = _Groq(api_key=groq_key)
            judge_models = [
                "meta-llama/llama-4-scout-17b-16e-instruct",
                "llama-3.3-70b-versatile",
                "llama3-70b-8192",
            ]
            used_model = judge_models[0]
            for model_id in judge_models:
                try:
                    completion = gc.chat.completions.create(
                        model=model_id,
                        messages=[
                            {"role": "system", "content": prompt["system"]},
                            {"role": "user", "content": prompt["messages"][0]["content"]},
                        ],
                        max_tokens=1024,
                        temperature=0.0,
                    )
                    raw_text = completion.choices[0].message.content or ""
                    used_model = model_id
                    print(f"  [Judge] Modèle Groq utilisé : {model_id}")
                    break
                except Exception as model_err:
                    print(f"  [Judge] {model_id} indisponible : {model_err}")
                    last_err = model_err
                    continue
        except ImportError:
            print("  [Judge] Package 'groq' non installé — passage direct au fallback Gemini")
        if not raw_text:
            # Fallback : LLMClient (Gemini) si tous les modèles Groq sont indisponibles
            try:
                from src.generation.llm import LLMClient as _LLMClient
                _llm = _LLMClient()
                _resp = _llm.generate(prompt)
                raw_text = _resp.get("raw_text", "")
                used_model = _resp.get("model", "gemini")
                if raw_text:
                    print(f"  [Judge] Fallback LLMClient ({used_model}) : {len(raw_text)} chars")
            except Exception as _fe:
                print(f"  [Judge] Fallback LLMClient échoué : {_fe}")

        if not raw_text:
            err_detail = str(last_err) if last_err else "Aucun modèle LLM disponible"
            raise HTTPException(status_code=503, detail=f"Évaluation indisponible (Groq + Gemini hors ligne) : {err_detail}")

        # Parse JSON from LLM response
        fence = _re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw_text)
        candidate = fence.group(1) if fence else raw_text
        start = candidate.find("{")
        end = candidate.rfind("}") + 1
        try:
            evaluation = _json.loads(candidate[start:end]) if start != -1 else {}
        except _json.JSONDecodeError:
            evaluation = {}

        # Compute score_global if missing
        if "score_global" not in evaluation and "scores" in evaluation:
            vals = list(evaluation["scores"].values())
            evaluation["score_global"] = round(sum(vals) / len(vals)) if vals else 0

        evaluation.setdefault("nb_exigences_evaluees", len(request.exigences))

        # Scores aplatis pour facilité d'accès côté frontend
        flat_scores = {
            **(evaluation.get("scores") or {}),
            "score_global": evaluation.get("score_global", 0),
            "points_forts": evaluation.get("points_forts", []),
            "axes_amelioration": evaluation.get("axes_amelioration", []),
            "commentaire": evaluation.get("commentaire", ""),
            "nb_exigences_evaluees": evaluation.get("nb_exigences_evaluees", len(request.exigences)),
        }

        return {
            "success": True,
            "scores": flat_scores,
            "evaluation": evaluation,
            "nb_exigences": len(request.exigences),
            "model": used_model,
            "provider": "gemini" if "gemini" in used_model else "groq",
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur évaluation: {e}")


# ── Point d'entrée direct ─────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)