from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from django.utils.translation import gettext_lazy as _

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # ✅ Formulaire de création
    add_fieldsets = (
        (_("Identifiants"), {
            'classes': ('wide',),
            'fields': (
                'username', 'password1', 'password2',
                'title', 'first_name', 'last_name',
                'email', 'phone_number', 'address', 'profile_picture',
                'role', 'is_active',
            ),
        }),
    )

    # ✅ Formulaire d'édition (utilisateur déjà existant)
    fieldsets = (
        (_("Connexion"), {
            'fields': ('username', 'password'),
        }),
        (_("Informations personnelles"), {
            'fields': ('title', 'first_name', 'last_name', 'email', 'phone_number', 'address', 'profile_picture'),
        }),
        (_("Rôle et autorisations"), {
            'fields': ('role', 'is_active', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_("Dates importantes"), {
            'fields': ('last_login', 'date_joined'),
        }),
    )

    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_superuser', 'profile_picture','phone_number', 'address')
    list_filter = ('role', 'is_active')
