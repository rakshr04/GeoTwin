import sys
import io
from app.embeddings.embedder import Embedder
from app.vector_store.store import VectorStore
from app.bm25.searcher import BM25Searcher
from app.fusion.rrf import ReciprocalRankFusion

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def run_icar_retrieval_demo():
    print("=======================================================================")
    print("      LANDPATCH RAG RETRIEVAL TEST ON ICAR SOIL EROSION PDF          ")
    print("=======================================================================")

    embedder = Embedder()
    vector_store = VectorStore()
    bm25_searcher = BM25Searcher()
    rrf_fusion = ReciprocalRankFusion()

    query = "Land Degradation due to Water-Induced Soil Erosion in India ICAR Assessment"
    print(f"\nUser Query: '{query}'\n")

    # 1. Dense Search
    query_vec = embedder.embed_query(query)
    dense_results = vector_store.search(query_vec, top_k=5)

    # 2. BM25 Search
    bm25_results = bm25_searcher.search(query, top_k=5)

    # 3. Reciprocal Rank Fusion
    fused_results = rrf_fusion.fuse(dense_results, bm25_results, top_k=5)

    print(f"Top {len(fused_results)} Retrieved Chunks:")
    print("-----------------------------------------------------------------------")

    for idx, item in enumerate(fused_results, 1):
        doc_id = item.get("document_id", "N/A")
        title = item.get("title", item.get("exact_title", "N/A"))
        page_start = item.get("page_start", 1)
        page_end = item.get("page_end", 1)
        score = item.get("rrf_score", 0.0)
        snippet = item.get("text", "").strip()[:300].replace("\n", " ")

        print(f"[{idx}] Document ID: {doc_id}")
        print(f"    Title: {title}")
        print(f"    Pages: {page_start}-{page_end}")
        print(f"    RRF Fusion Score: {score:.4f}")
        print(f"    Text Snippet: {snippet}...")
        print("-----------------------------------------------------------------------")

if __name__ == "__main__":
    run_icar_retrieval_demo()
