import os
import shutil

downloads = os.path.expanduser('~/Downloads')
base_dir = r'c:\LANDPATCH DEMO -1VERSION\rag-service'

new_pdf_mapping = [
    {
        'src': 'ISG Telangana.pdf',
        'dest': r'data/raw/telangana/tgrac/TG_ISG_TELANGANA.pdf',
        'doc_id': 'TG_ISG_TELANGANA',
        'exact_title': 'ISG Telangana Technical Report and Spatial Data',
        'organization': 'TGRAC / Telangana Govt',
        'source_level': 'telangana',
        'state': 'Telangana',
        'country': 'India',
        'topic': 'Spatial Information Systems and Land Resources'
    },
    {
        'src': 'UNCCD LDN TS Technical Guide_Draft_English.pdf',
        'dest': r'data/raw/global/unccd/GLO_UNCCD_LDN_TECHNICAL_GUIDE.pdf',
        'doc_id': 'GLO_UNCCD_LDN_TECHNICAL_GUIDE',
        'exact_title': 'UNCCD Land Degradation Neutrality (LDN) Technical Guide',
        'organization': 'UNCCD',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Land Degradation Neutrality Target Setting'
    },
    {
        'src': 'UNCCD LDN_CF_report_web-english.pdf',
        'dest': r'data/raw/global/unccd/GLO_UNCCD_LDN_CONCEPTUAL_FRAMEWORK.pdf',
        'doc_id': 'GLO_UNCCD_LDN_CONCEPTUAL_FRAMEWORK',
        'exact_title': 'UNCCD Scientific Conceptual Framework for Land Degradation Neutrality',
        'organization': 'UNCCD',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Scientific Conceptual Framework for LDN'
    },
    {
        'src': 'WOCAT.pdf',
        'dest': r'data/raw/global/wocat/GLO_WOCAT_SLM_COMPENDIUM.pdf',
        'doc_id': 'GLO_WOCAT_SLM_COMPENDIUM',
        'exact_title': 'WOCAT Sustainable Land Management Technologies and Approaches Compendium',
        'organization': 'WOCAT',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Sustainable Land Management Technologies'
    },
    {
        'src': 'FAO Land husbandry.pdf',
        'dest': r'data/raw/global/fao/GLO_FAO_LAND_HUSBANDRY.pdf',
        'doc_id': 'GLO_FAO_LAND_HUSBANDRY',
        'exact_title': 'FAO Land Husbandry: Components and Strategy',
        'organization': 'FAO',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Land Husbandry and Soil Conservation Strategy'
    },
    {
        'src': 'FAO Soil erosion management.pdf',
        'dest': r'data/raw/global/fao/GLO_FAO_SOIL_EROSION_MGMT.pdf',
        'doc_id': 'GLO_FAO_SOIL_EROSION_MGMT',
        'exact_title': 'FAO Soil Erosion Assessment and Management Guidelines',
        'organization': 'FAO',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Soil Erosion Assessment and Management'
    },
    {
        'src': 'FAO Manual on integrated soil management and conservation practices.pdf',
        'dest': r'data/raw/global/fao/GLO_FAO_MANUAL_INTEG_SOIL_MGMT.pdf',
        'doc_id': 'GLO_FAO_MANUAL_INTEG_SOIL_MGMT',
        'exact_title': 'FAO Manual on Integrated Soil Management and Conservation Practices',
        'organization': 'FAO',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Integrated Soil Management & Conservation Practices'
    },
    {
        'src': 'FAO FARMESA_SWC1.pdf',
        'dest': r'data/raw/global/fao/GLO_FAO_FARMESA_SWC1.pdf',
        'doc_id': 'GLO_FAO_FARMESA_SWC1',
        'exact_title': 'FAO FARMESA Soil and Water Conservation Field Guide',
        'organization': 'FAO',
        'source_level': 'global',
        'country': 'Global',
        'topic': 'Soil and Water Conservation Field Practices'
    }
]

def main():
    copied_count = 0
    for item in new_pdf_mapping:
        src_path = os.path.join(downloads, item['src'])
        dest_path = os.path.join(base_dir, item['dest'])
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(src_path, dest_path)
        sz = os.path.getsize(dest_path)
        print("Copied", item['src'], "->", item['dest'], f"({sz} bytes)")
        copied_count += 1
    print("\nTotal batch 2 PDFs copied successfully:", copied_count)

if __name__ == '__main__':
    main()
