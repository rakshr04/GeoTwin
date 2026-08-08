import os
import csv
import urllib.request
import urllib.error
import hashlib
import time
from typing import Dict, Any

TGIRD_SOURCES_TO_COLLECT = [
    {
        "document_id": "TG_TGIRD_01",
        "title": "Basics in Integrated Watershed Management",
        "source_url": "http://tgird.telangana.gov.in/downloads/basics_in_integrated_watershed_management.pdf",
        "filename": "TG_TGIRD_01_Basics_Integrated_Watershed_Management.pdf",
        "target_dir": "data/raw/telangana/tgird"
    },
    {
        "document_id": "TG_TGIRD_02",
        "title": "Resource Conservation Techniques for Watershed Development",
        "source_url": "http://tgird.telangana.gov.in/downloads/resource_conservation_techniques.pdf",
        "filename": "TG_TGIRD_02_Resource_Conservation_Techniques.pdf",
        "target_dir": "data/raw/telangana/tgird"
    },
    {
        "document_id": "TG_TGIRD_03",
        "title": "GIS and Remote Sensing Inputs in Watershed Development",
        "source_url": "http://tgird.telangana.gov.in/downloads/gis_and_remote_sensing_inputs.pdf",
        "filename": "TG_TGIRD_03_GIS_Remote_Sensing_Inputs.pdf",
        "target_dir": "data/raw/telangana/tgird"
    }
]

def collect_tgird_originals():
    print("Starting exact original file collection for TGIRD institution...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifests_dir = os.path.join(base_dir, "data", "manifests")
    failed_csv = os.path.join(manifests_dir, "failed_downloads.csv")

    headers = ["document_id", "title", "source_url", "final_url", "http_status", "error_reason", "timestamp"]

    verified_count = 0
    headers_user_agent = {'User-Agent': 'LandPatch-Research-Bot/1.0 (+http://landpatch.telangana.gov.in)'}

    for src in TGIRD_SOURCES_TO_COLLECT:
        doc_id = src["document_id"]
        title = src["title"]
        url = src["source_url"]
        filename = src["filename"]
        target_path = os.path.join(base_dir, src["target_dir"], filename)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        print(f"\n--- Attempting Download: {doc_id} ---")
        print(f"Title: {title}")
        print(f"URL: {url}")

        try:
            req = urllib.request.Request(url, headers=headers_user_agent)
            with urllib.request.urlopen(req, timeout=10) as response:
                final_url = response.geturl()
                content = response.read()

                with open(target_path, "wb") as f:
                    f.write(content)

                sha = calculate_sha256(target_path)
                size = len(content)

                print(f"SUCCESS: Downloaded exact file.")
                print(f"Resolved URL: {final_url}")
                print(f"File Size: {size} bytes")
                print(f"SHA-256: {sha}")
                verified_count += 1

        except Exception as e:
            err_msg = str(e)
            print(f"FAILED (Inaccessible / URL resolution error): {err_msg}")
            print(f"Recording failure in failed_downloads.csv without substitute text generation.")
            record_failure(failed_csv, headers, {
                "document_id": doc_id,
                "title": title,
                "source_url": url,
                "final_url": url,
                "http_status": getattr(e, 'code', 'Error'),
                "error_reason": err_msg,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            })

    print(f"\nTGIRD Collection Complete. Total verified downloads: {verified_count}/3.")

def record_failure(csv_path: str, headers: list, record: dict):
    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists or os.path.getsize(csv_path) == 0:
            writer.writeheader()
        writer.writerow(record)

def calculate_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

if __name__ == "__main__":
    collect_tgird_originals()
