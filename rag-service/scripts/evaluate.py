import json
import os
from app.schemas.rag_schemas import QueryRequest
from app.main import retrieve_and_answer

def run_evaluation():
    print("Running LandPatch Evaluation Benchmark Suite (50+ Cases)...")

    # Generate 50 evaluation test cases including adversarial cases
    test_cases = generate_50_test_cases()
    results = []

    passed_contraindications = 0
    total_adversarial = 0

    for idx, tc in enumerate(test_cases, 1):
        req = QueryRequest(**tc["request"])
        res = retrieve_and_answer(req)

        is_adversarial = tc.get("is_adversarial", False)
        if is_adversarial:
            total_adversarial += 1
            # Check if any candidate was correctly marked contraindicated or rejected_mismatch
            contra_found = any(c.status in ["contraindicated", "rejected_mismatch"] for c in res.technique_candidates)
            if contra_found:
                passed_contraindications += 1

        results.append({
            "case_id": idx,
            "query": tc["request"]["user_query"],
            "district": tc["request"]["district"],
            "soil_type": tc["request"]["soil_type"],
            "retrieved_count": len(res.retrieved_evidence),
            "candidates_count": len(res.technique_candidates),
            "is_adversarial": is_adversarial,
            "adversarial_passed": contra_found if is_adversarial else True
        })

    print(f"\n--- Benchmark Results ---")
    print(f"Total Cases Evaluated: {len(results)}")
    print(f"Adversarial Contraindication Test Pass Rate: {passed_contraindications}/{total_adversarial} ({passed_contraindications/total_adversarial*100:.1f}%)")

    os.makedirs(os.path.join(os.path.dirname(__file__), "..", "data", "evaluation"), exist_ok=True)
    report_file = os.path.join(os.path.dirname(__file__), "..", "data", "evaluation", "evaluation_report.json")
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump({
            "total_cases": len(results),
            "adversarial_pass_rate": passed_contraindications / max(total_adversarial, 1),
            "results": results
        }, f, indent=2)

    print(f"Evaluation report saved to {report_file}")

def generate_50_test_cases():
    cases = []
    
    # 1. Mandatory Adversarial Case: WOCAT semi-arid sandy vs Mahabubnagar black cotton soil
    cases.append({
        "is_adversarial": True,
        "request": {
            "user_query": "Can we build deep infiltration percolation pits in Mahabubnagar black cotton soil for rainwater harvesting based on semi-arid dryland techniques?",
            "district": "Mahabubnagar",
            "state": "Telangana",
            "soil_type": "black cotton soil",
            "soil_texture": "heavy clay",
            "permeability": "low",
            "drainage": "poor",
            "slope_percent": 2.0,
            "annual_rainfall_mm": 620,
            "erosion_type": "sheet erosion",
            "land_use": "rainfed agriculture",
            "waterlogging_risk": "high"
        }
    })

    # Generate 49 additional varied cases across Telangana districts and restoration subdomains
    districts = ["Mahabubnagar", "Nalgonda", "Ranga Reddy", "Warangal", "Karimnagar", "Khammam", "Adilabad"]
    soils = ["black cotton soil", "red loamy soil", "sandy soil", "shallow gravelly soil"]
    subdomains = ["sheet erosion", "rill erosion", "gully erosion", "ridge-to-valley planning", "farm ponds", "contour bunds", "check dams", "agroforestry"]

    for i in range(2, 51):
        dist = districts[i % len(districts)]
        soil = soils[i % len(soils)]
        sub = subdomains[i % len(subdomains)]
        cases.append({
            "is_adversarial": False,
            "request": {
                "user_query": f"Recommended soil conservation measures for {sub} in {dist} on {soil}",
                "district": dist,
                "state": "Telangana",
                "soil_type": soil,
                "drainage": "moderate" if "red" in soil else "poor",
                "slope_percent": 3.0,
                "annual_rainfall_mm": 750,
                "erosion_type": sub if "erosion" in sub else "sheet erosion",
                "land_use": "rainfed agriculture"
            }
        })

    return cases

if __name__ == "__main__":
    run_evaluation()
