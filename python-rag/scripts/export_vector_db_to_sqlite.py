"""Exporte toute la collection Chroma vers une base SQLite lisible.

Tables creees:
- chunks: tous les chunks avec texte et metadonnees principales
- stats: agregats par source, categorie et extension

Usage:
  python scripts/export_vector_db_to_sqlite.py
  python scripts/export_vector_db_to_sqlite.py --collection documents
"""

from __future__ import annotations

import argparse
import csv
import sqlite3
import unicodedata
from collections import Counter
import os
from pathlib import Path

import chromadb


DEFAULT_DB_PATH = "./vector_db"
DEFAULT_COLLECTION = os.getenv("COLLECTION_NAME", "documents").strip() or "documents"
DEFAULT_SQLITE_PATH = "./scripts/vector_db_full.sqlite"
DEFAULT_CHUNKS_CSV_PATH = "./chunks.csv"


def infer_extension(metadata: dict) -> str:
    source = str(metadata.get("source", ""))
    suffix = Path(source).suffix.lower()
    return suffix or "<unknown>"


def infer_category(metadata: dict) -> str:
    category = str(metadata.get("category", "") or "").strip()
    if category and category != "<unknown>":
        return category

    source_rel = str(metadata.get("source_relative_path", "") or "")
    source = source_rel or str(metadata.get("source", "") or "")
    first = source.replace("\\", "/").split("/")[0].strip().lower()
    first_ascii = unicodedata.normalize("NFKD", first).encode("ascii", "ignore").decode("ascii")

    if "afd" in first_ascii:
        return "AFD"
    if "cdc" in first_ascii or "cahier" in first_ascii:
        return "CdC"
    if "exigence" in first_ascii:
        return "Exigences"
    if "guide" in first_ascii:
        return "Guide"

    return first or "<unknown>"


def fetch_all_chunks(collection):
    total = collection.count()
    batch_size = 500
    rows = []

    for offset in range(0, total, batch_size):
        batch = collection.get(
            limit=min(batch_size, total - offset),
            offset=offset,
            include=["documents", "metadatas"],
        )

        ids = batch.get("ids", [])
        docs = batch.get("documents", [])
        metas = batch.get("metadatas", [])

        for i, chunk_id in enumerate(ids):
            metadata = metas[i] if i < len(metas) and metas[i] else {}
            document = docs[i] if i < len(docs) else ""

            rows.append(
                {
                    "id": chunk_id,
                    "source": metadata.get("source", ""),
                    "source_relative_path": metadata.get("source_relative_path", ""),
                    "category": infer_category(metadata),
                    "type": metadata.get("type", ""),
                    "extraction_method": metadata.get("extraction_method", ""),
                    "chunk_id": metadata.get("chunk_id", None),
                    "total_chunks": metadata.get("total_chunks", None),
                    "date_ajout": metadata.get("date_ajout", ""),
                    "text_len": len(document or ""),
                    "text": document or "",
                    "extension": infer_extension(metadata),
                }
            )

    rows.sort(
        key=lambda r: (
            r.get("source_relative_path") or r.get("source") or "",
            int(r.get("chunk_id") or 0),
            r.get("id") or "",
        )
    )
    return rows


def export_chunks_csv(rows, csv_path: Path):
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "id",
        "source",
        "source_relative_path",
        "category",
        "type",
        "extension",
        "extraction_method",
        "chunk_id",
        "total_chunks",
        "date_ajout",
        "text_len",
        "text",
    ]

    with open(csv_path, "w", encoding="utf-8", newline="") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def create_tables(cur):
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS chunks (
            id TEXT PRIMARY KEY,
            source TEXT,
            source_relative_path TEXT,
            category TEXT,
            type TEXT,
            extension TEXT,
            extraction_method TEXT,
            chunk_id INTEGER,
            total_chunks INTEGER,
            date_ajout TEXT,
            text_len INTEGER,
            text TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS stats (
            scope TEXT,
            name TEXT,
            chunk_count INTEGER,
            PRIMARY KEY (scope, name)
        )
        """
    )


def export_to_sqlite(rows, sqlite_path: Path):
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(sqlite_path))
    cur = conn.cursor()

    create_tables(cur)
    cur.execute("DELETE FROM chunks")
    cur.execute("DELETE FROM stats")

    cur.executemany(
        """
        INSERT INTO chunks (
            id, source, source_relative_path, category, type, extension,
            extraction_method, chunk_id, total_chunks, date_ajout,
            text_len, text
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            (
                r["id"],
                r["source"],
                r["source_relative_path"],
                r["category"],
                r["type"],
                r["extension"],
                r["extraction_method"],
                r["chunk_id"],
                r["total_chunks"],
                r["date_ajout"],
                r["text_len"],
                r["text"],
            )
            for r in rows
        ],
    )

    by_source = Counter((r["source_relative_path"] or r["source"] or "<unknown>") for r in rows)
    by_category = Counter((r["category"] or "<unknown>") for r in rows)
    by_extension = Counter((r["extension"] or "<unknown>") for r in rows)

    stat_rows = []
    for name, count in by_source.items():
        stat_rows.append(("source", name, count))
    for name, count in by_category.items():
        stat_rows.append(("category", name, count))
    for name, count in by_extension.items():
        stat_rows.append(("extension", name, count))

    cur.executemany("INSERT INTO stats (scope, name, chunk_count) VALUES (?, ?, ?)", stat_rows)

    # Index utiles pour exploration SQL rapide
    cur.execute("CREATE INDEX IF NOT EXISTS idx_chunks_source_rel ON chunks(source_relative_path)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_chunks_category ON chunks(category)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_chunks_extension ON chunks(extension)")

    conn.commit()
    conn.close()


def main():
    parser = argparse.ArgumentParser(description="Export complet Chroma -> SQLite")
    parser.add_argument("--db-path", default=DEFAULT_DB_PATH, help="Chemin de la DB Chroma")
    parser.add_argument("--collection", default=DEFAULT_COLLECTION, help="Nom de la collection Chroma")
    parser.add_argument("--output", default=DEFAULT_SQLITE_PATH, help="Chemin du fichier SQLite de sortie")
    parser.add_argument("--chunks-csv", default=DEFAULT_CHUNKS_CSV_PATH, help="Chemin du CSV complet des chunks")
    args = parser.parse_args()

    client = chromadb.PersistentClient(path=args.db_path)
    collection = client.get_collection(name=args.collection)

    total_chunks = collection.count()
    print("=" * 72)
    print("EXPORT CHROMA -> SQLITE")
    print("=" * 72)
    print(f"DB path      : {Path(args.db_path).resolve()}")
    print(f"Collection   : {args.collection}")
    print(f"Total chunks : {total_chunks}")

    rows = fetch_all_chunks(collection)
    sqlite_path = Path(args.output)
    export_to_sqlite(rows, sqlite_path)
    csv_path = Path(args.chunks_csv)
    export_chunks_csv(rows, csv_path)

    print(f"SQLite export: {sqlite_path}")
    print(f"CSV export   : {csv_path}")
    print("Tables creees: chunks, stats")


if __name__ == "__main__":
    main()
