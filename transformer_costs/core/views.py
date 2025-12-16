from django.http import Http404
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status ,viewsets
from core.services.navision import (
    fetch_companies, fetch_sacem_industries_details, 
    fetch_header_bom_production, fetch_production_bom_lines, fetch_items_by_no,fetch_integration_customer_card
)
from rest_framework import generics
from django.shortcuts import get_object_or_404
from .models import TemporaryCustomer , CustomerRequest,SavedBom
from .serializers import TemporaryCustomerSerializer , CustomerRequestSerializer,SavedBomSerializer
from rest_framework.decorators import action
from rest_framework import status
from django.utils import timezone
from chat.utils import notify_user
from accounts.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes  
from rest_framework.generics import DestroyAPIView


class CompanyListView(APIView):
    """Vue API pour récupérer la liste des entreprises depuis Navision."""
    
    def get(self, request):
        companies = fetch_companies()
        return Response(companies, status=status.HTTP_200_OK)

class SacemIndustriesDetailView(APIView):
    """Vue API pour récupérer les détails de l'entreprise SACEM INDUSTRIES."""
    
    def get(self, request):
        company_data = fetch_sacem_industries_details()
        
        if company_data:
            return Response(company_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Détails non trouvés ou Navision inaccessible"}, status=status.HTTP_404_NOT_FOUND)

class HeaderBomProductionView(APIView):
    """Vue API pour récupérer les en-têtes BOM de SACEM INDUSTRIES."""
    
    def get(self, request):
        design_file_no = request.query_params.get('design_file_no')
        no = request.query_params.get('no')
        
        bom_data = fetch_header_bom_production(design_file_no, no)
        
        if bom_data:
            return Response(bom_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Détails BOM non trouvés ou Navision inaccessible"}, status=status.HTTP_404_NOT_FOUND)

class BomLinesView(APIView):
    """Vue API pour récupérer toutes les lignes BOM de SACEM INDUSTRIES."""
    
    def get(self, request):
        Production_BOM_No = request.query_params.get('Production_BOM_No')
        bom_lines = fetch_production_bom_lines(Production_BOM_No)
        
        if bom_lines:
            return Response(bom_lines, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Lignes BOM non trouvées ou Navision inaccessible"}, status=status.HTTP_404_NOT_FOUND)

class ItemCostView(APIView):
    def get(self, request, code):
        item_data = fetch_items_by_no(code)
        if not item_data:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "code": item_data.get("No", ""),
            "designation": item_data.get("Description", ""),
            "unit_cost": item_data.get("Unit_Cost", 0),
            "posting_date": item_data.get("Posting_Date", None)
        })
class CustomerCardView(APIView):
    """Vue API pour récupérer les données de la table Integration_Customer_Card de SACEM INDUSTRIES."""

    def get(self, request):
        customer_card_data = fetch_integration_customer_card()

        if customer_card_data:
            return Response(customer_card_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Données Customer Card non trouvées ou Navision inaccessible"}, status=status.HTTP_404_NOT_FOUND)

# Liste et création des clients temporaires
class TemporaryCustomerListCreateView(generics.ListCreateAPIView):
    queryset = TemporaryCustomer.objects.all()
    serializer_class = TemporaryCustomerSerializer

# Détails, mise à jour et suppression d'un client temporaire
class TemporaryCustomerRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TemporaryCustomer.objects.all()
    serializer_class = TemporaryCustomerSerializer
    lookup_field = 'No'
class UnifiedCustomerListView(APIView):
    """Vue API pour récupérer la liste fusionnée des clients (Navision + Temporaire)."""

    def get(self, request):
        try:
            # Récupérer les clients de Navision
            navision_customers = fetch_integration_customer_card()
            if navision_customers and "value" in navision_customers:
                navision_customers = navision_customers["value"]
            else:
                navision_customers = []

            # Récupérer les clients temporaires depuis Django
            temp_customers = TemporaryCustomer.objects.all()
            temp_customers_serialized = TemporaryCustomerSerializer(temp_customers, many=True).data

            # Fusionner les deux listes
            all_customers = navision_customers + temp_customers_serialized

            return Response(all_customers, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CustomerRequestViewSet(viewsets.ModelViewSet):
    queryset = CustomerRequest.objects.all()
    serializer_class = CustomerRequestSerializer

    # Ajouter une nouvelle demande
    def create(self, request, *args, **kwargs):
        print(f"📥 Données reçues par Django : {request.data}")  # Debug

        customer_no = request.data.get('customer_no')  
        customer_name = request.data.get('customer_name')  

        if not customer_no:
            return Response({"error": "Numéro de client requis"}, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si le client existe dans TemporaryCustomer
        try:
            customer = TemporaryCustomer.objects.get(No=customer_no)
            customer_id = customer.id  
        except TemporaryCustomer.DoesNotExist:
            #  Vérifier si le client existe dans Navision
            navision_customers = fetch_integration_customer_card()
            client_navision = next((c for c in navision_customers.get("value", []) if c["No"] == customer_no), None)
            
            if not client_navision:
                return Response({"error": "Client introuvable"}, status=status.HTTP_400_BAD_REQUEST)
            
            customer_id = None  

       
        request_data = request.data.copy()
        request_data['customer'] = customer_id 
        request_data['customer_no'] = customer_no 
        request_data['customer_name'] = customer_name  

        serializer = self.get_serializer(data=request_data)
        if serializer.is_valid():
            serializer.save()
            print(f"✅ Enregistrement réussi : {serializer.data}")  # Debug
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def partial_update(self, request, *args, **kwargs):
       instance = self.get_object()
       old_status = instance.status

       response = super().partial_update(request, *args, **kwargs)

     
       if request.data.get("status") == "completed" and old_status != "completed":
          instance.validated_at = timezone.now()
          instance.save(update_fields=["validated_at"])

       
          linked_boms = SavedBom.objects.filter(request=instance, sent_to_cost_responsible=True)

          if linked_boms.exists():
            responsables = User.objects.filter(role='ResponsableCout', is_active=True)
            for responsable in responsables:
                notify_user(
                    responsable,
                    f"📄 Une nouvelle facture est disponible pour la demande #{instance.id}.",
                    "Nouvelle facture à traiter"
                )

       return response


# Récupérer l'historique des demandes d’un client
    def list(self, request, *args, **kwargs):
        customer_no = request.query_params.get('customer_no')

        if customer_no:
            customer_no = customer_no.strip()

            print("🔍 Filtrage des demandes pour :", repr(customer_no))

            navision_customers = fetch_integration_customer_card()
            is_customer_in_navision = any(
                c["No"].strip() == customer_no for c in navision_customers.get("value", [])
            )
            is_customer_in_temporary = TemporaryCustomer.objects.filter(No__iexact=customer_no).exists()

            if not (is_customer_in_navision or is_customer_in_temporary):
                return Response({"error": "Client introuvable"}, status=status.HTTP_400_BAD_REQUEST)

            requests = CustomerRequest.objects.filter(customer_no__iexact=customer_no)
        else:
            requests = CustomerRequest.objects.all()

        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    
@action(detail=True, methods=['patch'], url_path='update-status')
def update_status(self, request, pk=None):
        demande = self.get_object()
        nouveau_statut = request.data.get('status')

        if nouveau_statut not in ['pending', 'completed', 'rejected']:
            return Response({"error": "Statut invalide"}, status=status.HTTP_400_BAD_REQUEST)

        demande.status = nouveau_statut
        demande.save()
        return Response({"message": "Statut mis à jour avec succès"}, status=status.HTTP_200_OK)

   
def destroy(self, request, *args, **kwargs):
        demande = self.get_object()
        demande.delete()
        return Response({"message": "Demande supprimée avec succès"}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
def sync_navision_customers_api(request):
    """API pour lancer la synchronisation des clients Navision"""
    try:
        navision_data = fetch_integration_customer_card()
        count_created = 0
        for client in navision_data.get("value", []):
            no = client.get("No")
            if not TemporaryCustomer.objects.filter(No=no).exists():
                TemporaryCustomer.objects.create(
                    No=client.get("No"),
                    Name=client.get("Name"),
                    County=client.get("County"),
                    Responsibility_Center=client.get("Responsibility_Center"),
                    Customer_Status=client.get("Customer_Status"),
                    VAT_Registration_No=client.get("VAT_Registration_No"),
                    is_approved=True,
                )
                count_created += 1
        return Response({"message": f"{count_created} clients ajoutés depuis Navision."}, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

class SaveBomView(APIView):
    def post(self, request):
        serializer = SavedBomSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user if request.user.is_authenticated else None
            serializer.save(created_by=user) 
            return Response({"message": "Nomenclature enregistrée avec succès."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class SavedBomByRequestView(generics.RetrieveAPIView):
    serializer_class = SavedBomSerializer

    def get_object(self):
        request_id = self.request.query_params.get("request_id")
        if not request_id:
            raise Http404("ID de demande manquant.")

      
        return SavedBom.objects.filter(request__id=request_id).order_by('-id').first()


class BomsReadyForCostingView(generics.ListAPIView):
    serializer_class = SavedBomSerializer

    def get_queryset(self):
        return SavedBom.objects.filter(
            sent_to_cost_responsible=True,
            request__status='completed' 
        )
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_facture_status(request, pk):
    try:
        facture = SavedBom.objects.get(pk=pk)
    except SavedBom.DoesNotExist:
        return Response({"error": "Facture non trouvée"}, status=404)

    new_status = request.data.get('status')
    if new_status not in ['en_cours', 'emise']:
        return Response({"error": "Statut invalide"}, status=400)

    facture.status = new_status
    facture.save()

   
    if new_status == 'en_cours':
        responsables = User.objects.filter(role='ResponsableCout', is_active=True)
        for responsable in responsables:
            notify_user(
                responsable,
                "📄 Une nouvelle facture est disponible dans votre tableau de bord.",
                "Nouvelle facture à traiter"
            )

    return Response({"message": "Statut mis à jour avec succès."}, status=200)
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_facture(request, pk):
    try:
        facture = SavedBom.objects.get(pk=pk)
        facture.delete()
        return Response({"message": "Facture supprimée avec succès."}, status=status.HTTP_204_NO_CONTENT)
    except SavedBom.DoesNotExist:
        return Response({"error": "Facture introuvable."}, status=status.HTTP_404_NOT_FOUND)


#Partie IA


import io
import re
import logging
import pdfplumber
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from fuzzywuzzy import fuzz

# MODELS IA
extract_model = SentenceTransformer('bert-base-multilingual-cased')
compare_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

logging.basicConfig(level=logging.INFO)

def normalize_voltage(value):
    """Normalise les tensions pour correspondre au format attendu (en kV, ex. 400 V -> 0.4, 30 kV -> 30.0)."""
    try:
        # Extraire l'unité (V ou kV) avant de nettoyer
        unit_match = re.search(r'(v|kv)\b', value, re.IGNORECASE)
        unit = unit_match.group(1).lower() if unit_match else 'v' 

        # Nettoyer la valeur (supprimer tout sauf chiffres, point et /)
        cleaned_value = re.sub(r'[^0-9./]', '', value.strip().lower())

        # Gérer les formats comme 230/400
        if '/' in cleaned_value:
            # Prendre la plus grande valeur (souvent la tension nominale triphasée)
            values = [float(v) for v in cleaned_value.split('/') if v]
            num = max(values)
        else:
            num = float(cleaned_value)

        # Convertir en kV selon l'unité
        if unit == 'v' and num > 10: 
            num = num / 1000 
       
        
        return round(num, 3)  # Arrondir à 3 décimales
    except (ValueError, TypeError):
        logging.warning(f"Impossible de normaliser la tension: {value}")
        return None

def extract_power(description):
    match = re.search(r'(\d+)\s*kva', description, re.IGNORECASE)
    return int(match.group(1)) if match else None

def extract_frequency(description):
    match = re.search(r'(\d+)\s*hz', description, re.IGNORECASE)
    return int(match.group(1)) if match else None

def extract_voltage(description, primary=True):
    """Extrait la tension primaire ou secondaire à partir de la description."""
    description = description.lower()
    
    # 1. Format avec tirets (ex. 10-0.38-0.24-DYN11-CU-TN)
    if '-' in description:
        parts = description.split('-')
        if len(parts) >= 3:
            try:
                
                return normalize_voltage(parts[1 if primary else 2])
            except IndexError:
                return None
    
    # 2. Format avec barres obliques (ex. 630 kVA/20 kV/0.42)
    if '/' in description:
        parts = description.split('/')
        voltages = []
        for part in parts:
            if re.search(r'(\d+\.?\d*\s*(?:v|kv))', part, re.IGNORECASE):
                normalized = normalize_voltage(part)
                if normalized is not None:
                    voltages.append(normalized)
        # Trier pour assigner : primaire = plus haute tension, secondaire = plus basse
        if voltages:
            voltages.sort(reverse=True) 
            return voltages[0 if primary else 1] if len(voltages) > (0 if primary else 1) else None
    
    # 3. Format standard (ex. 630 kVA 10 kV 0,4 kV)
    voltages = re.findall(r'(\d+\.?\d*\/?\d*\s*(?:v|kv))', description, re.IGNORECASE)
    if voltages:
        normalized_voltages = [normalize_voltage(v) for v in voltages if normalize_voltage(v) is not None]
        normalized_voltages.sort(reverse=True)
        return normalized_voltages[0 if primary else 1] if len(normalized_voltages) > (0 if primary else 1) else None
    
    return None

def score_match(pdf_desc, nav_desc):
    pdf_desc_lower = pdf_desc.lower()
    nav_desc_lower = nav_desc.lower()
    
    # Extraire les champs
    power_pdf = extract_power(pdf_desc_lower)
    freq_pdf = extract_frequency(pdf_desc_lower)
    vprim_pdf = extract_voltage(pdf_desc_lower, primary=True)
    vsec_pdf = extract_voltage(pdf_desc_lower, primary=False)

    power_nav = extract_power(nav_desc_lower)
    freq_nav = extract_frequency(nav_desc_lower)
    vprim_nav = extract_voltage(nav_desc_lower, primary=True)
    vsec_nav = extract_voltage(nav_desc_lower, primary=False)

    score = 0

    # Score pour la puissance
    if power_pdf and power_nav:
        power_score = max(0, 100 - abs(power_pdf - power_nav))
        score += power_score

    # Score pour la fréquence
    if freq_pdf and freq_nav:
        freq_score = 50 if freq_pdf == freq_nav else 0
        score += freq_score

    # Score pour la tension primaire
    if vprim_pdf and vprim_nav:
        vprim_score = max(0, 100 - abs(vprim_pdf - vprim_nav) * 1000)  # Différence en kV
        score += vprim_score

    # Score pour la tension secondaire
    if vsec_pdf and vsec_nav:
        vsec_score = max(0, 100 - abs(vsec_pdf - vsec_nav) * 1000)  # Différence en kV
        score += vsec_score

    score += fuzz.token_sort_ratio(pdf_desc_lower, nav_desc_lower)

    return score

@api_view(['POST'])
@parser_classes([MultiPartParser])
def analyze_pdf(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file provided"}, status=400)

    pdf_data = file.read()
    all_lines = []

    with pdfplumber.open(io.BytesIO(pdf_data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_lines.extend(text.splitlines())

            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    row_text = " ".join([str(cell) for cell in row if cell])
                    if row_text:
                        all_lines.append(row_text)
                    if len(table) > 1 and len(row) > 1:
                        headers = table[0]
                        for i, header in enumerate(headers):
                            if header and i < len(row) and row[i]:
                                all_lines.append(f"{header.strip()}: {row[i].strip()}")

    # Analyse du texte
    result = extract_fields_ai(all_lines)

    # Description extraite par l'IA
    pdf_description = result.get("description", "").lower()

    # Appel à Navision
    nav_response = fetch_header_bom_production()
    descriptions_navision = nav_response.get("value", []) if nav_response else []

    # Calcul des similarités avec score amélioré
    similarities = []
    for item in descriptions_navision:
        nav_desc = item.get("Description", "")
        score = score_match(pdf_description, nav_desc)
        similarities.append({
            "description": nav_desc,
            "score": score
        })

    # Trier et récupérer les 3 meilleurs
    top_matches = sorted(similarities, key=lambda x: x["score"], reverse=True)[:3]
    result["closest_descriptions_from_navision"] = [match["description"] for match in top_matches]

    return Response(result)

def extract_fields_ai(lines):
    target_fields = ["puissance", "fréquence", "tension_primaire", "tension_secondaire"]
    data = {}

    # Regex pour valider la valeur extraite
    regex_validation = {
        "puissance": re.compile(r"^\d+(\.\d+)?\s*(kva|kw|w)$", re.IGNORECASE),
        "fréquence": re.compile(r"^\d+(\.\d+)?\s*hz$", re.IGNORECASE),
        "tension_primaire": re.compile(r"^\d+\.?\d*/?\d*\s*(v|kv)$", re.IGNORECASE),
        "tension_secondaire": re.compile(r"^\d+\.?\d*/?\d*\s*(v|kv)$", re.IGNORECASE),
    }

    for field in target_fields:
        best_score = 0
        best_value = ""
        field_embedding = extract_model.encode([field])[0].reshape(1, -1)

        for line in lines:
            if not line.strip():
                continue

            candidates = []
            if ":" in line:
                parts = line.split(":", 1)
                candidates = [(parts[0].strip(), parts[1].strip())]
            else:
                tokens = line.strip().split()
                for i in range(len(tokens) - 1):
                    candidates.append((" ".join(tokens[i:i+1]), tokens[i+1]))

            for field_candidate, value_candidate in candidates:
                if not regex_validation[field].match(value_candidate.lower()):
                    continue

                try:
                    field_candidate_emb = extract_model.encode([field_candidate])[0].reshape(1, -1)
                    sim = cosine_similarity(field_embedding, field_candidate_emb)[0][0]
                    logging.info(f"Line: '{line}' | Field: '{field}' | Candidate: '{field_candidate}' | Similarity: {sim:.2f}")
                    if sim > best_score and sim > 0.6:
                        best_score = sim
                        best_value = value_candidate.strip()
                except Exception as e:
                    logging.warning(f"Erreur dans l'encodage ou la similarité : {e}")

        # Normaliser les tensions
        if field in ["tension_primaire", "tension_secondaire"] and best_value:
            normalized = normalize_voltage(best_value)
            best_value = str(normalized) if normalized is not None else best_value

        # Fallback regex globale si aucune valeur trouvée
        if best_value:
            data[field] = best_value
        else:
            data[field] = regex_fallback(field, lines)

    # Concaténation description
    puissance = data.get("puissance", "")
    tension_primaire = data.get("tension_primaire", "")
    tension_secondaire = data.get("tension_secondaire", "")
    data["description"] = f"{puissance} {tension_primaire} {tension_secondaire}".strip()

    # Comparaison avec Navision
    nav_data = fetch_header_bom_production()
    def clean_text(text):
        text = text.lower()
        text = re.sub(r'[_]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    descriptions_db = []
    if nav_data and 'value' in nav_data:
        for item in nav_data['value']:
            desc = item.get('description')
            if desc:
                descriptions_db.append(desc)

    matches = []
    for desc in descriptions_db:
        # Extraire les champs de la description Navision
        power_db = extract_power(desc)
        vprim_db = extract_voltage(desc, primary=True)
        vsec_db = extract_voltage(desc, primary=False)

        # Comparer les champs
        sim_puissance = 0
        sim_vprim = 0
        sim_vsec = 0

        if power_db and extract_power(data["description"]):
            sim_puissance = max(0, 1 - abs(power_db - extract_power(data["description"])) / max(power_db, 1))

        if vprim_db and normalize_voltage(data.get("tension_primaire", "")):
            sim_vprim = max(0, 1 - abs(vprim_db - normalize_voltage(data["tension_primaire"])) * 1000)

        if vsec_db and normalize_voltage(data.get("tension_secondaire", "")):
            sim_vsec = max(0, 1 - abs(vsec_db - normalize_voltage(data["tension_secondaire"])) * 1000)

        score_total = (sim_puissance + sim_vprim + sim_vsec) / 3
        matches.append((desc, score_total))

    matches.sort(key=lambda x: x[1], reverse=True)
    data["closest_descriptions_from_navision"] = [m[0] for m in matches[:3]]

    return data

def regex_fallback(field, lines):
    text = " ".join(lines).lower()

    if field == "puissance":
        match = re.search(r'puissance\s+(?:nominale|maximale)?\s*[:=]?\s*([\d.,]+\s*(?:kva|kw|mw|w))', text)
        if match:
            return match.group(1).upper()
        match = re.search(r'puissance\s*[:=]?\s*([\d.,]+\s*(?:kva|kw|mw|w))', text)
        if match:
            return match.group(1).upper()
        match = re.search(r'([\d.,]+\s*(?:kva|kw|mw|w))', text)
        if match:
            return match.group(1).upper()

    elif field == "fréquence":
        match = re.search(r'fr[eé]quence\s*[:=]?\s*([\d.,]+\s*hz)', text)
        if match:
            return match.group(1).lower()
        match = re.search(r'([\d.,]+\s*hz)', text)
        if match:
            return match.group(1).lower()

    elif field == "tension_primaire":
        match = re.search(r'tension\s+(?:primaire|triphas[ée]e\s+primaire)\s*[:=]?\s*([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if match:
            return str(normalize_voltage(match.group(1)))
        match = re.search(r'tension\s*[:=]?\s*([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if match:
            return str(normalize_voltage(match.group(1)))
        match = re.search(r'([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if match:
            return str(normalize_voltage(match.group(1)))

    elif field == "tension_secondaire":
        match = re.search(r'tension\s+(?:secondaire|triphas[ée]e\s+secondaire)\s*[:=]?\s*([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if match:
            return str(normalize_voltage(match.group(1)))
        matches = re.findall(r'tension\s*[:=]?\s*([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if len(matches) > 1:
            return str(normalize_voltage(matches[1]))
        matches = re.findall(r'([\d.,]+/?\d*\s*(?:v|kv))\s*(?:±\s*\d+\s*%)?', text, re.IGNORECASE)
        if len(matches) > 1:
            return str(normalize_voltage(matches[1]))

    return ""



