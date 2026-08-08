import os
from app.extraction.extractor import DocumentExtractor
from app.cleaning.cleaner import TextCleaner
from app.chunking.chunker import HierarchicalChunker
from app.metadata.extractor import MetadataExtractor
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher

def ingest_icar_soil_erosion():
    print("Ingesting ICAR Soil Erosion PDF (NAT_ICAR_01.pdf)...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pdf_path = os.path.join(base_dir, "data", "raw", "national", "iiswc", "NAT_ICAR_01.pdf")

    extractor = DocumentExtractor()
    cleaner = TextCleaner()
    chunker = HierarchicalChunker()
    metadata_ext = MetadataExtractor()
    embedder = Embedder()
    vector_store = VectorStore()
    bm25 = BM25Searcher()

    doc_meta = {
        "document_id": "NAT_ICAR_01",
        "title": "Land Degradation due to Water-Induced Soil Erosion in India",
        "organization": "ICAR-IISWC",
        "source_level": "national",
        "country": "India",
        "topic": "Water-induced soil erosion assessment and spatial distribution"
    }

    # 1. Extract
    pages = extractor.extract(pdf_path, "NAT_ICAR_01")
    print(f"Extracted {len(pages)} pages.")

    # 2. Clean & Chunk
    cleaned_pages = cleaner.clean_pages(pages)
    chunks = chunker.chunk_document(doc_meta, cleaned_pages)
    print(f"Created {len(chunks)} chunks.")

    # 3. Metadata Enrichment
    for c in chunks:
        c.update(metadata_ext.extract_attributes(c))

    # 4. Generate Embeddings
    print(f"Generating embeddings for {len(chunks)} chunks...")
    texts = [f"Title: {c.get('title', '')}\nSection: {c.get('section_heading', '')}\nText: {c.get('text', '')}" for c in chunks]
    embeddings = embedder.embed_texts(texts)

    # 5. Add to VectorStore & BM25 Index
    vector_store.add_chunks(chunks, embeddings)
    bm25.build_index(vector_store.chunks)

    print(f"Successfully ingested NAT_ICAR_01.pdf! Total active chunks in VectorStore: {len(vector_store.chunks)}")

if __name__ == "__main__":
    ingest_icar_soil_erosion()
