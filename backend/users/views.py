from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from rbac.models import Permission, Role
from rbac.permissions import require_permission
from .models import User
from .serializers import RegisterSerializer, UserSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "message": "Hello from Django!"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data}, status=201
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    user = authenticate(
        username=request.data.get("username"),
        password=request.data.get("password"),
    )
    if user is None:
        return Response({"detail": "Invalid username or password."}, status=401)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
def logout_view(request):
    request.user.auth_token.delete()
    return Response(status=204)


@api_view(["GET"])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("users.view")])
def user_list(request):
    users = User.objects.select_related("role").order_by("id")
    return Response(UserSerializer(users, many=True).data)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated, require_permission("users.change_role")])
def change_role(request, user_id):
    target = get_object_or_404(User, pk=user_id)
    if target == request.user:
        return Response({"detail": "You cannot change your own role."}, status=400)
    role = get_object_or_404(Role, name=request.data.get("role"))
    target.role = role
    target.save(update_fields=["role"])
    return Response(UserSerializer(target).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("roles.view")])
def role_list(request):
    roles = Role.objects.select_related("parent").prefetch_related("permissions")
    return Response([
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "parent": r.parent.name if r.parent else None,
            "own_permissions": sorted(p.codename for p in r.permissions.all()),
            "effective_permissions": sorted(r.effective_permissions()),
        }
        for r in roles
    ])

@api_view(["GET"])
def permission_catalog(request):
    """Every permission that exists in the system (any logged-in user)."""
    return Response(
        list(Permission.objects.order_by("codename").values("codename", "description"))
    )


# --- Stub endpoints so every permission has something real to test against ---

@api_view(["GET"])
@permission_classes([IsAuthenticated, require_permission("content.view")])
def content_list(request):
    return Response([{"id": 1, "title": "Welcome post"}, {"id": 2, "title": "Release notes"}])


@api_view(["POST"])
@permission_classes([IsAuthenticated, require_permission("content.create")])
def content_create(request):
    return Response({"id": 3, "title": request.data.get("title", "Untitled")}, status=201)


@api_view(["PUT"])
@permission_classes([IsAuthenticated, require_permission("content.edit")])
def content_edit(request, content_id):
    return Response({"id": content_id, "updated": True})