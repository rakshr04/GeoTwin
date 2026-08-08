from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class LandProfile(BaseModel):
    district: Optional[str] = Field(default=None, description="Target district e.g. Mahabubnagar")
    state: Optional[str] = Field(default="Telangana", description="State name")
    country: Optional[str] = Field(default="India", description="Country name")
    goal: Optional[str] = Field(default=None, description="Restoration goal e.g. agroforestry restoration")
    soil_type: Optional[str] = Field(default=None, description="e.g. black cotton soil, red loamy soil")
    soil_texture: Optional[str] = Field(default=None, description="e.g. heavy clay, sandy loam")
    permeability: Optional[str] = Field(default=None, description="e.g. low, moderate, high")
    drainage: Optional[str] = Field(default=None, description="e.g. poor, moderate, well-drained")
    slope_percent: Optional[float] = Field(default=None, description="Slope percentage")
    annual_rainfall_mm: Optional[float] = Field(default=None, description="Annual rainfall in mm")
    erosion_type: Optional[str] = Field(default=None, description="e.g. sheet erosion, rill erosion, gully erosion")
    land_use: Optional[str] = Field(default=None, description="e.g. rainfed agriculture, wasteland")
    waterlogging_risk: Optional[str] = Field(default=None, description="e.g. high, medium, low")
    groundwater_condition: Optional[str] = Field(default=None, description="Groundwater depth or condition")
    live_weather: Optional[Dict[str, Any]] = Field(default=None, description="Live weather metrics injected from an external API")

class RetrievalScores(BaseModel):
    dense: float = 0.0
    bm25: float = 0.0
    rrf: float = 0.0
    reranker: float = 0.0
    locality: float = 0.0
    applicability: float = 0.0
    final: float = 0.0

class RetrievedEvidenceChunk(BaseModel):
    chunk_id: str
    parent_chunk_id: Optional[str] = None
    document_id: str
    text: str
    title: str
    organization: str
    section: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    source_url: str
    source_level: str  # telangana, national, global
    district: Optional[str] = None
    state: Optional[str] = None
    retrieval_scores: RetrievalScores = Field(default_factory=RetrievalScores)

class TechniqueCandidate(BaseModel):
    technique: str
    status: str  # supported_local, supported_state, supported_national_match, conditional_global_match, insufficient_data, needs_field_validation, needs_engineering_review, contraindicated, rejected_mismatch
    matched_conditions: List[str] = []
    mismatched_conditions: List[str] = []
    missing_conditions: List[str] = []
    contraindications: List[str] = []
    risk_flags: List[str] = []
    supporting_chunk_ids: List[str] = []
    validation_requirements: List[str] = []
    local_validation_required: bool = True
    expert_review_required: bool = False
    applicability_components: Dict[str, float] = {}

class QueryRequest(BaseModel):
    user_query: str
    district: Optional[str] = None
    state: Optional[str] = "Telangana"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    restoration_goal: Optional[str] = None
    soil_type: Optional[str] = None
    soil_texture: Optional[str] = None
    permeability: Optional[str] = None
    drainage: Optional[str] = None
    slope_percent: Optional[float] = None
    annual_rainfall_mm: Optional[float] = None
    erosion_type: Optional[str] = None
    land_use: Optional[str] = None
    groundwater_condition: Optional[str] = None
    waterlogging_risk: Optional[str] = None
    top_k: int = 10

class RAGResponse(BaseModel):
    query: str
    parsed_query: Dict[str, Any] = {}
    land_profile: LandProfile
    missing_critical_fields: List[str] = []
    retrieved_evidence: List[RetrievedEvidenceChunk] = []
    technique_candidates: List[TechniqueCandidate] = []
    answer: str
    citations: List[Dict[str, Any]] = []
