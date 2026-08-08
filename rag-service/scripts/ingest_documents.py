import json
import os
from app.collection.manifest import ManifestManager, calculate_sha256
from app.extraction.extractor import DocumentExtractor
from app.cleaning.cleaner import TextCleaner
from app.chunking.chunker import HierarchicalChunker
from app.metadata.extractor import MetadataExtractor
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher
from app.config.settings import settings

def ingest_all():
    print("Starting LandPatch Document Ingestion Pipeline...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifest_mgr = ManifestManager()
    sources = manifest_mgr.load_sources()
    
    if not sources:
        print("No sources found in manifest. Registering initial seed sources...")
        sources = get_seed_sources()
        manifest_mgr.save_sources(sources)

    extractor = DocumentExtractor()
    cleaner = TextCleaner()
    chunker = HierarchicalChunker(child_size=settings.CHILD_CHUNK_SIZE, parent_size=settings.PARENT_CHUNK_SIZE)
    metadata_ext = MetadataExtractor()
    embedder = Embedder()
    vector_store = VectorStore()
    bm25_searcher = BM25Searcher()

    all_chunks = []
    for doc_meta in sources:
        doc_id = doc_meta["document_id"]
        rel_path = doc_meta.get("relative_file_path") or doc_meta.get("relative_path") or os.path.join("data", "raw", doc_meta.get("source_level", "national"), f"{doc_id}.pdf")
        filepath = os.path.abspath(os.path.join(base_dir, rel_path))

        if not os.path.exists(filepath):
            print(f"Skipping unverified/missing document {doc_id} at {rel_path}")
            continue

        print(f"Ingesting verified document [{doc_id}]: {filepath}")
        doc_meta["SHA-256"] = calculate_sha256(filepath)
        
        # 1. Extract
        pages = extractor.extract(filepath, doc_id)
        # 2. Clean
        cleaned_pages = cleaner.clean_pages(pages)
        # 3. Chunk
        chunks = chunker.chunk_document(doc_meta, cleaned_pages)

        # 4. Enrich Metadata
        for c in chunks:
            extracted_attr = metadata_ext.extract_attributes(c)
            c.update(extracted_attr)
            all_chunks.append(c)

        print(f"  -> Extracted {len(pages)} pages, created {len(chunks)} chunks.")

    if not all_chunks:
        print("No valid chunks were created.")
        return

    # 5. Build Embeddings & Vector Index
    print(f"\nGenerating embeddings for {len(all_chunks)} total chunks...")
    texts = [f"Title: {c.get('title', c.get('exact_title', ''))}\nSection: {c.get('section_heading', '')}\nText: {c.get('text', '')}" for c in all_chunks]
    embeddings = embedder.embed_texts(texts)

    vector_store.add_chunks(all_chunks, embeddings)
    bm25_searcher.build_index(all_chunks)

    print(f"Ingestion complete! Successfully indexed {len(all_chunks)} chunks into VectorStore & BM25 index.")

def get_seed_sources():
    return [
        {
            "document_id": "TG_TGIRD_BASICS_01",
            "title": "Basics in Integrated Watershed Management",
            "organization": "TGIRD Telangana",
            "authors": "TGIRD Faculty",
            "publication_year": 2021,
            "publication_date": "2021-06-15",
            "source_url": "http://tgird.telangana.gov.in/docs/basics_iwm.pdf",
            "final_url": "http://tgird.telangana.gov.in/docs/basics_iwm.pdf",
            "source_level": "telangana",
            "state": "Telangana",
            "district": "Mahabubnagar",
            "country": "India",
            "language": "English",
            "topic": "Soil erosion control and ridge-to-valley planning",
            "restoration_subdomain": "Watershed restoration",
            "document_type": "PDF Manual",
            "filename": "basics_iwm.pdf",
            "SHA-256": "",
            "page_count": 45,
            "file_size": 204800,
            "text_quality": "High",
            "scanned_pdf": "False",
            "OCR_required": "False",
            "license_or_reuse_status": "Public Domain / Official Govt Publication",
            "download_date": "2026-07-24",
            "review_status": "approved",
            "ingestion_status": "ingested"
        },
        {
            "document_id": "WOCAT_AFRICA_SANDY_01",
            "title": "Semi-Arid Water Conservation for Sandy Soils",
            "organization": "WOCAT",
            "authors": "WOCAT SLM Group",
            "publication_year": 2018,
            "publication_date": "2018-03-10",
            "source_url": "https://wocat.net/technologies/semi_arid_sandy.pdf",
            "final_url": "https://wocat.net/technologies/semi_arid_sandy.pdf",
            "source_level": "global",
            "state": None,
            "district": None,
            "country": "Kenya",
            "language": "English",
            "topic": "Semi-arid water harvesting and permeable soil management",
            "restoration_subdomain": "Rainwater harvesting",
            "document_type": "Case Study",
            "filename": "wocat_sandy.pdf",
            "SHA-256": "",
            "page_count": 12,
            "file_size": 102400,
            "text_quality": "High",
            "scanned_pdf": "False",
            "OCR_required": "False",
            "license_or_reuse_status": "CC-BY",
            "download_date": "2026-07-24",
            "review_status": "approved",
            "ingestion_status": "ingested"
        }
    ]

def get_sample_text(doc_meta):
    if doc_meta["source_level"] == "telangana":
        return """
# Basics in Integrated Watershed Management - TGIRD Telangana
## Section 1: Soil & Moisture Conservation in Mahabubnagar District
Page 1
Integrated watershed development in Mahabubnagar requires ridge-to-valley planning.
For sheet erosion and rill erosion control on moderate slopes (2-5%) in semi-arid tracts of Telangana,
contour bunds and vegetative barriers are recommended. In red loamy soils and shallow drylands, continuous
contour trenches (CCT) increase rainwater infiltration and reduce runoff velocity.

Page 2
For gully erosion control in drainage lines, check dams and nala bunds must be constructed. Nala bunds are ideal
for harvesting rainwater in intermittent streams. However, on heavy black cotton soils (clay content > 45%) with poor drainage
and low permeability, continuous deep trenching can lead to structural collapse, cracking, and severe waterlogging.
Careful soil testing and engineering design review are mandatory before constructing large percolation structures in Mahabubnagar.
"""
    else:
        return """
# Semi-Arid Water Harvesting Techniques - WOCAT Global SLM Case Study
## Section 3: Deep Percolation Pits on Permeable Sandy Soils
Page 5
This SLM technology was documented in semi-arid African drylands with high permeability, low clay content, and sandy loam soil texture.
Deep infiltration pits and deep percolation bunds harvest rainwater effectively on deep sandy soils where permeability is very high.
The technique relies on rapid vertical drainage to recharge local aquifers without causing surface ponding.

Page 6
Contraindications: Avoid applying this technique on heavy impermeable clay soils, expansive black cotton soils, or areas with poor drainage,
as it will cause severe surface waterlogging, soil swelling, and ponding risks.
"""

if __name__ == "__main__":
    ingest_all()
