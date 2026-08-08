from typing import List, Dict, Any

class ReciprocalRankFusion:
    """Combines dense semantic and BM25 keyword rankings using Reciprocal Rank Fusion (RRF)"""

    def __init__(self, k: int = 60):
        self.k = k

    def fuse(self, dense_results: List[Dict[str, Any]], bm25_results: List[Dict[str, Any]], top_k: int = 30) -> List[Dict[str, Any]]:
        scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}

        # Process dense results
        for rank, item in enumerate(dense_results):
            cid = item["chunk_id"]
            chunk_map[cid] = item
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (self.k + (rank + 1)))

        # Process BM25 results
        for rank, item in enumerate(bm25_results):
            cid = item["chunk_id"]
            if cid not in chunk_map:
                chunk_map[cid] = item
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (self.k + (rank + 1)))

        # Sort combined candidates by RRF score descending
        fused = []
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        for cid in sorted_ids[:top_k]:
            item = dict(chunk_map[cid])
            item["rrf_score"] = scores[cid]
            fused.append(item)

        return fused
