from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("auth/register/", views.register),
    path("auth/login/", views.login_view),
    path("auth/logout/", views.logout_view),
    path("auth/me/", views.me),
    path("users/", views.user_list),
    path("users/<int:user_id>/role/", views.change_role),
    path("roles/", views.role_list),
    path("permissions/", views.permission_catalog),
    path("content/", views.content_list),
    path("content/create/", views.content_create),
    path("content/<int:content_id>/edit/", views.content_edit),
]