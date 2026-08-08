import pytest
from app.chunking.chunker import HierarchicalChunker
from app.applicability.engine import ApplicabilityEngine
from app.schemas.rag_schemas import LandProfile
from app.citations.validator import CitationValidator

def test_hierarchical_chunker():
    chunker = HierarchicalChunker(child_size=100, parent_size=300)
    doc_meta = {"document_id": "TEST_DOC_01", "title": "Test Title", "source_level": "telangana"}
    pages = [{"page_num": 1, "text": "Soil conservation in Telangana requires contour bunds. " * 30}]
    chunks = chunker.chunk_document(doc_meta, pages)
    assert len(chunks) > 0
    assert chunks[0]["chunk_id"].startswith("chk_TEST_DOC_01")
    assert chunks[0]["page_start"] == 1

def test_applicability_engine_contraindication():
    engine = ApplicabilityEngine()
    profile = LandProfile(
        district="Mahabubnagar",
        state="Telangana",
        soil_type="black cotton soil",
        soil_texture="heavy clay",
        permeability="low",
        drainage="poor",
        waterlogging_risk="high"
    )
    src_meta = {
        "chunk_id": "chk_global_01",
        "source_level": "global",
        "soil_type": "sandy soil",
        "permeability": "high"
    }
    candidate = engine.evaluate_technique("Deep Percolation Pit", src_meta, profile)
    assert candidate.status == "contraindicated"
    assert len(candidate.contraindications) > 0

def test_citation_validator():
    validator = CitationValidator()
    citation = {"document_id": "DOC_01", "page_start": 5}
    chunk = {"document_id": "DOC_01", "page_start": 5}
    res = validator.validate_citation(citation, chunk)
    assert res["is_valid"] is True
