import re
from typing import Dict, Any, List

class MetadataExtractor:
    """Extracts explicit restoration applicability attributes from text chunks without hallucinating missing fields."""

    SOIL_TYPES = ["black cotton soil", "red loamy soil", "sandy soil", "laterite soil", "alluvial soil", "clay soil", "loam"]
    PERMEABILITY_TYPES = ["low", "moderate", "high", "very low", "very high"]
    DRAINAGE_TYPES = ["poor", "moderate", "well-drained", "excessively drained", "impeded"]
    EROSION_TYPES = ["sheet erosion", "rill erosion", "gully erosion", "wind erosion", "coastal erosion"]

    def extract_attributes(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        text = chunk["text"].lower()

        extracted = {
            "technique_name": self._extract_technique_name(text),
            "technique_category": chunk.get("restoration_subdomain"),
            "restoration_subdomain": chunk.get("restoration_subdomain"),
            "evidence_type": "official_manual",
            "evidence_region": chunk.get("district") or chunk.get("state") or chunk.get("country"),
            "evidence_level": chunk.get("source_level"),
            "country": chunk.get("country"),
            "state": chunk.get("state"),
            "district": chunk.get("district"),
            "soil_type": self._match_keyword(text, self.SOIL_TYPES),
            "soil_texture": self._extract_texture(text),
            "permeability": self._extract_field(text, "permeability", self.PERMEABILITY_TYPES),
            "drainage": self._extract_field(text, "drainage", self.DRAINAGE_TYPES),
            "waterlogging_risk": "high" if "waterlogging" in text or "water-logged" in text else None,
            "slope_min_percent": self._extract_numeric_range(text, r'slope[s]?\s*(?:of|between)?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*%')[0],
            "slope_max_percent": self._extract_numeric_range(text, r'slope[s]?\s*(?:of|between)?\s*(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*%')[1],
            "annual_rainfall_min_mm": self._extract_rainfall(text)[0],
            "annual_rainfall_max_mm": self._extract_rainfall(text)[1],
            "erosion_type": self._match_keyword(text, self.EROSION_TYPES),
            "land_use": "rainfed agriculture" if "rainfed" in text else None,
            "contraindications": self._extract_contraindications(text)
        }
        return extracted

    def _match_keyword(self, text: str, keywords: List[str]) -> str | None:
        for kw in keywords:
            if kw in text:
                return kw
        return None

    def _extract_texture(self, text: str) -> str | None:
        textures = ["heavy clay", "clay loam", "sandy clay", "sandy loam", "loam", "silt loam"]
        return self._match_keyword(text, textures)

    def _extract_field(self, text: str, field_name: str, valid_values: List[str]) -> str | None:
        for val in valid_values:
            if f"{val} {field_name}" in text or f"{field_name} is {val}" in text or f"{field_name}: {val}" in text:
                return val
        return None

    def _extract_numeric_range(self, text: str, pattern: str) -> (float | None, float | None):
        match = re.search(pattern, text)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                pass
        return None, None

    def _extract_rainfall(self, text: str) -> (float | None, float | None):
        match = re.search(r'(\d{3,4})\s*(?:to|-)\s*(\d{3,4})\s*mm', text)
        if match:
            return float(match.group(1)), float(match.group(2))
        return None, None

    def _extract_technique_name(self, text: str) -> str | None:
        techniques = ["contour bund", "check dam", "nala bund", "farm pond", "contour trench", "vegetative barrier", "recharge pit", "mulching", "percolation tank", "agroforestry"]
        for tech in techniques:
            if tech in text:
                return tech
        return None

    def _extract_contraindications(self, text: str) -> List[str]:
        contraindications = []
        if "avoid on" in text or "not suitable for" in text or "unsuitable in" in text or "do not build on" in text:
            match = re.search(r'(?:avoid on|not suitable for|unsuitable in|do not build on)\s+([^.\n]+)', text)
            if match:
                contraindications.append(match.group(1).strip())
        return contraindications
