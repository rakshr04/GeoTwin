import os
import sys

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

import time
from app.extraction.extractor import DocumentExtractor
from app.cleaning.cleaner import TextCleaner
from app.chunking.chunker import HierarchicalChunker
from app.metadata.extractor import MetadataExtractor
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher
from scripts.copy_user_pdfs import pdf_mapping

def ingest_user_pdfs_one_by_one():
    print("==========================================================================")
    print("  LANDPATCH PDF INGESTION: SEQUENTIAL INGESTION OF 11 USER DOCUMENTS")
    print("==========================================================================")
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    extractor = DocumentExtractor()
    cleaner = TextCleaner()
    chunker = HierarchicalChunker()
    metadata_ext = MetadataExtractor()
    embedder = Embedder()
    vector_store = VectorStore()
    bm25 = BM25Searcher()

    total_chunks_added = 0

    for idx, item in enumerate(pdf_mapping, 1):
        doc_id = item["doc_id"]
        title = item["exact_title"]
        rel_path = item["dest"]
        filepath = os.path.join(base_dir, rel_path)

        print(f"\n--------------------------------------------------------------------------")
        print(f"[{idx}/{len(pdf_mapping)}] INGESTING DOCUMENT: {doc_id}")
        print(f"  Title      : {title}")
        print(f"  Destination: {rel_path}")
        print(f"  File Size  : {os.path.getsize(filepath) / (1024*1024):.2f} MB")
        print(f"--------------------------------------------------------------------------")

        if not os.path.exists(filepath):
            print(f"  [ERROR] File not found at {filepath}. Skipping.")
            continue

        t0 = time.time()
        
        # 1. Extraction
        print("  1/5 Extracting pages from PDF...")
        pages = extractor.extract(filepath, doc_id)
        
        # 2. Cleaning
        print("  2/5 Cleaning page text...")
        cleaned_pages = cleaner.clean_pages(pages)
        
        # 3. Hierarchical Chunking
        print("  3/5 Creating hierarchical chunks...")
        doc_info = {
            "document_id": doc_id,
            "exact_title": title,
            "organization": item.get("organization", "Unknown"),
            "source_level": item.get("source_level", "national"),
            "state": item.get("state"),
            "district": item.get("district"),
            "country": item.get("country", "India"),
            "topic": item.get("topic", "Watershed Restoration")
        }
        chunks = chunker.chunk_document(doc_info, cleaned_pages)

        # 4. Enrich Metadata
        print("  4/5 Enriching chunk metadata & attributes...")
        for c in chunks:
            c.update(metadata_ext.extract_attributes(c))

        # 5. Embed & Store
        print(f"  5/5 Embedding & Indexing {len(chunks)} chunks into VectorStore & BM25...")
        if chunks:
            texts = [
                f"Title: {c.get('exact_title', c.get('title', ''))}\nSection: {c.get('section_heading', '')}\nText: {c.get('text', '')}"
                for c in chunks
            ]
            embeddings = embedder.embed_texts(texts)
            vector_store.add_chunks(chunks, embeddings)
            bm25.build_index(vector_store.chunks)

        t_elapsed = time.time() - t0
        total_chunks_added += len(chunks)

        print(f"  [SUCCESS] {doc_id} Ingested in {t_elapsed:.2f}s | Pages: {len(pages)} | Chunks: {len(chunks)} | Active Total Chunks in DB: {len(vector_store.chunks)}")

    print("\n==========================================================================")
    print(f"  ALL {len(pdf_mapping)} USER DOCUMENTS INGESTED SUCCESSFULLY!")
    print(f"  Total Chunks Created & Indexed: {total_chunks_added}")
    print(f"  Total Active Chunks in VectorStore & BM25: {len(vector_store.chunks)}")
    print("==========================================================================")

if __name__ == "__main__":
    ingest_user_pdfs_one_by_one()
