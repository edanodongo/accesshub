import re

from rest_framework import serializers

from .models import AuditLog, Permission, Role
from .policy import missing_for

CODENAME_RE = re.compile(r"^[a-z][a-z_]*\.[a-z][a-z_]*$")
ROLE_NAME_RE = re.compile(r"^[A-Z][A-Z0-9_]{1,49}$")


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "codename", "description", "is_system"]
        read_only_fields = ["is_system"]

    def validate_codename(self, value):
        if not CODENAME_RE.match(value):
            raise serializers.ValidationError(
                "Use lowercase letters and underscores in the form area.action, e.g. reports.view"
            )
        if self.instance and value != self.instance.codename:
            raise serializers.ValidationError(
                "A codename cannot be changed: code refers to it by name."
            )
        return value


class RoleSerializer(serializers.ModelSerializer):
    # Reads AND writes the parent by name ("EDITOR"), or null for no parent.
    parent = serializers.SlugRelatedField(
        slug_field="name", queryset=Role.objects.all(), allow_null=True, required=False
    )
    own_permissions = serializers.SerializerMethodField()
    effective_permissions = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id", "name", "description", "parent", "is_system",
            "own_permissions", "effective_permissions", "user_count",
        ]
        read_only_fields = ["is_system"]

    def get_own_permissions(self, obj):
        return sorted(p.codename for p in obj.permissions.all())

    def get_effective_permissions(self, obj):
        return sorted(obj.effective_permissions())

    def get_user_count(self, obj):
        return obj.users.count()

    def validate_name(self, value):
        if not ROLE_NAME_RE.match(value):
            raise serializers.ValidationError(
                "Use 2-50 characters: capital letters, digits and underscores, starting with a letter."
            )
        return value

    def validate(self, attrs):
        role = self.instance
        parent = attrs.get("parent")

        if role and role.is_system:
            if "name" in attrs and attrs["name"] != role.name:
                raise serializers.ValidationError({"name": "Built-in roles cannot be renamed."})
            if "parent" in attrs and parent != role.parent:
                raise serializers.ValidationError({"parent": "Built-in roles keep their parent."})

        if parent is not None:
            # Walking up from the new parent must never reach the role itself.
            if role and (parent.pk == role.pk or role.pk in [r.pk for r in parent.lineage()]):
                raise serializers.ValidationError(
                    {"parent": "That would create a loop: a role cannot inherit from itself or its own descendants."}
                )
            actor = self.context["request"].user
            missing = missing_for(actor, parent.effective_permissions())
            if missing:
                raise serializers.ValidationError(
                    {"parent": f"That parent grants permissions you do not hold: {', '.join(sorted(missing))}"}
                )
        return attrs


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id", "created_at", "actor_name", "action",
            "target_type", "target_repr", "details", "ip_address",
        ]