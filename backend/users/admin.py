from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from rbac.models import Permission, Role
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("RBAC", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_active")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "parent")
    filter_horizontal = ("permissions",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("codename", "description")