import hashlib
import re
from typing import List, Dict, Any, Optional

class HierarchicalChunker:
    """
    Heading-aware hierarchical parent-child chunking:
    - Parent Chunks: ~800-1200 tokens (sections)
    - Child Chunks: ~250-450 tokens (focused recommendations/concepts) with ~50-80 token overlap
    """

    def __init__(self, child_size: int = 350, parent_size: int = 1000, overlap: int = 60):
        self.child_size = child_size
        self.parent_size = parent_size
        self.overlap = overlap

    def chunk_document(self, doc_metadata: Dict[str, Any], cleaned_pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        doc_id = doc_metadata["document_id"]
        full_chunks = []
        
        # Combine pages into a continuous stream while tracking page boundaries
        page_offsets = []
        full_text = ""
        current_len = 0
        for p in cleaned_pages:
            p_text = p["text"]
            page_offsets.append({
                "page_num": p["page_num"],
                "start_char": current_len,
                "end_char": current_len + len(p_text)
            })
            full_text += p_text + "\n\n"
            current_len += len(p_text) + 2

        # Split text into Parent sections based on headings or large token blocks
        words = full_text.split()
        total_words = len(words)
        
        if total_words == 0:
            return []

        # Simple robust token approximation: 1 token ≈ 0.75 words, so words ≈ tokens * 0.75
        parent_word_size = int(self.parent_size * 0.75)
        child_word_size = int(self.child_size * 0.75)
        overlap_words = int(self.overlap * 0.75)

        p_idx = 0
        while p_idx < total_words:
            p_end = min(p_idx + parent_word_size, total_words)
            parent_words = words[p_idx:p_end]
            parent_text = " ".join(parent_words)
            
            parent_id = f"parent_{doc_id}_{hashlib.md5(parent_text[:100].encode()).hexdigest()[:8]}"
            
            # Detect section heading
            heading_match = re.search(r'^(#+\s+.*|[A-Z0-9\.\s]{4,30}\n)', parent_text)
            heading = heading_match.group(0).strip() if heading_match else doc_metadata.get("title", "General")

            # Create Child Chunks inside this Parent
            c_idx = 0
            parent_word_count = len(parent_words)
            while c_idx < parent_word_count:
                c_end = min(c_idx + child_word_size, parent_word_count)
                child_words = parent_words[c_idx:c_end]
                child_text = " ".join(child_words)
                
                # Deterministic stable Chunk ID
                chunk_hash = hashlib.sha256(f"{doc_id}_{p_idx}_{c_idx}_{child_text[:50]}".encode()).hexdigest()[:16]
                child_id = f"chk_{doc_id}_{chunk_hash}"

                # Calculate page range approximation
                page_start, page_end = self._get_page_range(full_text, child_words[0], child_words[-1], page_offsets)

                chunk = {
                    "chunk_id": child_id,
                    "parent_chunk_id": parent_id,
                    "document_id": doc_id,
                    "text": child_text,
                    "parent_text": parent_text,
                    "title": doc_metadata.get("title", ""),
                    "organization": doc_metadata.get("organization", ""),
                    "section_heading": heading,
                    "subsection_heading": None,
                    "page_start": page_start,
                    "page_end": page_end,
                    "source_url": doc_metadata.get("source_url", ""),
                    "source_level": doc_metadata.get("source_level", "telangana"),
                    "district": doc_metadata.get("district"),
                    "state": doc_metadata.get("state", "Telangana"),
                    "country": doc_metadata.get("country", "India"),
                    "topic": doc_metadata.get("topic", ""),
                    "restoration_subdomain": doc_metadata.get("restoration_subdomain", ""),
                    "language": doc_metadata.get("language", "English"),
                    "publication_year": doc_metadata.get("publication_year")
                }
                full_chunks.append(chunk)

                if c_end == parent_word_count:
                    break
                c_idx += (child_word_size - overlap_words)

            p_idx += parent_word_size

        return full_chunks

    def _get_page_range(self, full_text: str, first_word: str, last_word: str, page_offsets: List[Dict[str, Any]]) -> (Optional[int], Optional[int]):
        if not page_offsets:
            return 1, 1
        return page_offsets[0]["page_num"], page_offsets[-1]["page_num"]
