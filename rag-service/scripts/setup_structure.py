import os
import json
import csv
from typing import List, Dict, Any

RAW_TELANGANA_DIRS = [
    "tgird", "tgrac", "forest_department", "rural_development",
    "pjtsau", "crida", "groundwater", "irrigation", "district_reports"
]

RAW_NATIONAL_DIRS = [
    "icar", "iiswc", "crida", "nbsslup", "nraa", "wdcpmsky", "moefcc", "cgwb"
]

RAW_GLOBAL_DIRS = [
    "fao", "wocat", "unccd"
]

def setup_directory_structure(base_dir: str):
    raw_dir = os.path.join(base_dir, "data", "raw")
    manifests_dir = os.path.join(base_dir, "data", "manifests")

    for d in RAW_TELANGANA_DIRS:
        os.makedirs(os.path.join(raw_dir, "telangana", d), exist_ok=True)

    for d in RAW_NATIONAL_DIRS:
        os.makedirs(os.path.join(raw_dir, "national", d), exist_ok=True)

    for d in RAW_GLOBAL_DIRS:
        os.makedirs(os.path.join(raw_dir, "global", d), exist_ok=True)

    os.makedirs(manifests_dir, exist_ok=True)
    print("Directory structure successfully created.")

MANIFEST_HEADERS = [
    "document_id", "exact_title", "normalized_title", "organization",
    "department", "authors", "publication_year", "publication_date",
    "source_url", "final_url", "source_level", "country", "state",
    "district", "watershed_name", "language", "topic", "restoration_subdomain",
    "document_type", "evidence_type", "official_source", "filename",
    "relative_file_path", "file_extension", "file_size_bytes", "sha256",
    "page_count", "scanned_pdf", "text_extractable", "text_quality",
    "license_or_reuse_status", "access_status", "download_date",
    "review_status", "inclusion_priority", "recommendation_eligibility", "notes"
]

def init_manifest_csvs(base_dir: str):
    manifests_dir = os.path.join(base_dir, "data", "manifests")
    for csv_name in ["sources.csv", "failed_downloads.csv", "duplicates.csv", "review_required.csv", "licensing_review.csv"]:
        path = os.path.join(manifests_dir, csv_name)
        if not os.path.exists(path):
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(MANIFEST_HEADERS)

if __name__ == "__main__":
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    setup_directory_structure(base)
    init_manifest_csvs(base)
