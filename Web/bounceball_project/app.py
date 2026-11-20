from flask import Flask, request, jsonify, render_template, abort
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from pathlib import Path

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///book.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# =====================
# DATABASE MODELS
# =====================

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date_accessed = db.Column(db.DateTime, default=datetime.now)
    username = db.Column(db.String(80), unique=True, nullable=False)

class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_identifier = db.Column(db.String(100), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)

class GameData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"))
    game_id = db.Column(db.Integer, db.ForeignKey("game.id"))
    score = db.Column(db.Integer, default=0)
    extra = db.Column(db.JSON, nullable=True, default=dict)

# =====================
# ROUTES
# =====================

@app.route("/js-log", methods=["POST"])
def js_log():
    data = request.get_json(silent=True) or {}
    print("JS LOG:", data.get("log"))
    return "", 204

@app.route("/log", methods=["POST"])
def log():
    data = request.get_json(silent=True) or {}
    print(f"[CLIENT LOG] {data.get('message')}")
    return jsonify({"status": "ok"})

@app.route("/")
def index():
    games = Game.query.all()
    return render_template("index.html", games=games)

@app.route("/game/<game_identifier>")
def load_game(game_identifier):
    game = Game.query.filter_by(game_identifier=game_identifier).first()
    if not game:
        abort(404)
    return render_template("game.html", game=game)

@app.route("/submit_username", methods=["POST"])
def submit_username():
    data = request.get_json(silent=True) or {}
    username = data.get("username") or "guest"
    game_identifier = data.get("game_identifier")

    if not game_identifier:
        return jsonify({"error": "Missing game_identifier"}), 400

    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username)
        db.session.add(user)
        db.session.commit()

    game = Game.query.filter_by(game_identifier=game_identifier).first()
    if not game:
        return jsonify({"error": "Game not found"}), 404

    highscore = GameData.query.filter_by(
        user_id=user.id,
        game_id=game.id
    ).first()

    score = highscore.score if highscore else 0
    return jsonify({"username": username, "highscore": score})

@app.route("/submit_score", methods=["POST"])
def submit_score():
    data = request.get_json(silent=True) or {}
    username = data.get("username") or "guest"
    score = data.get("score", 0)
    game_identifier = data.get("game_identifier")
    extra = data.get("extra") or {}

    game = Game.query.filter_by(game_identifier=game_identifier).first()
    if not game:
        return jsonify({"error": "Game not found"}), 404

    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username)
        db.session.add(user)
        db.session.commit()

    highscore = GameData.query.filter_by(
        user_id=user.id,
        game_id=game.id
    ).first()

    if not highscore:
        highscore = GameData(
            user_id=user.id,
            game_id=game.id,
            score=score,
            extra=extra
        )
        db.session.add(highscore)
    else:
        if score > highscore.score:
            highscore.score = score

        current_extra = dict(highscore.extra or {})
        for key, value in extra.items():
            if isinstance(value, (int, float)) and value > current_extra.get(key, 0):
                current_extra[key] = value
        highscore.extra = current_extra

    db.session.commit()

    return jsonify({"highscore": highscore.score, "extra": highscore.extra})

def load_games_from_json():
    json_path = Path("games.json")
    if not json_path.exists():
        print("No games.json found")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        games = json.load(f)

    for game_data in games:
        game = Game.query.filter_by(
            game_identifier=game_data["game_identifier"]
        ).first()

        if not game:
            game = Game(
                game_identifier=game_data["game_identifier"],
                title=game_data["title"],
                description=game_data.get("description", "")
            )
            db.session.add(game)

    db.session.commit()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        load_games_from_json()
    app.run(debug=True)

