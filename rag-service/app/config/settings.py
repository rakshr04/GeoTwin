import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION: str = "landpatch_chunks"

    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    RERANKER_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    TOP_K_DENSE: int = 20
    TOP_K_BM25: int = 20
    TOP_K_FUSED: int = 30
    TOP_K_RERANKED: int = 10

    CHILD_CHUNK_SIZE: int = 350
    PARENT_CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 60

    ENABLE_OCR: bool = True
    ENABLE_RERANKER: bool = False
    ENABLE_APPLICABILITY_FILTER: bool = True
    SOURCE_COLLECTION_USER_AGENT: str = "LandPatch-RAG-Bot/1.0"

    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    @property
    def DATA_DIR(self) -> str:
        return os.path.join(self.BASE_DIR, "data")

    @property
    def RAW_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "raw")

    @property
    def MANIFESTS_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "manifests")

    @property
    def EXTRACTED_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "extracted")

    @property
    def CLEANED_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "cleaned")

    @property
    def CHUNKS_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "chunks")

    @property
    def INDEXES_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "indexes")

    @property
    def EVALUATION_DIR(self) -> str:
        return os.path.join(self.DATA_DIR, "evaluation")

settings = Settings()
