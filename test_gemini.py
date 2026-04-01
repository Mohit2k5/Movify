import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print(f"API Key loaded: {api_key is not None}")

genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config={
        "temperature": 0.7,
        "response_mime_type": "application/json",
    }
)

prompt = "Hello! Test prompt. Respond in JSON with a key called 'response_phrase'"

try:
    response = model.generate_content(prompt)
    print("Success:")
    print(response.text)
except Exception as e:
    print(f"Exception: {type(e).__name__}: {str(e)}")
