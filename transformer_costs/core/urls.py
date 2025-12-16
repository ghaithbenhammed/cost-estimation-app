from django.urls import path, re_path
from rest_framework.routers import DefaultRouter
from core.views import (
    CompanyListView, SacemIndustriesDetailView, HeaderBomProductionView,
    BomLinesView, ItemCostView, CustomerCardView, UnifiedCustomerListView,
    TemporaryCustomerListCreateView, TemporaryCustomerRetrieveUpdateDeleteView,
    CustomerRequestViewSet, sync_navision_customers_api, SaveBomView,SavedBomByRequestView,BomsReadyForCostingView,update_facture_status,delete_facture,analyze_pdf
)
from core.services.navision import fetch_items_by_no


router = DefaultRouter()
router.register(r'requests', CustomerRequestViewSet, basename='customer-requests')


urlpatterns = [
    path('companies/', CompanyListView.as_view(), name='company-list'),
    path('companies/sacem-industries/', SacemIndustriesDetailView.as_view(), name='sacem-industries-detail'),
    path('companies/sacem-industries/header-bom/', HeaderBomProductionView.as_view(), name='header-bom-production'),
    path('companies/sacem-industries/bom-lines/', BomLinesView.as_view(), name='sacem-industries-bom-lines'),
    path('companies/sacem-industries/item-cost/', ItemCostView.as_view(), name='sacem-industries-item-cost'),
    path('companies/sacem-industries/customer-card/', CustomerCardView.as_view(), name='sacem-industries-customer-card'),
    path('companies/sacem-industries/unified-customers/', UnifiedCustomerListView.as_view(), name='unified-customers-list'),
    path('temporary-customers/', TemporaryCustomerListCreateView.as_view(), name='temporary-customer-list'),
    path('temporary-customers/<str:No>/', TemporaryCustomerRetrieveUpdateDeleteView.as_view(), name='temporary-customer-detail'),
    path('sync-navision-customers/', sync_navision_customers_api),
    path('save-bom/', SaveBomView.as_view(), name='save-bom'),
    path('saved-bom/', SavedBomByRequestView.as_view(), name='get-saved-bom-by-request'),
    path('item-cost/<str:code>/', ItemCostView.as_view(), name='item-cost'),
    path('boms-to-invoice/', BomsReadyForCostingView.as_view(), name='boms-to-invoice'),
    path('factures/<int:pk>/update-status/', update_facture_status, name='update-facture-status'),
    path('factures/<int:pk>/',delete_facture, name='delete-facture'),
    path('analyze_pdf',analyze_pdf,name='analyze_pdf')


]


urlpatterns += router.urls
