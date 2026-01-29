from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse
from .models import FloorPlan
from .seriealizers import FloorPlanSerializer
from openai import OpenAI
import os
from dotenv import load_dotenv
import cv2
import numpy as np
import svgwrite
import requests
from io import BytesIO
import base64

load_dotenv()
api_key = os.getenv('api_key')

class GenerateHouseMapView(APIView):
    client = OpenAI(base_url="https://api.a4f.co/v1",
                    api_key=api_key) 
    def post(self, request):
        serializer = FloorPlanSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
            except:
                pass 
        else:
            print("Serializer Errors (Ignored for generation):", serializer.errors)

        try:
            data = request.data
            base_prompt = self.generate_smart_base(data)
            logic_prompt = self.build_logic_instructions(data)
            custom_prompt = self.build_custom_requirements(data)
            style_prompt = self.build_style_instructions(data)
            final_prompt = f"{base_prompt} \n {logic_prompt} \n {custom_prompt} \n {style_prompt} \n Ensure all dimensions are clearly labeled in text."
            
            print(final_prompt) 

            response = self.client.images.generate(
                model="provider-4/imagen-3.5",
                prompt=final_prompt,
                n=1,
                size="1024x1024",
                )
            print(response)

            if response.data:
                image_obj = response.data[0] 
                image_url = image_obj.url 
                return JsonResponse({"image_url": image_url})
            else:
                return JsonResponse({"error": "No image generated"}, status=500)

        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({"error": str(e)}, status=500)


    def generate_smart_base(self, data):
        """Infers room structure based on Land Size and House Type."""
        land_dim = data.get('total_land_dimension', '40x60')
        house_type = data.get('house_type', 'Villa')

        if house_type == "Studio":
            return f"Design a functional Studio Apartment Floor Plan fitting exactly into a {land_dim} area. Include a combined Living/Sleeping area, a compact Kitchen, and a Bathroom."
        
        elif house_type == "Villa":
            return f"Design a spacious Family Villa Floor Plan fitting exactly into a {land_dim} area. Allocate space for 3-4 Bedrooms, a large Living Hall, Kitchen, Dining Area, and 3 Bathrooms. Ensure rooms are sized proportionally to the {land_dim} boundary."
        
        elif house_type == "Luxury House":
            return f"Design a Luxury Estate Floor Plan fitting into a {land_dim} area. Include a Master Suite with Walk-in Closet, 2 Guest Rooms, a Grand Foyer, and a Gourmet Kitchen with Island."
        
        else: # Standard House
            return f"Design a Standard Residential House Floor Plan fitting exactly into a {land_dim} area. Include 2 Bedrooms, 1 Living Room, 1 Kitchen, and 1 Common Bathroom."

    def build_logic_instructions(self, data):
        """Adds constraints for Layout, Entrance, and Location Context."""
        layout = data.get('layout_style', 'Open Concept')
        entrance = data.get('entrance_facing', 'South')
        state = data.get('state_location', '')

        prompt = ""

        # Location & Vastu Context (Crucial for Indian States)
        if state:
            prompt += f" CONTEXT: The house is located in {state}, India. "
            # Common Vastu logic: Entrance East/North is good, Kitchen SE is good.
            prompt += "Please consider basic Vastu Shastra principles for room placement where possible (e.g., Kitchen in South-East, Master Bedroom in South-West). "

        # Layout Strategy
        if layout == "Open Concept":
            prompt += " LAYOUT: Open Concept. Merge Living and Dining areas to create a sense of space. "
        elif layout == "Partitioned":
            prompt += " LAYOUT: Traditional Layout. Use walls to clearly separate the Kitchen and Living areas for privacy. "
        elif layout == "L-Shaped":
            prompt += " LAYOUT: L-Shaped Structure. Design the building footprint in an 'L' shape. "

        # Entrance
        prompt += f" ORIENTATION: The Main Entrance must be on the {entrance} side of the plan. "

        return prompt

    def build_custom_requirements(self, data):
        """Injects the user's free-text requirements."""
        reqs = data.get('custom_requirements', '').strip()
        if reqs:
            return f" IMPORTANT USER OVERRIDES: {reqs}. (Prioritize these specific instructions over general logic)."
        return ""

    def build_style_instructions(self, data):
        """Defines the visual render style."""
        style = data.get('architectural_style', 'Modern Blueprint')
        
        if style == 'Modern Blueprint':
            return " STYLE: Professional Architectural Blueprint. Deep Blue background with clean White lines. Technical font for labels."
        elif style == 'Real Estate Color':
            return " STYLE: 2D Real Estate Marketing Plan. White background, light beige floor tiles, realistic furniture shadows, and distinct room colors."
        else:
            return " STYLE: Black and White Sketch. Hand-drawn architectural aesthetic, high contrast, clean pencil lines on white paper."
        

class ConvertToSVGView(APIView):
    def post(self, request):
        image_url = request.data.get('image_url')
        if not image_url:
            return JsonResponse({"error": "Image URL is required"}, status=400)

        try:
            resp = requests.get(image_url)
            if resp.status_code != 200:
                return JsonResponse({"error": "Failed to download image"}, status=400)
            
            image_array = np.asarray(bytearray(resp.content), dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_GRAYSCALE)

            edges = cv2.Canny(image, threshold1=100, threshold2=200)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

            dwg = svgwrite.Drawing(profile='tiny')
            dwg.add(dwg.rect(insert=(0, 0), size=('100%', '100%'), fill='white'))

            for contour in contours:
                points = [(float(point[0][0]), float(point[0][1])) for point in contour]
                if len(points) > 1:
                    dwg.add(dwg.polyline(points, stroke='black', fill='none', stroke_width=2))

            svg_string = dwg.tostring()
            
            return JsonResponse({"svg_data": svg_string})

        except Exception as e:
            print(f"SVG Conversion Error: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)