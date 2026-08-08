import csv
import hashlib
import os
import urllib.parse
from typing import List, Dict, Any, Optional
import requests
from app.config.settings import settings

MANIFEST_FIELDS = [
    "document_id", "title", "organization", "authors", "publication_year",
    "publication_date", "source_url", "final_url", "source_level", "state",
    "district", "country", "language", "topic", "restoration_subdomain",
    "document_type", "filename", "SHA-256", "page_count", "file_size",
    "text_quality", "scanned_pdf", "OCR_required", "license_or_reuse_status",
    "download_date", "review_status", "ingestion_status"
]

class ManifestManager:
    def __init__(self):
        os.makedirs(settings.MANIFESTS_DIR, exist_ok=True)
        self.sources_csv = os.path.join(settings.MANIFESTS_DIR, "sources.csv")
        self.failed_downloads_csv = os.path.join(settings.MANIFESTS_DIR, "failed_downloads.csv")
        self.duplicates_csv = os.path.join(settings.MANIFESTS_DIR, "duplicates.csv")
        self.review_required_csv = os.path.join(settings.MANIFESTS_DIR, "review_required.csv")
        self.licensing_review_csv = os.path.join(settings.MANIFESTS_DIR, "licensing_review.csv")
        self._ensure_manifests()

    def _ensure_manifests(self):
        for filepath in [self.sources_csv, self.failed_downloads_csv, self.duplicates_csv, self.review_required_csv, self.licensing_review_csv]:
            if not os.path.exists(filepath):
                with open(filepath, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(MANIFEST_FIELDS)

    def load_sources(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.sources_csv):
            return []
        with open(self.sources_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def save_sources(self, sources: List[Dict[str, Any]]):
        with open(self.sources_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS)
            writer.writeheader()
            for s in sources:
                writer.writerow(s)

    def record_failed(self, record: Dict[str, Any]):
        with open(self.failed_downloads_csv, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS)
            writer.writerow(record)

    def record_duplicate(self, record: Dict[str, Any]):
        with open(self.duplicates_csv, "a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=MANIFEST_FIELDS)
            writer.writerow(record)

def calculate_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()
