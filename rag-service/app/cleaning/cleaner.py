import re
import unicodedata
from typing import List, Dict, Any

class TextCleaner:
    """Header/footer removal, hyphenation repair, unicode normalization, whitespace cleanup"""

    def clean_pages(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned_pages = []
        for p in pages:
            text = p["text"]
            text = self.normalize_unicode(text)
            text = self.repair_hyphenation(text)
            text = self.clean_headers_footers(text)
            text = self.cleanup_whitespace(text)
            cleaned_pages.append({
                **p,
                "text": text,
                "char_count": len(text)
            })
        return cleaned_pages

    def normalize_unicode(self, text: str) -> str:
        return unicodedata.normalize("NFKC", text)

    def repair_hyphenation(self, text: str) -> str:
        # e.g. "water-\nshed" -> "watershed"
        return re.sub(r'(\w+)-\n(\w+)', r'\1\2', text)

    def clean_headers_footers(self, text: str) -> str:
        lines = text.split("\n")
        filtered = []
        for line in lines:
            sline = line.strip()
            # Filter obvious page footer patterns like "Page 12 of 45" or header repeats
            if re.match(r'^Page\s+\d+(\s+of\s+\d+)?$', sline, re.IGNORECASE):
                continue
            filtered.append(line)
        return "\n".join(filtered)

    def cleanup_whitespace(self, text: str) -> str:
        # Replace multiple horizontal spaces but preserve single newlines
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
