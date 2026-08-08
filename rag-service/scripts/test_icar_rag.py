import sys
import io
from app.schemas.rag_schemas import QueryRequest
from app.main import retrieve_and_answer

# Set stdout encoding to UTF-8 to prevent Windows cp1252 console crashes
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_icar_rag():
    print("=== TESTING LANDPATCH RAG PIPELINE ON ICAR SOIL EROSION PDF (NAT_ICAR_01) ===")
    
    queries = [
        QueryRequest(
            user_query="What are the main causes and spatial distribution of water-induced soil erosion in India according to ICAR?",
            country="India",
            topic="Water erosion"
        ),
        QueryRequest(
            user_query="What soil conservation and runoff management techniques does ICAR recommend for sheet and rill erosion?",
            country="India",
            soil_type="loam",
            erosion_type="sheet erosion"
        )
    ]

    for i, req in enumerate(queries, 1):
        print(f"\n----------------------------------------------------------------------")
        print(f"QUERY {i}: {req.user_query}")
        print(f"----------------------------------------------------------------------")
        
        res = retrieve_and_answer(req)
        
        print("\n--- RETRIEVED TECHNIQUE CANDIDATES & STATUSES ---")
        for c in res.technique_candidates:
            print(f"- Technique: {c.technique} | Status: {c.status}")
            if c.contraindications:
                print(f"  Contraindications: {c.contraindications}")

        print("\n--- GENERATED EVIDENCE-GROUNDED REPORT ---")
        print(res.answer)
        print("----------------------------------------------------------------------\n")

if __name__ == "__main__":
    test_icar_rag()
