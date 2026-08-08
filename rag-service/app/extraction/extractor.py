import os
import json
import fitz  # PyMuPDF
from typing import List, Dict, Any

class DocumentExtractor:
    """Page-aware text extraction for PDF, DOCX, TXT, HTML"""
    
    def extract(self, filepath: str, document_id: str) -> List[Dict[str, Any]]:
        ext = os.path.splitext(filepath)[1].lower()
        if ext == ".pdf":
            return self._extract_pdf(filepath, document_id)
        elif ext in [".txt", ".md"]:
            return self._extract_txt(filepath, document_id)
        elif ext in [".html", ".htm"]:
            return self._extract_html(filepath, document_id)
        else:
            return self._extract_txt(filepath, document_id)

    def _extract_pdf(self, filepath: str, document_id: str) -> List[Dict[str, Any]]:
        pages = []
        doc = fitz.open(filepath)
        for i, page in enumerate(doc):
            page_num = i + 1
            text = page.get_text("text")
            # If text extraction is very short, flag potential image/OCR need
            pages.append({
                "document_id": document_id,
                "page_num": page_num,
                "text": text,
                "char_count": len(text.strip()),
                "tables": []
            })
        doc.close()
        return pages

    def _extract_txt(self, filepath: str, document_id: str) -> List[Dict[str, Any]]:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [{
            "document_id": document_id,
            "page_num": 1,
            "text": text,
            "char_count": len(text.strip()),
            "tables": []
        }]

    def _extract_html(self, filepath: str, document_id: str) -> List[Dict[str, Any]]:
        from bs4 import BeautifulSoup
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(separator="\n")
        return [{
            "document_id": document_id,
            "page_num": 1,
            "text": text,
            "char_count": len(text.strip()),
            "tables": []
        }]
