"""
FAISS VectorStore — remplace ChromaDB.

Stocke :
  vector_db/index.faiss   → vecteurs (IndexFlatIP, cosine via normalisation L2)
  vector_db/chunks_meta.pkl → liste de dicts {text, source, category, chunk_id, ...}

Pourquoi FAISS plutot que ChromaDB dans un IDE en ligne :
  ChromaDB PersistentClient ecrit dans un dossier avec des fichiers verrouilles
  qui sont reinitialises a chaque session dans certains environnements cloud.
  FAISS stocke tout en deux fichiers portables versionnables avec Git LFS.
"""
from __future__ import annotations

import os
import pickle
from pathlib import Path

# Charger .env si present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

FAISS_INDEX_PATH = os.getenv("FAISS_INDEX_PATH", "./vector_db/index.faiss")
FAISS_META_PATH  = os.getenv("FAISS_META_PATH",  "./vector_db/chunks_meta.pkl")
MIN_COSINE_SCORE = float(os.getenv("MIN_COSINE_SCORE", "0.40"))


class FAISSStore:
    """
    Wrapper FAISS pour le RAG MOMsoft.

    Utilise IndexFlatIP (Inner Product) avec vecteurs L2-normalises
    → score = cosine similarity ∈ [0, 1].
    Les metadonnees (texte, source, category, ...) sont stockees separement
    dans un fichier pickle indexe par position dans l'index FAISS.
    """

    def __init__(self):
        try:
            import faiss
            self._faiss = faiss
        except ImportError as e:
            raise RuntimeError(
                "faiss-cpu n'est pas installe. Lancez : pip install faiss-cpu"
            ) from e

        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(FAISS_META_PATH):
            self.index = self._faiss.read_index(FAISS_INDEX_PATH)
            with open(FAISS_META_PATH, "rb") as f:
                self.chunks = pickle.load(f)
            print(f"[FAISSStore] Charge : {self.index.ntotal} vecteurs")
        else:
            self.index = None
            self.chunks: list[dict] = []
            print("[FAISSStore] Aucun index trouve — appelez add() pour creer l'index")

    # ── Ingestion ─────────────────────────────────────────────────────────

    def add(self, texts: list[str], metadatas: list[dict], model) -> int:
        """
        Encode et ajoute des chunks a l'index.
        Deduplication basee sur (source_relative_path, chunk_id).
        Retourne le nombre de chunks reellement ajoutes.
        """
        import numpy as np

        if not texts:
            return 0

        # Deduplication
        existing_keys = {
            (c.get("source_relative_path", ""), c.get("chunk_id", -1))
            for c in self.chunks
        }
        nouveaux_texts = []
        nouveaux_metas = []
        for text, meta in zip(texts, metadatas):
            key = (meta.get("source_relative_path", ""), meta.get("chunk_id", -1))
            if key not in existing_keys:
                nouveaux_texts.append(text)
                nouveaux_metas.append(meta)
                existing_keys.add(key)

        if not nouveaux_texts:
            return 0

        # Préfixe 'passage:' requis par multilingual-e5-base (asymétric retrieval)
        prefixed = [f"passage: {t}" for t in nouveaux_texts]
        embeddings = model.encode(
            prefixed,
            show_progress_bar=True,
            normalize_embeddings=True,
        )
        embeddings = np.array(embeddings, dtype="float32")

        if self.index is None:
            dim = embeddings.shape[1]
            self.index = self._faiss.IndexFlatIP(dim)

        self.index.add(embeddings)
        self.chunks.extend([
            {"text": t, **m}
            for t, m in zip(nouveaux_texts, nouveaux_metas)
        ])

        self._sauvegarder()
        return len(nouveaux_texts)

    def _sauvegarder(self) -> None:
        """Persiste l'index FAISS et les metadonnees sur disque."""
        os.makedirs(os.path.dirname(FAISS_INDEX_PATH), exist_ok=True)
        self._faiss.write_index(self.index, FAISS_INDEX_PATH)
        with open(FAISS_META_PATH, "wb") as f:
            pickle.dump(self.chunks, f)

    # ── Recherche ─────────────────────────────────────────────────────────

    def search(
        self,
        query: str,
        model,
        top_k: int = 8,
        category: str = None,
        min_score: float = None,
    ) -> list[dict]:
        """
        Recherche semantique avec filtrage par categorie et seuil de score.

        Strategie de filtrage categorie :
          FAISS ne supporte pas WHERE natif. On recupere fetch_k candidats
          (top_k x 10 si filtre actif, plafonné a 200), puis on filtre
          post-retrieval sur le champ 'category' des metadonnees.
          C'est l'approche standard pour FAISS + metadonnees separees.

        Score :
          score = cosine similarity ∈ [-1, 1], en pratique [0, 1] sur
          des vecteurs positifs. Converti en pourcentage (0-100).
          Un chunk avec score < min_score est rejete (hors-sujet).
        """
        if self.index is None or self.index.ntotal == 0:
            return []

        import numpy as np

        min_score = min_score if min_score is not None else MIN_COSINE_SCORE

        # Préfixe 'query:' requis par multilingual-e5-base (asymétric retrieval)
        q_emb = model.encode([f"query: {query}"], normalize_embeddings=True)
        q_emb = np.array(q_emb, dtype="float32")

        # Recup plus de candidats si filtre categorie actif
        fetch_k = min(
            top_k * 10 if category else top_k * 2,
            200,
            self.index.ntotal,
        )
        scores_raw, indices = self.index.search(q_emb, fetch_k)
        scores_raw = scores_raw[0]
        indices    = indices[0]

        results = []
        for score, idx in zip(scores_raw, indices):
            if idx < 0:
                continue
            if float(score) < min_score:
                continue  # rejeter les chunks hors-sujet
            chunk = self.chunks[idx]
            if category and chunk.get("category") != category:
                continue

            results.append({
                "text":     chunk["text"],
                "score":    round(float(score) * 100, 1),
                "source":   chunk.get("source", "inconnu"),
                "category": chunk.get("category", "?"),
                "metadata": {k: v for k, v in chunk.items() if k != "text"},
            })

            if len(results) >= top_k:
                break

        return results

    # ── Feedback loop (validation / correction humaine) ───────────────────

    def mark_verified(self, source: str, chunk_id: int, verified: bool = True) -> int:
        """
        Marque un chunk comme valide (verified=True) ou rejete (verified=False)
        par l'utilisateur apres revision du resultat IA.

        Utilisation front : apres que l'utilisateur valide/rejette une reponse,
        appelez mark_verified() avec verified=True/False.
        Les chunks rejected=True peuvent etre filtres a la prochaine recherche
        en ajoutant `if chunk.get('rejected'): continue` dans search().
        """
        updated = 0
        for chunk in self.chunks:
            if chunk.get("source") == source and chunk.get("chunk_id") == chunk_id:
                chunk["verified"] = verified
                chunk["rejected"] = not verified
                updated += 1
        if updated:
            self._sauvegarder()
        return updated

    def mark_modified(self, source: str, chunk_id: int, new_text: str) -> bool:
        """
        Permet a l'utilisateur de corriger le texte d'un chunk
        (modification humaine apres generation IA).

        NB : le vecteur FAISS n'est PAS mis a jour (re-encoder couterait cher).
        Utiliser pour corrections mineures de wording.
        Pour une correction majeure, supprimer et re-ingerer le document.
        """
        for chunk in self.chunks:
            if chunk.get("source") == source and chunk.get("chunk_id") == chunk_id:
                chunk["text_human_corrected"] = new_text
                chunk["human_reviewed"] = True
                self._sauvegarder()
                return True
        return False

    def count(self) -> int:
        """Retourne le nombre total de vecteurs indexes."""
        return self.index.ntotal if self.index is not None else 0
