import os
import json
from typing import List, Dict, Any, Optional
from rank_bm25 import BM25Okapi

class BM25Searcher:
    """BM25 keyword search index manager for MVP retrieval"""

    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.bm25: Optional[BM25Okapi] = None
        self.corpus_tokens: List[List[str]] = []
        self.index_file = os.path.join(os.path.dirname(__file__), "..", "..", "data", "indexes", "bm25_index.json")
        self.load()

    def build_index(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        self.corpus_tokens = [c["text"].lower().split() for c in chunks]
        if self.corpus_tokens:
            self.bm25 = BM25Okapi(self.corpus_tokens)
        else:
            self.bm25 = None
        self.save()

    def search(self, query: str, top_k: int = 20, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        if self.bm25 is None or not self.chunks:
            return []

        tokens = query.lower().split()
        scores = self.bm25.get_scores(tokens)

        filtered_indices = []
        for idx, chunk in enumerate(self.chunks):
            if self._matches_filter(chunk, filters):
                filtered_indices.append(idx)

        if not filtered_indices:
            return []

        filtered_scores = [(idx, scores[idx]) for idx in filtered_indices]
        filtered_scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in filtered_scores[:top_k]:
            c = dict(self.chunks[idx])
            c["bm25_score"] = float(score)
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
            json.dump({"chunks": self.chunks}, f)

    def load(self):
        if os.path.exists(self.index_file):
            with open(self.index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.chunks = data.get("chunks", [])
                if self.chunks:
                    self.corpus_tokens = [c["text"].lower().split() for c in self.chunks]
                    self.bm25 = BM25Okapi(self.corpus_tokens)
