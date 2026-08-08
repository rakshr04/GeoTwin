import os
from app.extraction.extractor import DocumentExtractor
from app.cleaning.cleaner import TextCleaner
from app.chunking.chunker import HierarchicalChunker
from app.metadata.extractor import MetadataExtractor
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher

ICAR_DOCS = [
    {
        "document_id": "NAT_ICAR_01",
        "exact_title": "Land Degradation due to Water-Induced Soil Erosion in India",
        "organization": "ICAR-IISWC",
        "relative_path": "data/raw/national/iiswc/NAT_ICAR_01.pdf",
        "source_level": "national",
        "country": "India"
    },
    {
        "document_id": "NAT_ICAR_02",
        "exact_title": "Vegetation Degradation in Non-Arable Areas of India",
        "organization": "ICAR-NBSS&LUP",
        "relative_path": "data/raw/national/nbsslup/NAT_ICAR_02.pdf",
        "source_level": "national",
        "country": "India"
    },
    {
        "document_id": "NAT_ICAR_03",
        "exact_title": "Acid Soils of India: Distribution and Management",
        "organization": "ICAR-NBSS&LUP",
        "relative_path": "data/raw/national/nbsslup/NAT_ICAR_03.pdf",
        "source_level": "national",
        "country": "India"
    },
    {
        "document_id": "NAT_ICAR_04",
        "exact_title": "Land Degradation Due to Wind Erosion in Arid Regions of India",
        "organization": "ICAR-CAZRI",
        "relative_path": "data/raw/national/cazri/NAT_ICAR_04.pdf",
        "source_level": "national",
        "country": "India"
    },
    {
        "document_id": "NAT_ICAR_05",
        "exact_title": "Degraded and Wastelands of India: Status and Spatial Distribution",
        "organization": "ICAR & NAAS",
        "relative_path": "data/raw/national/icar/NAT_ICAR_05.pdf",
        "source_level": "national",
        "country": "India"
    }
]

def batch_ingest_all_icar_pdfs():
    print("=== BATCH INGESTING ALL 5 ICAR CORE PUBLICATIONS INTO VECTORSTORE ===")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    extractor = DocumentExtractor()
    cleaner = TextCleaner()
    chunker = HierarchicalChunker()
    metadata_ext = MetadataExtractor()
    embedder = Embedder()
    vector_store = VectorStore()
    bm25 = BM25Searcher()

    all_new_chunks = []

    for doc_info in ICAR_DOCS:
        doc_id = doc_info["document_id"]
        rel_path = doc_info["relative_path"]
        filepath = os.path.join(base_dir, rel_path)

        if not os.path.exists(filepath):
            print(f"Skipping missing PDF: {doc_id} at {rel_path}")
            continue

        print(f"\nProcessing [{doc_id}] - {doc_info['exact_title']}...")
        pages = extractor.extract(filepath, doc_id)
        cleaned_pages = cleaner.clean_pages(pages)
        chunks = chunker.chunk_document(doc_info, cleaned_pages)

        for c in chunks:
            c.update(metadata_ext.extract_attributes(c))
            all_new_chunks.append(c)

        print(f"  -> Extracted {len(pages)} pages, created {len(chunks)} chunks.")

    if not all_new_chunks:
        print("No chunks created.")
        return

    print(f"\nGenerating embeddings for {len(all_new_chunks)} total chunks...")
    texts = [f"Title: {c.get('exact_title', c.get('title', ''))}\nSection: {c.get('section_heading', '')}\nText: {c.get('text', '')}" for c in all_new_chunks]
    embeddings = embedder.embed_texts(texts)

    vector_store.add_chunks(all_new_chunks, embeddings)
    bm25.build_index(vector_store.chunks)

    print(f"\n[SUCCESS] INGESTION SUCCESSFUL! Total active chunks in VectorStore: {len(vector_store.chunks)}")

if __name__ == "__main__":
    batch_ingest_all_icar_pdfs()
