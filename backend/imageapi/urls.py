from django.urls import path
from imageapi.views import GenerateHouseMapView,ConvertToSVGView

urlpatterns = [
    path('generate-house-map/',GenerateHouseMapView.as_view()),
    path('convert-to-svg/', ConvertToSVGView.as_view())
]