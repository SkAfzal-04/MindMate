from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from gemini_utils import analyze_message
import os, uuid
import google.generativeai as genai  # ✅ Gemini

# Load env variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DB_NAME = "mindmate"

# Debug: Show API key load status
print("✅Loaded Gemini API Key:", bool(GEMINI_API_KEY))

# Setup Gemini AI
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")  # ✅ fast & reliable

# Flask app setup
app = Flask(__name__)
app.secret_key = "super_secret_key"
CORS(app)

# MongoDB setup
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_col = db["users"]
data_col = db["user_data"]

# Create unique user ID
def generate_user_id(name):
    return f"{name.lower()}_{str(uuid.uuid4())[:5]}"

def generate_gpt_response(user_input, emotion):
    prompt = f"""
You are a licensed virtual therapist.

The user says: "{user_input}"
They are feeling: {emotion}

Your job is to:
1. Validate their emotions using a warm and empathetic tone. (💬)
2. Offer a short coping strategy or mindful suggestion. (🛠️)
3. End with a short motivational quote or uplifting message. (🌟)

➤ Respond using HTML tags, not Markdown.
➤ Use <b> for bold headings and <br> for line breaks.
➤ Include emojis naturally.
➤ Keep response in 3 short sections.

Format exactly like this:

💬 <b>How You're Feeling</b><br>
(Short paragraph validating emotion)<br><br>

🛠️ <b>What You Can Try</b><br>
(Short paragraph with a coping strategy)<br><br>

🌟 <b>A Little Boost</b><br>
(Short motivational quote or message)
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()  # No triple quotes, just the HTML
    except Exception as e:
        return f"<b>⚠️ Sorry, something went wrong:</b> {e}"


# --- ROUTES ---

@app.route("/", methods=["GET"])
def index():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login():
    name = request.form["name"]
    password = request.form["password"]
    user = users_col.find_one({"name": name})

    if user:
        if not check_password_hash(user["password"], password):
            return render_template("login.html", error="Incorrect password.")
        session["user_id"] = user["user_id"]
        session["chat_history"] = []
        return redirect(url_for("chat"))
    else:
        user_id = generate_user_id(name)
        hashed_password = generate_password_hash(password)
        users_col.insert_one({"name": name, "password": hashed_password, "user_id": user_id})
        data_col.insert_one({"user_id": user_id, "sessions": []})
        session["user_id"] = user_id
        session["chat_history"] = []
        return redirect(url_for("chat"))

@app.route("/chat", methods=["GET", "POST"])
def chat():
    if "user_id" not in session:
        return redirect(url_for("index"))

    if "chat_history" not in session:
        session["chat_history"] = []

    if request.method == "POST":
        user_input = request.form["message"]

        # Step 1: Analyze emotion
        emotion = analyze_message(user_input)

        # Step 2: Get Gemini response
        support_message = generate_gpt_response(user_input, emotion)

        # Step 3: Store session locally
        session["chat_history"].append({
            "input": user_input,
            "emotion": emotion,
            "response": support_message,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
        })

        # Step 4: Store in MongoDB
        data_col.update_one(
            {"user_id": session["user_id"]},
            {"$push": {
                "sessions": {
                    "timestamp": datetime.utcnow(),
                    "input": user_input,
                    "emotion": emotion,
                    "response": support_message
                }
            }}
        )

        return jsonify({"response": support_message})

    return render_template("chat.html", sessions=session["chat_history"])

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# --- MAIN ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=7860, debug=True)
