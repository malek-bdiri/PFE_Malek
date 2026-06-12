"""Fix retriever.py - remove FAISS, ChromaDB only, fix query prefix."""

with open('src/retrieval/retriever.py', encoding='utf-8') as f:
    content = f.read()

# Find the start of __main__ block to preserve it
main_idx = content.find('\n# ---------------------------------------------------------------------------\n# Tests')
if main_idx == -1:
    main_idx = content.find('\n# -----------\n# Tests')
if main_idx == -1:
    main_idx = content.find("\nif __name__ == \"__main__\":")

new_class = '''import logging
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
    def _normalize_scores(distances: list) -> list:
        if not distances:
            return []
        min_d, max_d = min(distances), max(distances)
        span = max_d - min_d
        if span == 0:
            return [round(100.0 / (1.0 + min_d), 1)] * len(distances)
        return [round(10.0 + 90.0 * (1.0 - (d - min_d) / span), 1) for d in distances]

    def search(self, query_text: str, top_k: int = 5, category: str = None) -> list:
        # Prefixe 'query:' requis uniquement par multilingual-e5 (asymetric retrieval)
        prefix = "query: " if "e5" in EMBEDDING_MODEL_NAME.lower() else ""
        query_embedding = self.model.encode([f"{prefix}{query_text}"]).tolist()
        kwargs = {"n_results": top_k, "include": ["documents", "metadatas", "distances"]}
        if category:
            kwargs["where"] = {"category": category}
            print(f"  Filtre categorie actif : \'{category}\'")
        raw = self._collection.query(query_embeddings=query_embedding, **kwargs)
        return self._format_results(raw)

    def _format_results(self, raw: dict) -> list:
        docs = raw.get("documents", [[]])[0]
        metas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]
        scores = self._normalize_scores(distances)
        results = [
            {
                "text": text,
                "score": score,
                "raw_distance": round(dist, 4),
                "source": meta.get("source", "inconnu"),
                "category": meta.get("category") or meta.get("type", "inconnu"),
                "metadata": meta,
            }
            for text, meta, dist, score in zip(docs, metas, distances, scores)
        ]
        results.sort(key=lambda x: x["score"], reverse=True)
        return results

'''

if main_idx != -1:
    main_block = content[main_idx:]
    new_content = new_class + main_block
else:
    # No main block found, just use new class
    new_content = new_class

with open('src/retrieval/retriever.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("SUCCESS")
