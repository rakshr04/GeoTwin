from typing import List, Dict, Any
from app.schemas.rag_schemas import LandProfile, TechniqueCandidate, RetrievedEvidenceChunk

class AnswerSynthesizer:
    """Synthesizes structured evidence-grounded answers complying with the 8-section RAG Answer Contract"""

    def synthesize(
        self,
        query: str,
        profile: LandProfile,
        missing_fields: List[str],
        evidence: List[RetrievedEvidenceChunk],
        candidates: List[TechniqueCandidate]
    ) -> (str, List[Dict[str, Any]]):

        citations = []
        for idx, ev in enumerate(evidence, 1):
            citations.append({
                "citation_id": f"[{idx}]",
                "document_id": ev.document_id,
                "title": ev.title,
                "organization": ev.organization,
                "page_start": ev.page_start,
                "page_end": ev.page_end,
                "source_url": ev.source_url,
                "source_level": ev.source_level,
                "district": ev.district,
                "state": ev.state
            })

        # Build 8 sections
        sec1 = f"### 1. Site Information Used\n- **District**: {profile.district or 'Not specified'}\n- **State**: {profile.state or 'Telangana'}\n- **Soil Type**: {profile.soil_type or 'Not specified'}\n- **Soil Texture**: {profile.soil_texture or 'Not specified'}\n- **Drainage**: {profile.drainage or 'Not specified'}\n- **Permeability**: {profile.permeability or 'Not specified'}\n- **Slope**: {profile.slope_percent}% if specified else 'Not specified'\n- **Rainfall**: {profile.annual_rainfall_mm} mm if specified else 'Not specified'\n"
        
        sec2 = "### 2. Missing Critical Information\n" + ("\n".join([f"- Missing critical field: `{f}`" for f in missing_fields]) if missing_fields else "- None. All critical fields provided.") + "\n"

        sec3 = "### 3. Retrieved Evidence\n"
        for idx, ev in enumerate(evidence, 1):
            page_info = f"pp. {ev.page_start}-{ev.page_end}" if ev.page_start else "Page unknown"
            sec3 += f"- **[{idx}]** *{ev.title}* ({ev.organization}, {page_info}) - Source Level: **{ev.source_level.upper()}**\n  > \"{ev.text[:200]}...\"\n"

        sec4 = "### 4. Applicability Assessment\n"
        for c in candidates:
            sec4 += f"- **Technique**: {c.technique} | **Status**: `{c.status}`\n"
            if c.contraindications:
                sec4 += f"  - ⚠️ **Contraindications**: {'; '.join(c.contraindications)}\n"

        sec5 = "### 5. Recommended Candidates\n"
        recs = [c for c in candidates if c.status in ["supported_local", "supported_state", "supported_national_match"]]
        if recs:
            for r in recs:
                sec5 += f"- **{r.technique}** (Status: `{r.status}`)\n"
        else:
            sec5 += "- No fully supported local/state candidates identified under current evidence and site constraints.\n"

        sec6 = "### 6. Rejected or Risky Candidates\n"
        rejected = [c for c in candidates if c.status in ["contraindicated", "rejected_mismatch"]]
        if rejected:
            for r in rejected:
                sec6 += f"- ❌ **{r.technique}** - **Reason**: {'; '.join(r.contraindications or r.mismatched_conditions)}\n"
        else:
            sec6 += "- None.\n"

        sec7 = "### 7. Validation Requirements\n- Site-specific ground validation required.\n- Local agro-climatic zone verification.\n- Engineering hydrologic design review for structural measures.\n"

        sec8 = "### 8. Sources\n"
        for cit in citations:
            sec8 += f"- **{cit['citation_id']}** {cit['title']}. {cit['organization']}. ({cit['source_level']}). URL: {cit['source_url']}\n"

        full_answer = f"# Land-Restoration RAG Decision Support Report\n\n**Query**: {query}\n\n" + "\n".join([sec1, sec2, sec3, sec4, sec5, sec6, sec7, sec8])
        return full_answer, citations
