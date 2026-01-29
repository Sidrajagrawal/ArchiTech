from openai import OpenAI
import os

client = OpenAI(
  api_key=,
)


response = client.images.generate(
    model="dall-e-3",
    prompt="A professional 2D architectural floor plan of a house with two bedrooms, one kitchen, and one bathroom. The design should be minimalist and professional, with labeled rooms and walls in english",
    n=1,
    size="1024x1024"
)

print(response)