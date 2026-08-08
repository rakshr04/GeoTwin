from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np
from app.config.settings import settings

class Embedder:
    """SentenceTransformers wrapper with caching and batching support"""

    def __init__(self, model_name: str = settings.EMBEDDING_MODEL):
        self.model_name = model_name
        self.model = SentenceTransformer(model_name, device="cpu")

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        embeddings = self.model.encode(texts, batch_size=32, show_progress_bar=False, normalize_embeddings=True)
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        return self.embed_texts([query])[0]
