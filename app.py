import os
import sqlite3
from flask import Flask, request, jsonify, send_from_directory
import json
import requests
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Serve static files from the compiled React build
app = Flask(__name__, static_url_path='', static_folder='frontend/dist', template_folder='frontend/dist')

DB_FILE = "database.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)''')
    # Reviews table
    c.execute('''CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY, movie_id TEXT, username TEXT, rating INTEGER, text TEXT, date TEXT)''')
    conn.commit()
    conn.close()

# Serve main webpage
@app.route('/')
def index():
    return send_from_directory('frontend/dist', 'index.html')

# API Endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT password FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    if row and row[0] == password:
        return jsonify({'success': True, 'username': username})
    return jsonify({'success': False, 'message': 'Invalid username or password'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'success': False, 'message': 'Credentials required'})
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
        conn.commit()
        success = True
        msg = "Registered successfully"
    except sqlite3.IntegrityError:
        success = False
        msg = "Username already exists"
    conn.close()
    return jsonify({'success': success, 'message': msg})

@app.route('/api/reviews/<movie_id>', methods=['GET'])
def get_reviews(movie_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT username, rating, text, date FROM reviews WHERE movie_id = ? ORDER BY id DESC", (movie_id,))
    rows = c.fetchall()
    conn.close()
    reviews = [{'user': r[0], 'rating': r[1], 'text': r[2], 'date': r[3]} for r in rows]
    return jsonify(reviews)

@app.route('/api/reviews', methods=['POST'])
def post_review():
    data = request.json
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO reviews (movie_id, username, rating, text, date) VALUES (?, ?, ?, ?, ?)",
              (data['movie_id'], data['username'], data['rating'], data['text'], data['date']))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/my_reviews/<username>', methods=['GET'])
def my_reviews(username):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT movie_id, rating, text, date, id FROM reviews WHERE username = ? ORDER BY id DESC", (username,))
    rows = c.fetchall()
    conn.close()
    reviews = [{'movie_id': r[0], 'rating': r[1], 'text': r[2], 'date': r[3], 'id': r[4]} for r in rows]
    return jsonify(reviews)

@app.route('/api/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# TMDB Proxy Route
@app.route('/api/tmdb/<path:subpath>', methods=['GET'])
def tmdb_proxy(subpath):
    tmdb_url = f"https://api.themoviedb.org/3/{subpath}"
    target_params = request.args.to_dict()
    target_params['api_key'] = os.environ.get("TMDB_API_KEY")
    
    try:
        resp = requests.get(tmdb_url, params=target_params)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Powerful Chatbot Backend Logic mapping pure language to TMDB APIs dynamically
@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    text = data.get('message', '').lower()
    prompt = f"""
    You are the AI assistant for Movify, a premium movie platform. 
    Communicate like a normal, friendly, empathetic person. The user wants a movie recommendation based on their mood, preference, or prompt.
    Respond in JSON format ONLY with these exact keys:
    - "response_phrase": A highly conversational, engaging, and empathetic response reacting to what they said. If they just say "hello", greet them warmly and ask how you can help them find a movie today.
    - "target_genre": A TMDB genre ID (integer) if they describe a mood/genre (28=Action, 12=Adventure, etc). Set to null if looking for a specific movie or if the user is just saying hello or making small talk!
    - "search_query": A specific movie name, actor, or keyword. Set to null if you provided a target_genre instead, or if the user is just saying hello or making small talk!
    
    User Input: "{text}"
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
            )
        )
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:].strip()
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3].strip()
        
        ai_data = json.loads(text_resp)
        return jsonify(ai_data)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return jsonify({
            'target_genre': None,
            'response_phrase': "I'm having a little trouble connecting to my neural network right now, but I scanned our archives and found a great match for what you asked!",
            'search_query': text
        })

if __name__ == '__main__':
    init_db()
    # Runs the Python Web Backend locally on port 5000
    app.run(port=5000, debug=True)
