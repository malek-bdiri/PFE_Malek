"""
PHASE 2 — PIPELINE RAG COMPLET
================================
Orchestrateur qui enchaîne :
  Retriever → Reranker → PromptBuilder → LLM → Réponse formatée

C'est le point d'entrée principal pour la génération AI.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


class RAGPipeline:
    """
    Pipeline RAG complet pour MOMsoft.

    Chaîne : Retriever → Reranker → PromptBuilder → LLM → Réponse

    Usage :
        pipeline = RAGPipeline(generation_type="exigences")
        result = pipeline.run(
            query="Extrais toutes les exigences du cahier des charges",
            category="CdC",
            project_context={
                "project_name": "Module CRM",
                "project_id": "PRJ-2024-001",
                "client": "APEM",
                "language": "Français",
                "product_context": "MOMsoft Smart Factory",
            }
        )
    """

    def __init__(self, generation_type: str = "exigences"):
        from src.retrieval.retriever import Retriever
        from src.retrieval.reranker import Reranker
        from src.generation.prompt_builder import PromptBuilder
        from src.generation.llm import LLMConnector

        print("\n[RAG Pipeline] Initialisation...")
        self.retriever = Retriever()
        self.reranker = Reranker()
        self.prompt_builder = PromptBuilder(generation_type=generation_type)
        self.llm = LLMConnector()
        self.generation_type = generation_type
        print(f"[RAG Pipeline] Prêt — type: {generation_type}\n")

    def run(
        self,
        query: str,
        category: str = None,
        conversation_history: list = None,
        top_k: int = 8,
        project_context: dict = None,
    ) -> dict:
        """
        Exécute le pipeline complet.

        Args:
            query:                Demande utilisateur.
            category:             Filtre catégorie ('Exigences', 'CdC', 'AFD', 'Guide').
            conversation_history: Historique de la conversation.
            top_k:                Nombre de documents à retourner après reranking.
            project_context:      Métadonnées projet (project_name, project_id, client,
                                  language, product_context).

        Returns:
            Dict complet avec réponse LLM + métadonnées de pipeline.
        """
        start_time = datetime.now()
        conversation_history = conversation_history or []
        project_context = project_context or {}

        print("-" * 55)
        # Etape 1 : Retriever
        fetch_k = top_k * 2
        print(f"[1/4] RETRIEVER - recherche (fetch_k={fetch_k})")
        candidates = self.retriever.search(query, top_k=fetch_k, category=category)
        print(f"      -> {len(candidates)} candidats trouves")
        for i, d in enumerate(candidates[:3], 1):
            print(f"         [{i}] {d['score']}% - {d['source'][:50]}")

        # Etape 2 : Reranker
        print(f"[2/4] RERANKER - reclassement cross-encoder (top_k={top_k})")
        documents = self.reranker.rerank(query, candidates, top_k=top_k)
        print(f"      -> {len(documents)} documents retenus apres reranking")
        for i, d in enumerate(documents, 1):
            r_score = d.get("rerank_score", d.get("score", "?"))
            print(f"         [{i}] rerank={r_score}% - {d['source'][:50]}")

        # ── Retrieval secondaire Guide (pour exigences uniquement) ────────
        guide_documents = []
        if self.generation_type == "exigences":
            print(f"      -> Recherche complementaire Guide Smart Factory...")
            guide_candidates = self.retriever.search(query, top_k=10, category="Guide")
            guide_documents = self.reranker.rerank(query, guide_candidates, top_k=5)
            print(f"      -> {len(guide_documents)} docs Guide retenus")

        # Etape 3 : Prompt Builder
        print(f"[3/4] PROMPT BUILDER - assemblage du contexte")
        prompt = self.prompt_builder.build(
            query=query,
            documents=documents,
            conversation_history=conversation_history,
            guide_documents=guide_documents,
            project_context=project_context,
        )
        dbg = prompt["debug_info"]
        print(f"      -> {dbg['nb_documents_in_context']} docs | {dbg['context_chars']} chars contexte")

        # Etape 4 : LLM
        print(f"[4/4] LLM - generation ({self.llm._provider})")
        llm_result = self.llm.generate(prompt)
        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"      -> Succes: {llm_result['success']} | Duree: {elapsed:.1f}s")
        print("-" * 55)

        return {
            "query": query,
            "generation_type": self.generation_type,
            "category_filter": category,
            "project_context": project_context,
            "response": {
                "raw_text": llm_result["raw_text"],
                "parsed_json": llm_result["parsed_json"],
                "success": llm_result["success"],
                "provider": llm_result["provider"],
                "model": llm_result["model"],
            },
            "pipeline_metadata": {
                "retriever_candidates": len(candidates),
                "reranker_selected": len(documents),
                "context_chars": dbg["context_chars"],
                "elapsed_seconds": round(elapsed, 2),
                "timestamp": start_time.isoformat(),
            },
            "documents_used": documents,
        }

    def generate_exigences(
        self,
        cdc_text: str,
        project_name: str = "",
        client_name: str = "",
        product_name: str = "Smart Factory MOMsoft",
        top_k: int = 8,
    ) -> dict:
        """Pipeline dédié à la génération d'exigences depuis un CdC brut.

        1. Recherche triple (CdC, Exigences, Guide) via search_for_exigences
        2. Rerank les résultats
        3. Construit le prompt 3 sections (exemples + guide + CdC brut)
        4. Appelle le LLM
        5. Retourne les exigences parsées

        Args:
            cdc_text:     Texte brut du cahier des charges (passé directement)
            project_name: Nom du projet
            client_name:  Nom du client
            product_name: Nom du produit (default: Smart Factory MOMsoft)
            top_k:        Nombre de chunks à récupérer par catégorie

        Returns:
            Dict avec response, pipeline_metadata, documents_used
        """
        start_time = datetime.now()

        # Résumé du CdC pour la requête de recherche
        query = f"exigences fonctionnelles projet {project_name} {client_name} digitalisation usine".strip()

        print("-" * 55)
        print(f"[EXIGENCES] Generation pour: {project_name or 'projet'}")

        # Etape 1 : Triple recherche
        print(f"[1/4] RETRIEVER - triple search (CdC + Exigences + Guide)")
        docs_cdc_exig, docs_guide = self.retriever.search_for_exigences(query, top_k=max(top_k, 20))
        print(f"      -> {len(docs_cdc_exig)} docs CdC+Exigences, {len(docs_guide)} docs Guide")

        # Etape 2 : Rerank
        print(f"[2/4] RERANKER")
        docs_cdc_exig = self.reranker.rerank(query, docs_cdc_exig, top_k=top_k)
        docs_guide = self.reranker.rerank(query, docs_guide, top_k=5)
        print(f"      -> {len(docs_cdc_exig)} exemples, {len(docs_guide)} guide")

        # Etape 3 : Prompt 3 sections
        print(f"[3/4] PROMPT BUILDER - 3 sections (exemples + guide + CdC brut)")
        from src.generation.prompt_builder import PromptBuilder
        builder = PromptBuilder(generation_type="exigences")
        prompt = builder.build_exigences(
            cdc_text=cdc_text,
            docs_cdc_exig=docs_cdc_exig,
            docs_guide=docs_guide,
            project_name=project_name,
            client_name=client_name,
            product_name=product_name,
        )
        dbg = prompt["debug_info"]
        print(f"      -> CdC: {dbg['cdc_text_chars']} chars | Exemples: {dbg['exemples_chars']} | Guide: {dbg['guide_chars']}")

        # Etape 4 : LLM
        print(f"[4/4] LLM - generation ({self.llm._provider})")
        llm_result = self.llm.generate(prompt)
        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"      -> Succes: {llm_result['success']} | Duree: {elapsed:.1f}s")
        print("-" * 55)

        return {
            "query": query,
            "generation_type": "exigences",
            "response": {
                "raw_text": llm_result["raw_text"],
                "parsed_json": llm_result["parsed_json"],
                "success": llm_result["success"],
                "provider": llm_result["provider"],
                "model": llm_result["model"],
            },
            "pipeline_metadata": {
                "cdc_text_chars": len(cdc_text),
                "exemples_count": len(docs_cdc_exig),
                "guide_count": len(docs_guide),
                "elapsed_seconds": round(elapsed, 2),
                "timestamp": start_time.isoformat(),
            },
            "documents_used": docs_cdc_exig + docs_guide,
        }


# ---------------------------------------------------------------------------
# Tests — à lancer avec : python src/generation/rag_pipeline.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  TEST 2.5 — RAG PIPELINE COMPLET")
    print("=" * 60)

    all_pass = True

    # ── Test 1 : Génération AFD ────────────────────────────────────────────
    print("\n[Test 1] Génération AFD depuis exigences APEM")
    pipeline_afd = RAGPipeline(generation_type="afd")
    result_afd = pipeline_afd.run(
        query="Génère les Analyses Fonctionnelles Détaillées pour le projet de digitalisation du processus qualité",
        category="Exigences",
        top_k=8,
    )

    t1_pass = result_afd["response"]["success"]
    t1_docs = result_afd["pipeline_metadata"]["retriever_selected"] > 0
    all_pass = all_pass and t1_pass and t1_docs
    print(f"  Réponse LLM   : {'✓' if t1_pass else '✗'}")
    print(f"  Docs trouvés  : {'✓' if t1_docs else '✗'}")
    print(f"  Provider      : {result_afd['response']['provider']}")
    if result_afd["response"]["parsed_json"]:
        nb = len(result_afd["response"]["parsed_json"].get("afds", []))
        print(f"  AFDs générées : {nb}")

    # ── Test 2 : Extraction exigences ─────────────────────────────────────
    print("\n[Test 2] Extraction liste d'exigences depuis CdC")
    pipeline_ex = RAGPipeline(generation_type="exigences")
    result_ex = pipeline_ex.run(
        query="Extrais toutes les exigences fonctionnelles du cahier des charges",
        category="CdC",
        top_k=8,
    )
    t2_pass = result_ex["response"]["success"]
    all_pass = all_pass and t2_pass
    print(f"  Réponse LLM  : {'✓' if t2_pass else '✗'}")
    print(f"  Elapsed      : {result_ex['pipeline_metadata']['elapsed_seconds']}s")
    if result_ex["response"]["parsed_json"]:
        nb = len(result_ex["response"]["parsed_json"].get("exigences", []))
        print(f"  Exigences extraites : {nb}")

    # ── Sauvegarde JSON ────────────────────────────────────────────────────
    out_path = "./scripts/test_2_5_rag_pipeline_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(
            {
                "status": "PASS" if all_pass else "FAIL",
                "test_afd": {
                    "success": result_afd["response"]["success"],
                    "provider": result_afd["response"]["provider"],
                    "metadata": result_afd["pipeline_metadata"],
                    "nb_afds": len((result_afd["response"]["parsed_json"] or {}).get("afds", [])),
                    "parsed_json": result_afd["response"]["parsed_json"],
                },
                "test_exigences": {
                    "success": result_ex["response"]["success"],
                    "provider": result_ex["response"]["provider"],
                    "metadata": result_ex["pipeline_metadata"],
                    "nb_exigences": len((result_ex["response"]["parsed_json"] or {}).get("exigences", [])),
                    "parsed_json": result_ex["response"]["parsed_json"],
                    "raw_text_preview": (result_ex["response"]["raw_text"] or "")[:500],
                },
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\n{'✓ PIPELINE COMPLET — TOUS TESTS PASSED' if all_pass else '✗ CERTAINS TESTS ONT ÉCHOUÉ'}")
    print(f"Résultats sauvegardés : {out_path}")
