from typing import Dict, Any, List

class CitationValidator:
    """Validates citations to ensure claims are grounded and page numbers are preserved."""

    def validate_citation(self, citation: Dict[str, Any], source_chunk: Dict[str, Any]) -> Dict[str, Any]:
        is_valid = True
        reasons = []

        if citation.get("document_id") != source_chunk.get("document_id"):
            is_valid = False
            reasons.append("Document ID mismatch")

        if source_chunk.get("page_start") is not None and citation.get("page_start") is None:
            is_valid = False
            reasons.append("Missing page number when source contains page metadata")

        return {
            "citation": citation,
            "is_valid": is_valid,
            "reasons": reasons
        }
