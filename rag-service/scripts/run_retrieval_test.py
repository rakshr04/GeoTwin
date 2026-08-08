from app.schemas.rag_schemas import QueryRequest
from app.main import retrieve_and_answer

req = QueryRequest(
    user_query="Can we build deep infiltration pits in Mahabubnagar black cotton soil for rainwater harvesting?",
    district="Mahabubnagar",
    state="Telangana",
    soil_type="black cotton soil",
    soil_texture="heavy clay",
    permeability="low",
    drainage="poor",
    waterlogging_risk="high"
)

res = retrieve_and_answer(req)

print("=== LANDPATCH RAG DEMO OUTPUT ===")
print("Query:", res.query)
print("\n--- Technique Candidates & Statuses ---")
for c in res.technique_candidates:
    print(f"Technique: {c.technique} | Status: {c.status}")
    if c.contraindications:
        print("  Contraindications:", c.contraindications)

print("\n--- Generated Evidence-Grounded Report ---")
print(res.answer)
