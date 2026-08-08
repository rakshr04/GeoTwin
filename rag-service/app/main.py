from fastapi import FastAPI, HTTPException, Depends
from app.schemas.rag_schemas import QueryRequest, RAGResponse, LandProfile, RetrievedEvidenceChunk, TechniqueCandidate, RetrievalScores
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher
from app.fusion.rrf import ReciprocalRankFusion
from app.reranking.reranker import CrossEncoderReranker
from app.applicability.engine import ApplicabilityEngine
from app.generation.synthesizer import AnswerSynthesizer
from app.config.settings import settings
import time
import urllib.request
import json

def fetch_live_weather(lat: float, lon: float):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat:.5f}&longitude={lon:.5f}&daily=precipitation_sum,temperature_2m_max&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "LandPatch-RAG/1.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode())
            current = data.get("current", {})
            daily = data.get("daily", {})
            
            recent_precip = 0.0
            if "precipitation_sum" in daily and daily["precipitation_sum"]:
                recent_precip = sum(p for p in daily["precipitation_sum"][:7] if p is not None)
                
            return {
                "temperature_c": current.get("temperature_2m"),
                "humidity_percent": current.get("relative_humidity_2m"),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "recent_7d_precip_mm": recent_precip
            }
    except Exception as e:
        print(f"Failed to fetch live weather: {e}")
        return None

app = FastAPI(
    title="LandPatch RAG Service",
    description="Telangana-focused land-restoration decision-support system RAG pipeline",
    version="1.0.0"
)

# Global lazy instances
embedder = Embedder()
vector_store = VectorStore()
bm25_searcher = BM25Searcher()
rrf_fusion = ReciprocalRankFusion()
reranker = CrossEncoderReranker()
applicability_engine = ApplicabilityEngine()
synthesizer = AnswerSynthesizer()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "LandPatch RAG Service",
        "version": "1.0.0",
        "indexed_chunks": len(vector_store.chunks)
    }

@app.get("/config")
def get_config():
    return {
        "embedding_model": settings.EMBEDDING_MODEL,
        "reranker_model": settings.RERANKER_MODEL,
        "top_k_dense": settings.TOP_K_DENSE,
        "top_k_bm25": settings.TOP_K_BM25,
        "enable_applicability_filter": settings.ENABLE_APPLICABILITY_FILTER
    }

@app.post("/retrieve", response_model=RAGResponse)
def retrieve_and_answer(req: QueryRequest):
    # 1. Parse Land Profile & Validate Missing Critical Fields
    profile = LandProfile(
        district=req.district,
        state=req.state or "Telangana",
        goal=req.restoration_goal,
        soil_type=req.soil_type,
        soil_texture=req.soil_texture,
        permeability=req.permeability,
        drainage=req.drainage,
        slope_percent=req.slope_percent,
        annual_rainfall_mm=req.annual_rainfall_mm,
        erosion_type=req.erosion_type,
        land_use=req.land_use,
        groundwater_condition=req.groundwater_condition,
        waterlogging_risk=req.waterlogging_risk,
        live_weather=fetch_live_weather(req.latitude, req.longitude) if req.latitude and req.longitude else None
    )

    missing_fields = []
    if not profile.district: missing_fields.append("district")
    if not profile.soil_type: missing_fields.append("soil_type")
    if not profile.drainage: missing_fields.append("drainage")
    if not profile.slope_percent: missing_fields.append("slope_percent")

    # 2. Candidate Retrieval (Dense + BM25)
    query_vec = embedder.embed_query(req.user_query)
    dense_results = vector_store.search(query_vec, top_k=settings.TOP_K_DENSE)
    bm25_results = bm25_searcher.search(req.user_query, top_k=settings.TOP_K_BM25)

    # 3. Fusion & Reranking
    fused = rrf_fusion.fuse(dense_results, bm25_results, top_k=settings.TOP_K_FUSED)
    reranked = reranker.rerank(req.user_query, fused, top_k=req.top_k)

    # 4. Map Evidence Chunks & Applicability Scoring
    retrieved_evidence = []
    technique_candidates = []

    for item in reranked:
        ev = RetrievedEvidenceChunk(
            chunk_id=item.get("chunk_id", ""),
            parent_chunk_id=item.get("parent_chunk_id"),
            document_id=item.get("document_id", ""),
            text=item.get("text", ""),
            title=item.get("title", ""),
            organization=item.get("organization", ""),
            section=item.get("section_heading"),
            page_start=item.get("page_start"),
            page_end=item.get("page_end"),
            source_url=item.get("source_url", ""),
            source_level=item.get("source_level", "telangana"),
            district=item.get("district"),
            state=item.get("state"),
            retrieval_scores=RetrievalScores(
                dense=item.get("dense_score", 0.0),
                bm25=item.get("bm25_score", 0.0),
                rrf=item.get("rrf_score", 0.0),
                reranker=item.get("reranker_score", 0.0)
            )
        )
        retrieved_evidence.append(ev)

        # Applicability
        tech_name = item.get("topic") or item.get("title", "Land Restoration Technique")
        candidate = applicability_engine.evaluate_technique(tech_name, item, profile)
        technique_candidates.append(candidate)

    # 5. Synthesize Answer
    answer, citations = synthesizer.synthesize(
        req.user_query, profile, missing_fields, retrieved_evidence, technique_candidates
    )

    return RAGResponse(
        query=req.user_query,
        parsed_query={"query": req.user_query},
        land_profile=profile,
        missing_critical_fields=missing_fields,
        retrieved_evidence=retrieved_evidence,
        technique_candidates=technique_candidates,
        answer=answer,
        citations=citations
    )

@app.get("/stats")
def get_stats():
    return {
        "total_documents": len(set(c["document_id"] for c in vector_store.chunks)),
        "total_chunks": len(vector_store.chunks),
        "vector_store_type": "Qdrant / In-Memory Fallback"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

