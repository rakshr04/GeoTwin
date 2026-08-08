import os
import json
from typing import List, Dict, Any, Optional
import numpy as np

class VectorStore:
    """
    Vector Store wrapper supporting Qdrant and lightweight FAISS/In-Memory fallback for local development
    """

    def __init__(self, collection_name: str = "landpatch_chunks"):
        self.collection_name = collection_name
        self.chunks: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        self.index_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "indexes", "vector_store.json")
        self.load()

    def add_chunks(self, chunks: List[Dict[str, Any]], vector_embeddings: List[List[float]]):
        self.chunks.extend(chunks)
        new_vecs = np.array(vector_embeddings, dtype=np.float32)
        if self.embeddings is None or len(self.embeddings) == 0:
            self.embeddings = new_vecs
        else:
            self.embeddings = np.vstack([self.embeddings, new_vecs])
        self.save()

    def search(self, query_vector: List[float], top_k: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self.embeddings is None or len(self.embeddings) == 0 or len(self.chunks) == 0:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        # Cosine similarity (since embeddings are normalized)
        sims = np.dot(self.embeddings, q_vec)

        # Apply metadata pre-filtering if specified
        filtered_indices = []
        for idx, chunk in enumerate(self.chunks):
            if self._matches_filter(chunk, filters):
                filtered_indices.append(idx)

        if not filtered_indices:
            return []

        # Sort filtered by similarity score descending
        filtered_sims = [(idx, sims[idx]) for idx in filtered_indices]
        filtered_sims.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in filtered_sims[:top_k]:
            c = dict(self.chunks[idx])
            c["dense_score"] = float(score)
            results.append(c)

        return results

    def _matches_filter(self, chunk: Dict[str, Any], filters: Optional[Dict[str, Any]]) -> bool:
        if not filters:
            return True
        for k, v in filters.items():
            if v is not None and chunk.get(k) != v:
                return False
        return True

    def save(self):
        os.makedirs(os.path.dirname(self.index_file), exist_ok=True)
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump({
                "chunks": self.chunks,
                "embeddings": self.embeddings.tolist() if self.embeddings is not None else []
            }, f)

    def load(self):
        if os.path.exists(self.index_file):
            with open(self.index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.chunks = data.get("chunks", [])
                vecs = data.get("embeddings", [])
                if vecs:
                    self.embeddings = np.array(vecs, dtype=np.float32)
                else:
                    self.embeddings = None
