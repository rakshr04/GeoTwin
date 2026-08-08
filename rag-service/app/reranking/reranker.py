from typing import List, Dict, Any
from sentence_transformers import CrossEncoder
from app.config.settings import settings

class CrossEncoderReranker:
    """Reranks candidates using a SentenceTransformers CrossEncoder"""

    def __init__(self, model_name: str = settings.RERANKER_MODEL):
        self.model_name = model_name
        self.model = None

    def _ensure_model(self):
        if self.model is None:
            self.model = CrossEncoder(self.model_name)

    def rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int = 10) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        if not settings.ENABLE_RERANKER:
            for c in candidates:
                c["reranker_score"] = c.get("rrf_score", 0.0)
            return candidates[:top_k]

        try:
            self._ensure_model()
            pairs = [[query, c["text"]] for c in candidates]
            scores = self.model.predict(pairs)

            for idx, score in enumerate(scores):
                candidates[idx]["reranker_score"] = float(score)

            candidates.sort(key=lambda x: x.get("reranker_score", 0.0), reverse=True)
        except Exception:
            # Fallback if cross-encoder fails or is disabled
            for c in candidates:
                c["reranker_score"] = c.get("rrf_score", 0.0)

        return candidates[:top_k]
