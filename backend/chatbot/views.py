from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from .seriealizers import ChatInputSerializer, ChatResponseSerializer
from .models import ChatSession, ChatMessage
import uuid
from django.utils import timezone
import google.generativeai as genai


GEMINI_API_KEY = "AIzaSyA-rTbNmFtZWzjqSTI9F6zsU-kG0sV-APo"  # Consider using env variable in production
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(model_name="gemini-1.5-flash")

SYSTEM_PROMPT = """
You are a specialized architectural assistant that helps with architecture and construction-related topics.

IMPORTANT FORMATTING RULES:
1. Give extremely concise responses (2-4 bullet points)
2. Use plain, simple language that non-experts can understand
3. For quantities and measurements, give specific numbers, not ranges or complex calculations
4. Always format numbers clearly (e.g., "45 bags of cement" not lengthy explanations)
5. When asked about materials, costs, or timelines, provide direct answers without showing calculations
6. Never use technical jargon without explanation
7. For complex questions, still keep answers brief with just the essential information

MATERIAL ESTIMATION GUIDELINES:
When calculating cement for concrete slabs:
- For a standard 6-inch thick slab with M25 grade concrete (1:1:2 ratio):
  • 1000 sq ft requires approximately 142 bags of cement (50kg each)
  • 2000 sq ft requires approximately 284 bags of cement
  • Scale proportionally for other areas
- This accounts for the 52% volume difference between wet and dry concrete
- Always present quantities as specific numbers, not ranges

Only answer questions related to architecture, construction, or home design. For other topics, briefly say: "I can only answer questions about building design and construction. Please ask about building materials, floor plans, costs, or similar topics."
"""

ARCHITECTURE_KEYWORDS = [
    'house', 'building', 'design', 'construction', 'architect', 'floor plan', 'blueprint',
    'renovation', 'remodel', 'structure', 'room', 'space', 'layout', 'interior', 'exterior',
    'wall', 'roof', 'ceiling', 'foundation', 'material', 'concrete', 'cement', 'brick', 'wood',
    'steel', 'glass', 'insulation', 'window', 'door', 'kitchen', 'bathroom', 'bedroom', 'living room',
    'square feet', 'sq ft', 'square yard', 'sq yard', 'dimension', 'measurement', 'budget', 'cost',
    'expense', 'timeline', 'schedule', 'permit', 'code', 'regulation', 'zoning', 'property', 'land',
    'lot', 'plot', 'sustainable', 'green', 'eco-friendly', 'energy efficient', 'solar', 'ventilation',
    'lighting', 'plumbing', 'electrical', 'HVAC', 'heating', 'cooling', 'air conditioning'
]


def calculate_cement_bags(area_sqft, thickness_inches=6, mix_ratio="1:1:2"):
    """
    Calculate cement bags required based on floor area
    
    Parameters:
    area_sqft (float): Area in square feet
    thickness_inches (float): Thickness of slab in inches
    mix_ratio (str): Cement:Sand:Aggregate ratio
    
    Returns:
    int: Number of cement bags required
    """
    thickness_ft = thickness_inches / 12
    
    wet_volume = area_sqft * thickness_ft
    
    dry_volume = wet_volume + (0.52 * wet_volume)
    
    ratio_parts = mix_ratio.split(":")
    cement_part = int(ratio_parts[0])
    total_parts = sum(int(part) for part in ratio_parts)
    
    cement_volume = (cement_part / total_parts) * dry_volume
    
    bags_required = cement_volume / 1.23
    
    return round(bags_required)


def is_architecture_related(query):
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in ARCHITECTURE_KEYWORDS)

@api_view(['POST'])
@permission_classes([AllowAny])
def chat_api(request):
    print("\n====== Incoming Request ======")
    print("Raw request body:", request.body)
    print("Parsed request.data:", request.data)

    serializer = ChatInputSerializer(data=request.data)
    if serializer.is_valid():
        print("✅ Serializer data is valid")
        validated_data = serializer.validated_data
        message = validated_data['message']
        session_id = validated_data.get('session_id', '')

        # Retrieve or create a chat session
        if session_id:
            try:
                chat_session = ChatSession.objects.get(session_id=session_id)
                print(f"🔄 Using existing session: {session_id}")
            except ChatSession.DoesNotExist:
                print(f"❌ Session ID {session_id} not found, creating new one")
                chat_session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
        else:
            chat_session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
            print(f"🆕 Created new session: {chat_session.session_id}")

        # Save the user message
        ChatMessage.objects.create(
            session=chat_session,
            role='user',
            content=message
        )

        # Use Gemini to generate response
        try:
            final_prompt = f"{SYSTEM_PROMPT}\n\nUser: {message}"
            response = model.generate_content(final_prompt, generation_config={"max_output_tokens": 300})
            assistant_reply = response.text
            print(f"✅ Gemini assistant reply: {assistant_reply}")
        except Exception as e:
            print(f"❌ Error from Gemini API: {e}")
            return JsonResponse({'error': str(e)}, status=500)

        # Save assistant message
        ChatMessage.objects.create(
            session=chat_session,
            role='assistant',
            content=assistant_reply
        )

        # Update session
        chat_session.last_updated = timezone.now()
        chat_session.save()

        response_data = {
            'response': assistant_reply,
            'session_id': chat_session.session_id
        }

        return JsonResponse(response_data, status=200)

    else:
        print("❌ Serializer validation failed")
        print("Errors:", serializer.errors)
        return JsonResponse(serializer.errors, status=400)
