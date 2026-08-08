# LandPatch System Documentation

## Architecture & Design
LandPatch is a Telangana-focused land-restoration decision-support system built with a modular, production-ready RAG pipeline.

### Core Stack
- **Framework**: Python 3.11, FastAPI, Pydantic v2
- **Vector Storage**: Qdrant / In-Memory Vector Store
- **Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`)
- **Keyword Search**: `rank-bm25` (BM25Okapi)
- **Fusion**: Reciprocal Rank Fusion (RRF)
- **Reranker**: CrossEncoder (`cross-encoder/ms-marco-MiniLM-L-6-v2`)
- **Applicability Engine**: Deterministic rules engine with hard contraindications
- **Synthesizer**: Evidence-grounded report generator with page-level citations

## Source Weightage & Priority
- **60-70%** Telangana district & state sources (TGIRD, TGRAC, PJTSAU, ICAR-CRIDA, Forest Dept)
- **20-30%** National Indian sources (ICAR-IISWC, CGWB, Green India Mission)
- **~10%** Global supplementary sources (WOCAT, FAO, UNCCD)

## Hard Contraindication Rules
Global evidence matching broad climate tags (e.g. "semi-arid") without matching physical land conditions (soil type, texture, permeability, drainage) is automatically rejected or marked `contraindicated`.
For example, applying a WOCAT sandy soil high-permeability percolation pit to Mahabubnagar heavy black cotton clay soil with poor drainage will trigger a hard contraindication flag to prevent soil swelling, cracking, and severe waterlogging.
