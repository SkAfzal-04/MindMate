import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=GEMINI_API_KEY)

# Use the Gemini 1.5 Flash model (latest lightweight)
model = genai.GenerativeModel("models/gemini-1.5-flash")

def analyze_message(user_input):
    prompt = f"""
    Analyze this therapy message and return a JSON object with the following structure:
    {{
      "emotional_state": "...",
      "themes": ["...", "..."],
      "risk_level": 0,
      "recommended_approach": "...",
      "progress_indicators": ["...", "..."]
    }}

    Message: "{user_input}"
    """

    response = model.generate_content(prompt)
    try:
        return response.text.strip()
    except Exception as e:
        return {"error": str(e)}

def generate_supportive_response(user_input, analysis):
    prompt = f"""
    Based on the user's emotional state and themes:
    Emotional State: {analysis.get("emotional_state")}
    Themes: {', '.join(analysis.get("themes", []))}

    Generate a warm, empathetic, professional response that:
    - Acknowledges their current state
    - Offers encouragement and strategies
    - Considers safety if risk level is {analysis.get("risk_level")}

    User message: "{user_input}"
    """

    response = model.generate_content(prompt)
    return response.text.strip()
