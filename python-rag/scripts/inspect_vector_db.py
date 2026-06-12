"""Inspecte le contenu de la base vectorielle Chroma en mode lisible.

Usage:
  python scripts/inspect_vector_db.py
  python scripts/inspect_vector_db.py --collection documents --peek 10
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
import os
from pathlib import Path

import chromadb


DEFAULT_DB_PATH = "./vector_db"
DEFAULT_COLLECTION = os.getenv("COLLECTION_NAME", "documents").strip() or "documents"


def compact_text(text: str, max_chars: int) -> str:
    if not text:
        return ""
    text = " ".join(str(text).split())
    return text if len(text) <= max_chars else text[:max_chars] + " ..."


def fetch_all_rows(collection):
    total = collection.count()
    rows = []
    batch_size = 500

    for offset in range(0, total, batch_size):
        chunk = collection.get(
            limit=min(batch_size, total - offset),
            offset=offset,
            include=["documents", "metadatas"],
        )
        ids = chunk.get("ids", [])
        docs = chunk.get("documents", [])
        metas = chunk.get("metadatas", [])

        for i, chunk_id in enumerate(ids):
            rows.append(
                {
                    "id": chunk_id,
                    "document": docs[i] if i < len(docs) else "",
                    "metadata": metas[i] if i < len(metas) and metas[i] else {},
                }
            )

    return rows


def write_source_summary_csv(rows, output_csv: Path):
    source_counter = Counter()
    category_counter = Counter()
    extension_counter = Counter()

    for row in rows:
        md = row["metadata"]
        source = md.get("source_relative_path") or md.get("source") or "<unknown>"
        category = md.get("category") or "<unknown>"
        extension = Path(md.get("source", "")).suffix.lower() or "<unknown>"

        source_counter[source] += 1
        category_counter[category] += 1
        extension_counter[extension] += 1

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerow(["scope", "name", "chunk_count"])

        for name, count in source_counter.most_common():
            writer.writerow(["source", name, count])
        for name, count in category_counter.most_common():
            writer.writerow(["category", name, count])
        for name, count in extension_counter.most_common():
            writer.writerow(["extension", name, count])


def main():
    parser = argparse.ArgumentParser(description="Inspection lisible de la vector DB Chroma")
    parser.add_argument("--db-path", default=DEFAULT_DB_PATH, help="Chemin de la DB Chroma")
    parser.add_argument("--collection", default=DEFAULT_COLLECTION, help="Nom de la collection")
    parser.add_argument("--peek", type=int, default=5, help="Nombre de chunks a afficher")
    parser.add_argument("--snippet", type=int, default=220, help="Taille de l'aperçu texte")
    parser.add_argument(
        "--export-json",
        default="./scripts/vector_db_preview.json",
        help="Fichier JSON de sortie (aperçu)",
    )
    parser.add_argument(
        "--export-csv",
        default="./scripts/vector_db_sources_summary.csv",
        help="Fichier CSV de sortie (resume)",
    )
    args = parser.parse_args()

    db_path = Path(args.db_path)
    print("=" * 72)
    print("INSPECTION VECTOR DB")
    print("=" * 72)
    print(f"DB path      : {db_path.resolve()}")
    print(f"Collection   : {args.collection}")

    client = chromadb.PersistentClient(path=str(db_path))
    collection = client.get_collection(name=args.collection)
    total = collection.count()
    print(f"Total chunks : {total}")

    rows = fetch_all_rows(collection)

    # Resume global
    by_source = Counter()
    by_category = Counter()
    by_ext = Counter()
    for row in rows:
        md = row["metadata"]
        src = md.get("source_relative_path") or md.get("source") or "<unknown>"
        cat = md.get("category") or "<unknown>"
        ext = Path(md.get("source", "")).suffix.lower() or "<unknown>"
        by_source[src] += 1
        by_category[cat] += 1
        by_ext[ext] += 1

    print(f"Documents sources uniques : {len(by_source)}")
    print("Top categories:")
    for name, count in by_category.most_common(10):
        print(f"  - {name}: {count} chunks")

    print("Top extensions:")
    for name, count in by_ext.most_common(10):
        print(f"  - {name}: {count} chunks")

    # Peek de chunks
    print("\nApercu de chunks:")
    for i, row in enumerate(rows[: max(0, args.peek)], start=1):
        md = row["metadata"]
        src = md.get("source_relative_path") or md.get("source") or "<unknown>"
        chunk_id = md.get("chunk_id", "?")
        total_chunks = md.get("total_chunks", "?")
        print(f"\n[{i}] id={row['id']}")
        print(f"    source      : {src}")
        print(f"    chunk       : {chunk_id}/{total_chunks}")
        print(f"    extraction  : {md.get('extraction_method', '')}")
        print(f"    text_len    : {len(row['document'] or '')}")
        print(f"    text_preview: {compact_text(row['document'] or '', args.snippet)}")

    # Export JSON aperçu
    export_json = Path(args.export_json)
    export_json.parent.mkdir(parents=True, exist_ok=True)
    json_payload = {
        "db_path": str(db_path.resolve()),
        "collection": args.collection,
        "total_chunks": total,
        "unique_sources": len(by_source),
        "by_category": dict(by_category),
        "by_extension": dict(by_ext),
        "peek": [
            {
                "id": row["id"],
                "source": row["metadata"].get("source_relative_path")
                or row["metadata"].get("source")
                or "<unknown>",
                "chunk_id": row["metadata"].get("chunk_id"),
                "total_chunks": row["metadata"].get("total_chunks"),
                "extraction_method": row["metadata"].get("extraction_method", ""),
                "text_len": len(row["document"] or ""),
                "text_preview": compact_text(row["document"] or "", args.snippet),
            }
            for row in rows[: max(0, args.peek)]
        ],
    }
    with export_json.open("w", encoding="utf-8") as f:
        json.dump(json_payload, f, ensure_ascii=False, indent=2)

    # Export CSV résumé
    export_csv = Path(args.export_csv)
    write_source_summary_csv(rows, export_csv)

    print("\nFichiers exportes:")
    print(f"  - {export_json}")
    print(f"  - {export_csv}")


if __name__ == "__main__":
    main()
