import os
import shutil

downloads = os.path.expanduser('~/Downloads')
base_dir = r'c:\LANDPATCH DEMO -1VERSION\rag-service'

pdf_mapping = [
    {
        'src': 'Agrometrology.pdf',
        'dest': r'data/raw/telangana/pjtsau/TG_PJTSAU_AGROMET.pdf',
        'doc_id': 'TG_PJTSAU_AGROMET',
        'exact_title': 'Agrometeorology Guidelines and Data for Telangana',
        'organization': 'PJTSAU',
        'source_level': 'telangana',
        'state': 'Telangana',
        'country': 'India',
        'topic': 'Agrometeorology and Climate Resilience'
    },
    {
        'src': 'CGWB Aquifier Sangareddy.pdf',
        'dest': r'data/raw/telangana/groundwater/TG_CGWB_AQUIFER_SANGAREDDY.pdf',
        'doc_id': 'TG_CGWB_AQUIFER_SANGAREDDY',
        'exact_title': 'Aquifer Mapping and Management Plan - Sangareddy District, Telangana',
        'organization': 'CGWB',
        'source_level': 'telangana',
        'state': 'Telangana',
        'district': 'Sangareddy',
        'country': 'India',
        'topic': 'Aquifer Mapping and Groundwater Recharge'
    },
    {
        'src': 'CGWB Aquifier Nagarkurnool.pdf',
        'dest': r'data/raw/telangana/groundwater/TG_CGWB_AQUIFER_NAGARKURNOOL.pdf',
        'doc_id': 'TG_CGWB_AQUIFER_NAGARKURNOOL',
        'exact_title': 'Aquifer Mapping and Management Plan - Nagarkurnool District, Telangana',
        'organization': 'CGWB',
        'source_level': 'telangana',
        'state': 'Telangana',
        'district': 'Nagarkurnool',
        'country': 'India',
        'topic': 'Aquifer Mapping and Groundwater Recharge'
    },
    {
        'src': 'AICRP-Annual-Report-2023.pdf',
        'dest': r'data/raw/national/icar/NAT_AICRP_ANNUAL_REPORT_2023.pdf',
        'doc_id': 'NAT_AICRP_ANNUAL_REPORT_2023',
        'exact_title': 'AICRP Annual Report 2023 - All India Coordinated Research Project',
        'organization': 'ICAR-AICRP',
        'source_level': 'national',
        'country': 'India',
        'topic': 'Dryland Agriculture and Watershed Research'
    },
    {
        'src': 'Innovative_farmer_participatory_integrated_watershed_management_model__Adarsha_watershed.pdf',
        'dest': r'data/raw/global/icrisat/GLO_ICRISAT_ADARSHA_WATERSHED.pdf',
        'doc_id': 'GLO_ICRISAT_ADARSHA_WATERSHED',
        'exact_title': 'Innovative Farmer Participatory Integrated Watershed Management Model - Adarsha Watershed Kothapally',
        'organization': 'ICRISAT',
        'source_level': 'telangana',
        'state': 'Telangana',
        'district': 'Sangareddy',
        'country': 'India',
        'topic': 'Integrated Watershed Management Model'
    },
    {
        'src': 'HydrologicalmodelingofamicrowatershedusingGISbasedmodel.pdf',
        'dest': r'data/raw/telangana/crida/TG_CRIDA_HYDROLOGICAL_MODELING.pdf',
        'doc_id': 'TG_CRIDA_HYDROLOGICAL_MODELING',
        'exact_title': 'Hydrological Modeling of a Micro-Watershed Using GIS Based Model',
        'organization': 'CRIDA',
        'source_level': 'telangana',
        'state': 'Telangana',
        'country': 'India',
        'topic': 'Hydrological Modeling and Watershed Management'
    },
    {
        'src': 'Icrisat Integ_nutrient_Managemnt_21-23_2002.pdf',
        'dest': r'data/raw/global/icrisat/GLO_ICRISAT_INTEG_NUTRIENT_MGMT.pdf',
        'doc_id': 'GLO_ICRISAT_INTEG_NUTRIENT_MGMT',
        'exact_title': 'ICRISAT Integrated Nutrient Management Guidelines (2002)',
        'organization': 'ICRISAT',
        'source_level': 'global',
        'country': 'India',
        'topic': 'Integrated Nutrient Management'
    },
    {
        'src': 'Icrisat 1._Watershed_Management_Concept.pdf',
        'dest': r'data/raw/global/icrisat/GLO_ICRISAT_WATERSHED_CONCEPTS.pdf',
        'doc_id': 'GLO_ICRISAT_WATERSHED_CONCEPTS',
        'exact_title': 'ICRISAT Watershed Management Concepts and Principles',
        'organization': 'ICRISAT',
        'source_level': 'global',
        'country': 'India',
        'topic': 'Watershed Management Concepts'
    },
    {
        'src': 'Icrisat watershed implementation.pdf',
        'dest': r'data/raw/global/icrisat/GLO_ICRISAT_WATERSHED_IMPLEMENTATION.pdf',
        'doc_id': 'GLO_ICRISAT_WATERSHED_IMPLEMENTATION',
        'exact_title': 'ICRISAT Watershed Implementation Manual and Guidelines',
        'organization': 'ICRISAT',
        'source_level': 'global',
        'country': 'India',
        'topic': 'Watershed Implementation'
    },
    {
        'src': 'Central Ground Water Board telangana.pdf',
        'dest': r'data/raw/telangana/groundwater/TG_CGWB_GROUNDWATER_REPORT.pdf',
        'doc_id': 'TG_CGWB_GROUNDWATER_REPORT',
        'exact_title': 'Central Ground Water Board Report on Telangana State',
        'organization': 'CGWB',
        'source_level': 'telangana',
        'state': 'Telangana',
        'country': 'India',
        'topic': 'Groundwater Resources and Artificial Recharge'
    },
    {
        'src': 'Icrisat watershed Training-manual.pdf',
        'dest': r'data/raw/global/icrisat/GLO_ICRISAT_WATERSHED_TRAINING_MANUAL.pdf',
        'doc_id': 'GLO_ICRISAT_WATERSHED_TRAINING_MANUAL',
        'exact_title': 'ICRISAT Watershed Management Training Manual',
        'organization': 'ICRISAT',
        'source_level': 'global',
        'country': 'India',
        'topic': 'Watershed Training Manual'
    }
]

def main():
    copied_count = 0
    for item in pdf_mapping:
        src_path = os.path.join(downloads, item['src'])
        dest_path = os.path.join(base_dir, item['dest'])
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(src_path, dest_path)
        sz = os.path.getsize(dest_path)
        print("Copied", item['src'], "->", item['dest'], f"({sz} bytes)")
        copied_count += 1
    print("\nTotal PDFs copied successfully:", copied_count)

if __name__ == '__main__':
    main()
