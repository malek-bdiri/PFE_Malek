"""Fix ajouter_chunks_db in ingestion.py - remove FAISS, fix embedding prefix."""
import re

with open('scripts/ingestion.py', encoding='utf-8') as f:
    content = f.read()

# Find and replace the function using regex
pattern = r'def ajouter_chunks_db\(chunks, model, collection, faiss_store=None\):.*?return added'

new_func = '''def ajouter_chunks_db(chunks, model, collection):
    """Ajoute les chunks dans ChromaDB avec deduplication par ID."""
    print(f"  Ajout de {len(chunks)} chunks dans ChromaDB...")

    textes = [chunk["texte"] for chunk in chunks]
    metadatas = [chunk["metadata"] for chunk in chunks]
    ids = [construire_chunk_id(chunk["metadata"]) for chunk in chunks]

    existing_ids = set()
    try:
        existing = collection.get(ids=ids)
        existing_ids = set(existing["ids"])
    except Exception:
        pass

    nouveaux_indices = [i for i, id_ in enumerate(ids) if id_ not in existing_ids]
    if not nouveaux_indices:
        print("     Tous les chunks existent deja, ignore")
        return 0

    t_new = [textes[i] for i in nouveaux_indices]
    m_new = [metadatas[i] for i in nouveaux_indices]
    id_new = [ids[i] for i in nouveaux_indices]

    print(f"     {len(nouveaux_indices)} nouveaux chunks -> ChromaDB")
    print("     Generation des embeddings...")
    # Prefixe 'passage:' requis uniquement par multilingual-e5 (asymetric retrieval)
    prefix = "passage: " if "e5" in EMBEDDING_MODEL_NAME.lower() else ""
    t_prefixed = [f"{prefix}{t}" for t in t_new]
    vecteurs = model.encode(t_prefixed, show_progress_bar=True).tolist()
    collection.add(embeddings=vecteurs, documents=t_new, metadatas=m_new, ids=id_new)
    print(f"     Chunks ajoutes avec succes -> {collection.count()} total")
    return len(nouveaux_indices)'''

new_content, count = re.subn(pattern, new_func, content, flags=re.DOTALL)
if count == 1:
    with open('scripts/ingestion.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"SUCCESS: replaced {count} occurrence(s)")
else:
    print(f"FAILED: found {count} matches")
