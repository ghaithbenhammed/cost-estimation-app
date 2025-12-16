import requests
from requests_ntlm import HttpNtlmAuth

NAVISION_URL = "http://192.168.7.10:3048/DynamicsNAV110/ODataV4"



def fetch_companies():
    """Récupère la liste des entreprises depuis Navision."""
    try:
        url = f"{NAVISION_URL}/Company"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers
        )
        response.raise_for_status()

        companies = response.json().get("value", [])
        return [
            {
                "name": company.get("Name", "N/A"),
                "displayName": company.get("Display_Name", "N/A"),
                "id": company.get("Id", "N/A"),
                "businessProfileId": company.get("Business_Profile_Id", "N/A")
            }
            for company in companies
        ]

    except requests.RequestException as e:
        print(f"❌ Erreur lors de la récupération des entreprises : {e}")
        return []

def fetch_sacem_industries_details():
    """Récupère les détails de SACEM INDUSTRIES."""
    try:
        url = f"{NAVISION_URL}/Company('SACEM INDUSTRIES')/"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers
        )
        response.raise_for_status()

        company_data = response.json()
        return {
            "name": company_data.get("Name", "N/A"),
            "evaluationCompany": company_data.get("Evaluation_Company", "N/A"),
            "displayName": company_data.get("Display_Name", "N/A"),
            "id": company_data.get("Id", "N/A"),
            "businessProfileId": company_data.get("Business_Profile_Id", "N/A"),
        }

    except requests.RequestException as e:
        print(f"❌ Erreur lors de la récupération des détails de SACEM INDUSTRIES : {e}")
        return None

def fetch_header_bom_production(design_file_no=None, no=None):
    try:
        url = f"{NAVISION_URL}/Company('SACEM%20INDUSTRIES')/Header_Bom_Production"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        
        query_params = {}
        if design_file_no:
            query_params['Design_File_no'] = design_file_no
        if no:
            query_params['No'] = no
        
        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers,
            params=query_params
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        return None
        
def fetch_production_bom_lines(production_bom_no=None, skip=None, top=1000):
    try:
        url = f"{NAVISION_URL}/Company('SACEM%20INDUSTRIES')/Ligne_Bom_Production"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        
        query_params = {
            '$top': top,
        }

        # ✅ Utilisation de $filter pour récupérer uniquement les lignes BOM associées
        if production_bom_no:
            query_params['$filter'] = f"Production_BOM_No eq '{production_bom_no}'"
        if skip:
            query_params['$skip'] = skip
        
        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers,
            params=query_params
        )
        response.raise_for_status()
        return response.json()
    
    except requests.RequestException as e:
        print(f"❌ Erreur API Ligne_Bom_Production: {e}")
        return None


def fetch_integration_item_card():
    try:
        # Formater l'URL pour l'entité Integration_Item_Card
        url = f"{NAVISION_URL}/Company('SACEM%20INDUSTRIES')/Item_Cost"

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers
        )
        response.raise_for_status()

        # Retourner les données sous forme de JSON
        item_card_data = response.json()

        return item_card_data
    except requests.RequestException as e:
        print(f"Erreur lors de la récupération de Integration_Item_Card : {e}")
        return None

def fetch_items_by_no(code):
    try:
        url = f"{NAVISION_URL}/Company('SACEM%20INDUSTRIES')/Item_Cost?$filter=No eq '{code}'"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers
        )
        response.raise_for_status()

        data = response.json().get("value", [])
        if data:
            return data[0]  # On retourne le premier résultat trouvé
        else:
            return None

    except requests.RequestException as e:
        print(f"❌ Erreur lors de la récupération du code item {code} :", e)
        return None





def fetch_integration_customer_card():
    try:
        url = f"{NAVISION_URL}/Company('SACEM%20INDUSTRIES')/Integration_Customer_Card"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        response = requests.get(
            url,
            auth=HttpNtlmAuth('elyes.trabelsi', '7C5aesam*101'),
            headers=headers
        )
        response.raise_for_status()

        customer_card_data = response.json()
        return customer_card_data
    except requests.RequestException as e:
        print(f"Erreur lors de la récupération de Integration_Customer_Card : {e}")
        return None
