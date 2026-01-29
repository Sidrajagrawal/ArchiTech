import os
from openai import OpenAI
from flask import Flask, request, jsonify, render_template, redirect, url_for
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize OpenAI client
client = OpenAI(
  api_key="******",
)
# System prompt to define the chatbot's behavior
SYSTEM_PROMPT = """
You are a specialized architectural assistant that helps with architecture and construction-related topics.

IMPORTANT FORMATTING RULES:
1. Give extremely concise responses (2-4 bullet points )
2. Use plain, simple language that non-experts can understand
3. For quantities and measurements, give specific numbers, not ranges or complex calculations
4. Always format numbers clearly (e.g., "45 bags of cement" not lengthy explanations)
5. When asked about materials, costs, or timelines, provide direct answers without showing calculations
6. Never use technical jargon without explanation
7. For complex questions, still keep answers brief with just the essential information

Examples of good responses:
- Question: "How much cement is needed for a 2000 sq ft house?"
  Response: "You'll need approximately 400-450 bags of cement (50kg each) for a 2000 sq ft house with standard construction. This includes foundation, walls, and basic finishing."

- Question: "What's the budget for a 1500 sq ft house?"
  Response: "A 1500 sq ft house typically costs $225,000-$300,000 depending on location and finishes. This averages to $150-$200 per square foot for standard construction quality."

Only answer questions related to architecture, construction, or home design. For other topics, briefly say: "I can only answer questions about building design and construction. Please ask about building materials, floor plans, costs, or similar topics."

"""

# List of architecture-related keywords to help with initial filtering
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

def is_architecture_related(query):
    """
    Basic check to see if the query is likely architecture-related.
    """
    query_lower = query.lower()
    
    # Check for architecture keywords
    for keyword in ARCHITECTURE_KEYWORDS:
        if keyword in query_lower:
            return True
            
    # Default to letting the model handle the filtering
    return False

# Main landing page route
@app.route('/')
def landing():
    return render_template('index.html')

# Chatbot interface route
@app.route('/chatbot')
def chatbot():
    return render_template('chatbot.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])
    
    if not is_architecture_related(user_message) and len(user_message.split()) > 3:
        non_architecture_response = "I can only answer questions about building design and construction. Please ask about building materials, floor plans, costs, or similar topics."
        return jsonify({"response": non_architecture_response})
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    for msg in conversation_history:
        messages.append({"role": msg["role"], "content": msg["content"]})
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        # Call the OpenAI API
        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=messages,
            temperature=0.5,  # Reduced temperature for more precise answers
            max_tokens=150    # Reduced token limit to force concise responses
        )
        
        # Extract the assistant's reply
        assistant_message = response.choices[0].message.content
        
        return jsonify({
            "response": assistant_message
        })
    except Exception as e:
        app.logger.error(f"Error calling OpenAI API: {str(e)}")
        return jsonify({
            "response": "Sorry, I couldn't process your request. Please try again."
        }), 500

if __name__ == '__main__':
    app.run(debug=True)