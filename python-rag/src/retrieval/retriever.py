import logging
import os
from pathlib import Path

# Charger .env
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

logging.getLogger("chromadb.telemetry").setLevel(logging.ERROR)

VECTOR_DB_PATH = "./vector_db"
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "documents").strip() or "documents"
EMBEDDING_MODEL_NAME = os.getenv(
    "EMBEDDING_MODEL_NAME", "paraphrase-multilingual-MiniLM-L12-v2"
).strip()
MIN_SCORE = 0.30


class Retriever:
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        print(f"[Retriever] Modele embedding : {EMBEDDING_MODEL_NAME}")
        import chromadb as _chromadb
        client = _chromadb.PersistentClient(path=VECTOR_DB_PATH)
        try:
            self._collection = client.get_collection(name=COLLECTION_NAME)
            print(f"[Retriever] ChromaDB : {self._collection.count()} chunks")
        except Exception as e:
            raise RuntimeError(f"Collection ChromaDB introuvable : {e}") from e

    @staticmethod
    def _cosine_score(distance: float) -> float:
        """Convertit une distance cosine ChromaDB en score [0, 1].
        ChromaDB cosine distance = 1 - cosine_similarity, donc dans [0, 2].
        score = 1.0 - (distance / 2.0)  →  1.0 = identique, 0.0 = oppose.
        """
        return round(1.0 - (distance / 2.0), 3)

    def search(self, query_text: str, top_k: int = 5, category: str = None) -> list:
        prefix = "query: " if "e5" in EMBEDDING_MODEL_NAME.lower() else ""
        query_embedding = self.model.encode([f"{prefix}{query_text}"]).tolist()
        kwargs = {"n_results": top_k, "include": ["documents", "metadatas", "distances"]}
        if category:
            kwargs["where"] = {"category": category}
            print(f"  Filtre categorie actif : '{category}'")
        raw = self._collection.query(query_embeddings=query_embedding, **kwargs)
        return self._format_results(raw)

    def search_for_exigences(self, query: str, top_k: int = 8):
        """Triple recherche pour la generation d'exigences.

        Returns:
            (docs_cdc_exig, docs_guide):
                - docs_cdc_exig: chunks CdC + Exigences (exemples passes)
                - docs_guide: chunks Guide (fonctionnalites Smart Factory)
        """
        docs_cdc = self.search(query, top_k=top_k, category="CdC")
        docs_exig = self.search(query, top_k=top_k, category="Exigences")
        docs_guide = self.search(query, top_k=5, category="Guide")

        # Fusionner CdC + Exigences, trier par score decroissant
        docs_cdc_exig = docs_cdc + docs_exig
        docs_cdc_exig.sort(key=lambda x: x["score"], reverse=True)

        return docs_cdc_exig, docs_guide

    def _format_results(self, raw: dict) -> list:
        docs = raw.get("documents", [[]])[0]
        metas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]
        results = []
        for text, meta, dist in zip(docs, metas, distances):
            score = self._cosine_score(dist)
            if score < MIN_SCORE:
                continue
            results.append({
                "text": text,
                "score": score,
                "raw_distance": round(dist, 4),
                "source": meta.get("source", "inconnu"),
                "category": meta.get("category") or meta.get("type", "inconnu"),
                "metadata": meta,
            })
        results.sort(key=lambda x: x["score"], reverse=True)
        return results


# ---------------------------------------------------------------------------
# Tests — à lancer avec : python src/retrieval/retriever.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import json

    print("\n" + "=" * 60)
    print("  TEST 2.1 - RETRIEVER")
    print("=" * 60)

    try:
        retriever = Retriever()
        all_pass = True

        # ── Test 1 : recherche simple sans filtre ──────────────────────────
        print("\n[Test 1] Recherche simple (toutes categories)")
        q1 = "Quelles sont les exigences pour la gestion des utilisateurs ?"
        r1 = retriever.search(q1, top_k=3)
        print(f"  Documents trouves: {len(r1)}")
        for i, doc in enumerate(r1, 1):
            print(f"  [{i}] Score: {doc['score']}% | Source: {doc['source']}")
        t1_pass = len(r1) > 0
        print(f"  {'[PASS]' if t1_pass else '[FAIL]'}")
        all_pass = all_pass and t1_pass

        # ── Test 2 : filtre categorie Exigences ────────────────────────────
        print("\n[Test 2] Filtre categorie 'Exigences'")
        r2 = retriever.search(q1, top_k=3, category="Exigences")
        print(f"  Documents trouves: {len(r2)}")
        t2_categories = [d["category"] for d in r2]
        t2_pass = len(r2) > 0
        print(f"  Categories: {t2_categories}")
        print(f"  {'[PASS]' if t2_pass else '[FAIL]'}")
        all_pass = all_pass and t2_pass

        # ── Test 3 : filtre categorie CdC ──────────────────────────────────
        print("\n[Test 3] Filtre categorie 'CdC'")
        r3 = retriever.search("perimetre du projet", top_k=3, category="CdC")
        print(f"  Documents trouves: {len(r3)}")
        t3_pass = len(r3) > 0
        print(f"  {'[PASS]' if t3_pass else '[FAIL]'}")
        all_pass = all_pass and t3_pass

        # ── Test 4 : top-k = 10 ────────────────────────────────────────────
        print("\n[Test 4] Top-K=10")
        r4 = retriever.search("digitalisation processus qualite", top_k=10)
        print(f"  Documents trouves: {len(r4)}")
        t4_pass = len(r4) >= 5
        print(f"  {'[PASS]' if t4_pass else '[FAIL]'}")
        all_pass = all_pass and t4_pass

        # ── Sauvegarde JSON ────────────────────────────────────────────────
        output = {
            "status": "PASS" if all_pass else "FAIL",
            "test_1_simple": {"documents": r1},
            "test_2_exigences": {"documents": r2},
            "test_3_cdc": {"documents": r3},
            "test_4_topk10": {"count": len(r4)},
        }
        out_path = "./scripts/test_2_1_retriever_results.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"\n{'TOUS LES TESTS PASSED' if all_pass else 'CERTAINS TESTS ONT ECHOUE'}")
        print(f"Resultats sauvegardes : {out_path}")

    except FileNotFoundError as e:
        print(f"Erreur: {e}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Erreur inattendue: {e}")
