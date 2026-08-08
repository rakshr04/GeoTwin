import os
import csv
import shutil
import urllib.request
import urllib.error
from typing import Dict, Any

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# List of target source candidate documents
TARGET_DOCUMENTS = [
    {
        "document_id": "NAT_ICAR_01",
        "exact_title": "Land Degradation due to Water-Induced Soil Erosion in India",
        "direct_file_url": "https://icar-iiswc.org/publications/bulletins/water_induced_erosion.pdf",
        "relative_save_path": "data/raw/national/iiswc/NAT_ICAR_01.pdf"
    },
    {
        "document_id": "NAT_ICAR_02",
        "exact_title": "Vegetation Degradation in Non-Arable Areas of India",
        "direct_file_url": "https://nbsslup.in/publications/technical/vegetation_degradation.pdf",
        "relative_save_path": "data/raw/national/nbsslup/NAT_ICAR_02.pdf"
    },
    {
        "document_id": "NAT_ICAR_03",
        "exact_title": "Acid Soils of India: Distribution and Management",
        "direct_file_url": "https://nbsslup.in/publications/technical/acid_soils.pdf",
        "relative_save_path": "data/raw/national/nbsslup/NAT_ICAR_03.pdf"
    },
    {
        "document_id": "NAT_ICAR_04",
        "exact_title": "Land Degradation Due to Wind Erosion in Arid Regions of India",
        "direct_file_url": "https://cazri.res.in/publications/wind_erosion_arid.pdf",
        "relative_save_path": "data/raw/national/cazri/NAT_ICAR_04.pdf"
    },
    {
        "document_id": "NAT_ICAR_05",
        "exact_title": "Degraded and Wastelands of India: Status and Spatial Distribution",
        "direct_file_url": "https://icar.org.in/publications/wastelands_status_india.pdf",
        "relative_save_path": "data/raw/national/icar/NAT_ICAR_05.pdf"
    },
    {
        "document_id": "TG_TGIRD_01",
        "exact_title": "Basics in Integrated Watershed Management",
        "direct_file_url": "http://tgird.telangana.gov.in/publications/basics_iwm.pdf",
        "relative_save_path": "data/raw/telangana/tgird/TG_TGIRD_01.pdf"
    },
    {
        "document_id": "TG_TGRAC_01",
        "exact_title": "WDC-PMKSY 2.0 Monitoring and Impact Assessment Report",
        "direct_file_url": "http://trac.telangana.gov.in/reports/wdc_pmksy_2_0_monitoring.pdf",
        "relative_save_path": "data/raw/telangana/tgrac/TG_TGRAC_01.pdf"
    },
    {
        "document_id": "TG_CRIDA_01",
        "exact_title": "Technical Guidelines for Soil and Water Conservation",
        "direct_file_url": "http://crida.in/publications/telangana_dryland_soil_water_conservation.pdf",
        "relative_save_path": "data/raw/telangana/crida/TG_CRIDA_01.pdf"
    }
]


def download_and_validate_streamed(doc_info: Dict[str, Any], base_dir: str) -> Dict[str, Any]:
    doc_id = doc_info["document_id"]
    url = doc_info["direct_file_url"]
    rel_path = doc_info["relative_save_path"]
    final_path = os.path.join(base_dir, rel_path)
    part_path = final_path + ".part"
    quarantine_dir = os.path.join(base_dir, "data", "quarantine", "invalid_downloads")

    os.makedirs(os.path.dirname(final_path), exist_ok=True)
    os.makedirs(quarantine_dir, exist_ok=True)

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }

    http_status = None
    content_type = "none"
    downloaded_bytes = 0
    failure_reason = ""

    # Stream download into .part file
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=12) as response:
            http_status = response.getcode()
            content_type = response.info().get_content_type()

            with open(part_path, "wb") as f_out:
                while True:
                    chunk = response.read(16384)
                    if not chunk:
                        break
                    f_out.write(chunk)
                    downloaded_bytes += len(chunk)

    except Exception as e:
        http_status = getattr(e, 'code', 'ConnectionError / Server Unreachable')
        failure_reason = f"Download error: {str(e)}"
        if os.path.exists(part_path):
            os.remove(part_path)

        return {
            "document_id": doc_id,
            "filename": os.path.basename(final_path),
            "relative_path": rel_path,
            "http_status": str(http_status),
            "content_type": content_type,
            "file_size_bytes": 0,
            "valid": False,
            "failure_reason": failure_reason,
            "ingestion_eligible": "False"
        }

    # Execute 6 Strict Validation Checks on .part file
    # Check 1: HTTP 200
    if http_status != 200:
        failure_reason = f"Check 1 Failed: HTTP status {http_status} (expected 200)"
    # Check 2: Content-Type application/pdf
    elif "application/pdf" not in content_type.lower():
        failure_reason = f"Check 2 Failed: Content-Type '{content_type}' is not application/pdf"
    # Check 3: File size > 1 KB (1024 bytes)
    elif downloaded_bytes <= 1024:
        failure_reason = f"Check 3 Failed: Downloaded size ({downloaded_bytes} bytes) is <= 1 KB"
    else:
        # Check 4: First five bytes %PDF-
        with open(part_path, "rb") as f_check:
            header_bytes = f_check.read(5)
        if header_bytes != b"%PDF-":
            failure_reason = f"Check 4 Failed: Header magic bytes '{header_bytes}' != b'%PDF-'"
        else:
            # Check 5 & 6: PyMuPDF open and > 0 pages
            if fitz is None:
                failure_reason = "Check 5 Failed: PyMuPDF (fitz) not installed"
            else:
                try:
                    doc = fitz.open(part_path)
                    page_count = len(doc)
                    doc.close()
                    if page_count < 1:
                        failure_reason = "Check 6 Failed: PDF contains 0 pages"
                    else:
                        failure_reason = ""  # Passed all 6 checks!
                except Exception as py_err:
                    failure_reason = f"Check 5 Failed: PyMuPDF corrupt file error ({str(py_err)})"

    if failure_reason == "":
        # All 6 checks passed -> Rename .part to .pdf in data/raw/
        if os.path.exists(final_path):
            os.remove(final_path)
        os.rename(part_path, final_path)
        print(f"[PASSED] 6-POINT AUDIT & DOWNLOADED: [{doc_id}] -> {rel_path} ({downloaded_bytes} bytes)")
        return {
            "document_id": doc_id,
            "filename": os.path.basename(final_path),
            "relative_path": rel_path,
            "http_status": str(http_status),
            "content_type": content_type,
            "file_size_bytes": downloaded_bytes,
            "valid": True,
            "failure_reason": "Passed all 6 PDF validation checks",
            "ingestion_eligible": "True"
        }
    else:
        # Check failed -> Move .part file to data/quarantine/invalid_downloads/
        quarantine_path = os.path.join(quarantine_dir, os.path.basename(final_path))
        if os.path.exists(quarantine_path):
            os.remove(quarantine_path)
        os.rename(part_path, quarantine_path)
        print(f"[FAILED AUDIT] ({failure_reason}): [{doc_id}] -> Quarantined to {os.path.relpath(quarantine_path, base_dir)}")
        return {
            "document_id": doc_id,
            "filename": os.path.basename(final_path),
            "relative_path": rel_path,
            "http_status": str(http_status),
            "content_type": content_type,
            "file_size_bytes": downloaded_bytes,
            "valid": False,
            "failure_reason": failure_reason,
            "quarantined_path": os.path.relpath(quarantine_path, base_dir),
            "ingestion_eligible": "False"
        }


def run_streamed_downloader():
    print("=== EXECUTING STREAMED BINARY DOWNLOAD & 6-POINT AUDIT ===")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifests_dir = os.path.join(base_dir, "data", "manifests")
    os.makedirs(manifests_dir, exist_ok=True)

    failed_csv = os.path.join(manifests_dir, "failed_downloads.csv")

    failed_records = []
    valid_records = []

    for doc in TARGET_DOCUMENTS:
        res = download_and_validate_streamed(doc, base_dir)
        if res["valid"]:
            valid_records.append(res)
        else:
            failed_records.append(res)

    # Log to failed_downloads.csv
    failed_headers = [
        "document_id", "filename", "relative_path", "http_status",
        "content_type", "file_size_bytes", "failure_reason", "ingestion_eligible"
    ]
    with open(failed_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=failed_headers, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(failed_records)

    print("\n=======================================================================================")
    print(f"DOWNLOAD & AUDIT SUMMARY: {len(valid_records)} Valid PDF(s) Saved | {len(failed_records)} Failed/Quarantined")
    print("=======================================================================================")

if __name__ == "__main__":
    run_streamed_downloader()
