from rest_framework import serializers
from rest_framework.authtoken.models import Token

from rbac.models import Role
from .models import User


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_lineage = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "is_active", "role", "role_lineage", "permissions"]

    def get_role(self, obj):
        return obj.role.name if obj.role else None

    def get_role_lineage(self, obj):
        # e.g. ADMIN -> ["ADMIN", "EDITOR", "USER"]
        return [r.name for r in obj.role.lineage()] if obj.role else []

    def get_permissions(self, obj):
        return sorted(obj.get_permissions())


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        default_role = Role.objects.filter(name="USER").first()
        return User.objects.create_user(role=default_role, **validated_data)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.SlugRelatedField(
        slug_field="name", queryset=Role.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "role", "is_active"]

    def create(self, validated_data):
        role = validated_data.pop("role", None) or Role.objects.filter(name="USER").first()
        return User.objects.create_user(role=role, **validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = User
        fields = ["email", "is_active", "password"]

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
            Token.objects.filter(user=instance).delete()  # sign out everywhere
        return instance