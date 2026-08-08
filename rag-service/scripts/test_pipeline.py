import sys
import io
from app.schemas.rag_schemas import QueryRequest
from app.main import retrieve_and_answer

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def run_test_suite():
    print("=======================================================================")
    print("           LANDPATCH RAG SERVICE PIPELINE TEST SUITE                 ")
    print("=======================================================================\n")

    test_queries = [
        {
            "name": "TEST 1: ICAR Acid Soil Distribution & Management (NAT_ICAR_03)",
            "request": {
                "user_query": "What are the distribution patterns and management techniques for acid soils in India according to ICAR?",
                "country": "India",
                "soil_type": "acidic soil"
            }
        },
        {
            "name": "TEST 2: ICAR Wind Erosion in Arid Regions (NAT_ICAR_04)",
            "request": {
                "user_query": "What measures does ICAR recommend for sand dune stabilization and wind erosion control in arid regions?",
                "country": "India",
                "topic": "Wind erosion"
            }
        },
        {
            "name": "TEST 3: ICAR Degraded & Wastelands Mapping (NAT_ICAR_05)",
            "request": {
                "user_query": "What is the status and spatial distribution of degraded wastelands in India as mapped by ICAR and NAAS?",
                "country": "India",
                "topic": "Wasteland mapping"
            }
        },
        {
            "name": "TEST 4: Adversarial Safety Test (Black Cotton Soil vs Deep Trenching)",
            "request": {
                "user_query": "Can we build deep continuous infiltration trenches in Mahabubnagar black cotton clay soil?",
                "district": "Mahabubnagar",
                "state": "Telangana",
                "soil_type": "black cotton soil",
                "soil_texture": "heavy clay",
                "permeability": "low",
                "drainage": "poor",
                "slope_percent": 2.0,
                "waterlogging_risk": "high"
            }
        }
    ]

    for test in test_queries:
        print(f"-----------------------------------------------------------------------")
        print(f"📌 {test['name']}")
        print(f"Query: '{test['request']['user_query']}'")
        print(f"-----------------------------------------------------------------------")
        
        req = QueryRequest(**test["request"])
        res = retrieve_and_answer(req)

        print("\n--- RETRIEVED EVIDENCE CHUNKS ---")
        for idx, ev in enumerate(res.retrieved_evidence[:3], 1):
            print(f"[{idx}] Document ID: {ev.document_id} | Page: {ev.page_start} | Level: {ev.source_level.upper()}")
            print(f"    Text: {ev.text[:180].replace(chr(10), ' ')}...")

        print("\n--- TECHNIQUE APPLICABILITY EVALUATION ---")
        for c in res.technique_candidates[:3]:
            print(f"- Technique: {c.technique} | Status: {c.status}")
            if c.contraindications:
                print(f"  ⚠️ Contraindication Warning: {c.contraindications}")

        print(f"-----------------------------------------------------------------------\n")

if __name__ == "__main__":
    run_test_suite()
