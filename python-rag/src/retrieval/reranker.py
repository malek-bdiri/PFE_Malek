"""
PHASE 2 — ÉTAPE 2.2 : RERANKER
================================
Rôle : Prendre les N documents retournés par le Retriever (basé sur la similarité
       vectorielle) et les RE-CLASSER selon leur pertinence sémantique réelle
       par rapport à la requête.

Pourquoi un Reranker ?
  Le retriever fait une comparaison vecteur → vecteur (rapide mais approximative).
  Le reranker compare directement le texte de la requête et chaque document
  (en les concaténant dans un modèle cross-encoder) → bien plus précis mais plus lent.
  C'est le "filtre fin" après le "filtre grossier" du retriever.

Modèle utilisé :
  cross-encoder/ms-marco-MiniLM-L-6-v2  — modèle léger multilingue
  → retourne un score de pertinence [-inf, +inf], converti en [0-100]

Fallback :
  Si sentence-transformers n'est pas installé ou le modèle n'est pas disponible,
  on retourne les documents tels quels (les scores retriever sont conservés).
"""

from __future__ import annotations


RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"
DEFAULT_TOP_K = 5


class Reranker:
    def __init__(self):
        """
        Charge le modèle cross-encoder pour le reranking.
        Si le modèle n'est pas disponible, active le mode passthrough.
        """
        self.model = None
        self._mode = "passthrough"

        try:
            from sentence_transformers import CrossEncoder

            self.model = CrossEncoder(RERANKER_MODEL_NAME)
            self._mode = "cross-encoder"
            print(f"Reranker cross-encoder chargé : {RERANKER_MODEL_NAME}")
        except Exception as e:
            print(
                f"Reranker cross-encoder indisponible (mode passthrough). Raison : {e}"
            )

    def rerank(self, query: str, documents: list, top_k: int = DEFAULT_TOP_K) -> list:
        """
        Reclasse les documents selon leur pertinence sémantique avec la requête.

        Args:
            query:     La requête utilisateur (ex: "génère AFD pour gestion qualité").
            documents: Liste de dicts issus du Retriever
                       (chaque dict a au moins les clés 'text' et 'score').
            top_k:     Nombre de documents à retourner après reranking.

        Returns:
            Liste de dicts triés par pertinence décroissante, avec 'rerank_score' ajouté.
        """
        if not documents:
            return []

        if self._mode == "passthrough" or self.model is None:
            # Fallback : on conserve l'ordre du retriever, on ajoute rerank_score = score
            ranked = []
            for doc in documents[:top_k]:
                ranked.append({**doc, "rerank_score": doc.get("score", 0.0)})
            return ranked

        # ── Cross-encoder scoring ──────────────────────────────────────────
        # Le modèle prend des paires (requête, texte_doc) et retourne un score
        pairs = [(query, doc["text"]) for doc in documents]
        raw_scores = self.model.predict(pairs)  # numpy array de float

        # Normalisation sigmoid : [−∞, +∞] → [0, 100]
        import math

        def sigmoid_to_pct(x: float) -> float:
            return round(100.0 / (1.0 + math.exp(-x)), 1)

        scored_docs = []
        for doc, raw_score in zip(documents, raw_scores):
            scored_docs.append(
                {
                    **doc,
                    "rerank_score": sigmoid_to_pct(float(raw_score)),
                    "retriever_score": doc.get("score", 0.0),
                }
            )

        # Trier par rerank_score décroissant et garder top_k
        scored_docs.sort(key=lambda x: x["rerank_score"], reverse=True)
        return scored_docs[:top_k]


# ---------------------------------------------------------------------------
# Tests — à lancer avec : python src/retrieval/reranker.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json
    import sys
    import os

    # Permettre l'import du Retriever depuis ce script
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
    from src.retrieval.retriever import Retriever

    print("\n" + "=" * 60)
    print("  TEST 2.2 — RERANKER")
    print("=" * 60)

    try:
        retriever = Retriever()
        reranker = Reranker()
        all_pass = True

        query = "exigences pour la digitalisation du processus qualité"

        # Étape 1 : Retriever récupère 10 candidats
        print(f"\nRequête : '{query}'")
        print("\n[Étape 1] Retriever — top 10 candidats")
        candidates = retriever.search(query, top_k=10)
        print(f"  {len(candidates)} documents récupérés")
        for i, d in enumerate(candidates[:3], 1):
            print(f"  [{i}] retriever_score={d['score']}% | {d['source'][:60]}")

        # Étape 2 : Reranker reclasse et garde top 5
        print("\n[Étape 2] Reranker — top 5 après reclassement")
        reranked = reranker.rerank(query, candidates, top_k=5)
        print(f"  {len(reranked)} documents après reranking")
        for i, d in enumerate(reranked, 1):
            r_score = d.get("retriever_score", d.get("score", "?"))
            print(
                f"  [{i}] rerank_score={d['rerank_score']}%"
                f" | retriever_score={r_score}%"
                f" | {d['source'][:55]}"
            )

        # Validation : l'ordre peut changer entre retriever et reranker
        t1_pass = len(reranked) > 0
        t2_pass = all(0 <= d["rerank_score"] <= 100 for d in reranked)
        all_pass = t1_pass and t2_pass

        print(f"\n  Résultats non vides : {'✓' if t1_pass else '✗'}")
        print(f"  Scores dans [0-100] : {'✓' if t2_pass else '✗'}")

        # Sauvegarde JSON
        out_path = "./scripts/test_2_2_reranker_results.json"
        output = {
            "status": "PASS" if all_pass else "FAIL",
            "query": query,
            "retriever_count": len(candidates),
            "reranked_docs": reranked,
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"\n{'✓ TOUS LES TESTS PASSED' if all_pass else '✗ ÉCHEC'}")
        print(f"Résultats sauvegardés : {out_path}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erreur : {e}")
