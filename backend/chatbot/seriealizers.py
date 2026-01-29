from rest_framework import serializers

class ChatInputSerializer(serializers.Serializer):
    """Serializer for chat API input"""
    message = serializers.CharField(required=True)
    session_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    history = serializers.ListField(
        child=serializers.DictField(),
        required=False
    )

class ChatResponseSerializer(serializers.Serializer):
    """Serializer for chat API response"""
    response = serializers.CharField()
    session_id = serializers.CharField(required=False)
