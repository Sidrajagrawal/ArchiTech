from rest_framework import serializers
from .models import FloorPlan

class FloorPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = FloorPlan
        fields = '__all__'
        extra_kwargs = {
            'house_type': {'required': True},
            'total_land_dimension': {'required': True},
            'guest_room_dimension': {'required': False},
            'bedroom_dimension': {'required': False},
            'living_room_dimension': {'required': False},
            'garage_dimension': {'required': False},
            'kitchen_dimension': {'required': False},
            'balcony_dimension': {'required': False},
            'dining_room_dimension': {'required': False},
            'foyer_dimension': {'required': False},
        }
