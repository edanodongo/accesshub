from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

router = SimpleRouter()
router.register("roles", views.RoleViewSet, basename="role")
router.register("permissions", views.PermissionViewSet, basename="permission")

urlpatterns = [path("audit/", views.audit_list)] + router.urls