from django.urls import path
from .views import CustomTokenObtainPairView, GetUserProfileView, UpdateUserProfileView,CreateUserView,UserListView,UserDetailView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('profile/', GetUserProfileView.as_view(), name='get_user_profile'), 
    path('profile/update/', UpdateUserProfileView.as_view(), name='update_user_profile'), 
    path('create/', CreateUserView.as_view(), name='create_user'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('user/<int:pk>/', UserDetailView.as_view(), name='user_detail'),

]
