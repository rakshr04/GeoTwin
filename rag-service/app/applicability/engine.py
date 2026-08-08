from typing import Dict, Any, List, Optional
from app.schemas.rag_schemas import LandProfile, TechniqueCandidate

class ApplicabilityEngine:
    """
    Deterministic land-restoration applicability engine.
    Evaluates technique compatibility against local site physical parameters.
    Enforces strict hard contraindication rules (e.g. Mahabubnagar black cotton soil vs WOCAT sandy soil).
    """

    def evaluate_technique(
        self,
        technique_name: str,
        source_metadata: Dict[str, Any],
        profile: LandProfile
    ) -> TechniqueCandidate:
        matched = []
        mismatched = []
        missing = []
        contraindications = []
        risk_flags = []
        validation_reqs = []

        # 1. Locality & Authority Evaluation
        source_level = source_metadata.get("source_level", "global")
        district_match = (profile.district and source_metadata.get("district") and profile.district.lower() == source_metadata.get("district").lower())
        state_match = (profile.state and source_metadata.get("state") and profile.state.lower() == source_metadata.get("state").lower())

        if district_match:
            locality_score = 1.0
            matched.append(f"District match: {profile.district}")
        elif state_match:
            locality_score = 0.8
            matched.append(f"State match: {profile.state}")
        elif source_level == "national":
            locality_score = 0.5
            matched.append("National Indian evidence")
        else:
            locality_score = 0.2
            matched.append("Global supplementary evidence")

        # 2. Hard Contraindication Rule 1: Heavy Black Cotton Soil vs Sandy High-Permeability Water Retaining Techniques
        site_soil = (profile.soil_type or "").lower()
        site_texture = (profile.soil_texture or "").lower()
        site_drainage = (profile.drainage or "").lower()
        site_waterlogging = (profile.waterlogging_risk or "").lower()

        src_soil = (source_metadata.get("soil_type") or "").lower()
        src_permeability = (source_metadata.get("permeability") or "").lower()

        is_black_cotton = "black cotton" in site_soil or "clay" in site_texture or "black" in site_soil
        is_poor_drainage = "poor" in site_drainage or site_waterlogging == "high"
        src_is_sandy = "sandy" in src_soil or "high" in src_permeability or "permeable" in src_soil

        if is_black_cotton and is_poor_drainage and src_is_sandy:
            contraindications.append(
                "HARD CONTRAINDICATION: Technique specified for highly permeable/sandy soils. "
                "Applying to heavy black cotton clay soil with poor drainage creates high risk of severe waterlogging, "
                "structural failure, swelling, and cracking."
            )
            mismatched.append("Soil texture & permeability severe mismatch (Black Cotton vs Sandy/High Permeability)")

        # 3. Parameter Matching & Scoring
        soil_match_score = 1.0 if (src_soil and site_soil and src_soil in site_soil) else 0.5
        drainage_match_score = 1.0 if not is_poor_drainage else 0.3
        
        # 4. Critical Data Check
        if not profile.district:
            missing.append("district")
        if not profile.soil_type:
            missing.append("soil_type")
        if not profile.drainage:
            missing.append("drainage")
        if not profile.slope_percent:
            missing.append("slope_percent")

        # 5. Status Determination
        if contraindications:
            status = "contraindicated"
        elif missing:
            status = "insufficient_data"
        elif district_match:
            status = "supported_local"
        elif state_match:
            status = "supported_state"
        elif source_level == "national" and soil_match_score >= 0.8:
            status = "supported_national_match"
        elif source_level == "global":
            status = "conditional_global_match"
            validation_reqs.append("Local field trial and agro-climatic zone validation required before implementation.")
        else:
            status = "needs_field_validation"

        if "check dam" in technique_name.lower() or "nala bund" in technique_name.lower():
            validation_reqs.append("Expert engineering review required for hydrologic and structural sizing.")

        components = {
            "locality_score": locality_score,
            "soil_match_score": soil_match_score,
            "drainage_match_score": drainage_match_score,
            "contraindication_penalty": -1.0 if contraindications else 0.0,
            "missing_data_penalty": -0.2 * len(missing)
        }

        return TechniqueCandidate(
            technique=technique_name,
            status=status,
            matched_conditions=matched,
            mismatched_conditions=mismatched,
            missing_conditions=missing,
            contraindications=contraindications,
            risk_flags=risk_flags,
            supporting_chunk_ids=[source_metadata.get("chunk_id", "")],
            validation_requirements=validation_reqs,
            local_validation_required=True,
            expert_review_required="check dam" in technique_name.lower() or "nala bund" in technique_name.lower(),
            applicability_components=components
        )
