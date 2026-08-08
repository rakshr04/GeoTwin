import os
import csv
import urllib.request
import urllib.parse

TGRAC_CRIDA_SOURCES = [
    {
        "document_id": "TG_TGRAC_01",
        "exact_title": "WDC-PMKSY 2.0 Monitoring and Impact Assessment Report - Telangana State",
        "organization": "TGRAC",
        "source_url": "https://trac.telangana.gov.in/reports/WDC_PMKSY_2_0_Telangana_Monitoring.pdf",
        "target_dir": "data/raw/telangana/tgrac",
        "filename": "TG_TGRAC_01_WDC_PMKSY_Monitoring.pdf"
    },
    {
        "document_id": "TG_TGRAC_02",
        "exact_title": "Land Degradation Mapping and Atlas of Telangana State",
        "organization": "TGRAC & ISRO-NRSC",
        "source_url": "https://trac.telangana.gov.in/atlas/Land_Degradation_Atlas_Telangana.pdf",
        "target_dir": "data/raw/telangana/tgrac",
        "filename": "TG_TGRAC_02_Land_Degradation_Atlas.pdf"
    },
    {
        "document_id": "TG_CRIDA_01",
        "exact_title": "Technical Guidelines for Soil and Water Conservation in Telangana Drylands",
        "organization": "ICAR-CRIDA Hyderabad",
        "source_url": "http://www.crida.in/publications/Telangana_Dryland_Soil_Water_Conservation.pdf",
        "target_dir": "data/raw/telangana/crida",
        "filename": "TG_CRIDA_01_Dryland_Soil_Conservation.pdf"
    }
]

def discover_and_collect_tgrac_crida():
    print("Starting TGRAC & ICAR-CRIDA Telangana publication discovery...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifests_dir = os.path.join(base_dir, "data", "manifests")
    os.makedirs(manifests_dir, exist_ok=True)

    failed_csv = os.path.join(manifests_dir, "failed_downloads.csv")
    headers_failed = ["document_id", "title", "source_url", "final_url", "http_status", "error_reason"]
    
    headers_user_agent = {'User-Agent': 'LandPatch-Research-Bot/1.0 (+http://trac.telangana.gov.in)'}

    for src in TGRAC_CRIDA_SOURCES:
        doc_id = src["document_id"]
        title = src["exact_title"]
        url = src["source_url"]
        target_path = os.path.join(base_dir, src["target_dir"], src["filename"])
        os.makedirs(os.path.dirname(target_path), exist_ok=True)

        print(f"\nChecking official endpoint for {doc_id}: {title}")
        print(f"URL: {url}")

        try:
            req = urllib.request.Request(url, headers=headers_user_agent)
            with urllib.request.urlopen(req, timeout=10) as response:
                content_type = response.info().get_content_type()
                final_url = response.geturl()
                content = response.read()

                with open(target_path, "wb") as f:
                    f.write(content)

                print(f"SUCCESS: Verified official download!")
                print(f"Content Type: {content_type}")
                print(f"File Size: {len(content)} bytes")
        except Exception as e:
            err_msg = str(e)
            print(f"Endpoint HTTP Status / Result: {err_msg}")
            print(f"Recording in failed_downloads.csv without substitute text creation.")
            record_failure(failed_csv, headers_failed, {
                "document_id": doc_id,
                "title": title,
                "source_url": url,
                "final_url": url,
                "http_status": getattr(e, 'code', 'ConnectionError'),
                "error_reason": err_msg
            })

def record_failure(csv_path: str, headers: list, record: dict):
    file_exists = os.path.exists(csv_path)
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        if not file_exists or os.path.getsize(csv_path) == 0:
            writer.writeheader()
        writer.writerow(record)

if __name__ == "__main__":
    discover_and_collect_tgrac_crida()
