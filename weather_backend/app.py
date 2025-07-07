import os
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("WEATHERAPI_KEY")
BASE    = "http://api.weatherapi.com/v1"

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///weather.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
CORS(app)

class WeatherRecord(db.Model):
    id          = db.Column(db.Integer, primary_key=True)
    location    = db.Column(db.String(128), nullable=False)
    start_date  = db.Column(db.Date,   nullable=False)
    end_date    = db.Column(db.Date,   nullable=False)
    data        = db.Column(db.JSON,   nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

def call_weatherapi(endpoint, params):
    params.update({"key": API_KEY})
    r = requests.get(f"{BASE}/{endpoint}.json", params=params)
    r.raise_for_status()
    return r.json()

# ==== CREATE & FETCH endpoint ====
@app.route("/records", methods=["POST"])
def create_record():
    body = request.get_json() or {}
    loc = body.get("location", "").strip()
    sd  = body.get("start_date", "")
    ed  = body.get("end_date", "")

    # 1) Validate inputs
    if not (loc and sd and ed):
        return jsonify({"error":"Provide location, start_date, end_date"}), 400
    try:
        dt_start = datetime.strptime(sd, "%Y-%m-%d").date()
        dt_end   = datetime.strptime(ed, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error":"Dates must be YYYY-MM-DD"}), 400
    if dt_end < dt_start:
        return jsonify({"error":"end_date must be ≥ start_date"}), 400

    # 2) Fetch historical forecast
    try:
        history = call_weatherapi("history", {
            "q": loc,
            "dt": sd,
            "end_dt": ed
        })
        days = history["forecast"]["forecastday"]
    except requests.HTTPError as e:
        msg = e.response.json().get("error", {}).get("message", str(e))
        return jsonify({"error":msg}), e.response.status_code

    # 3) Persist record
    record = WeatherRecord(
        location   = loc,
        start_date = dt_start,
        end_date   = dt_end,
        data       = days
    )
    db.session.add(record)
    db.session.commit()

    # 4) Return the fetched data
    return jsonify({
        "id":   record.id,
        "data": days
    }), 201

# ==== READ ALL ====
@app.route("/records", methods=["GET"])
def list_records():
    recs = WeatherRecord.query.order_by(WeatherRecord.created_at.desc()).all()
    return jsonify([{
        "id":         r.id,
        "location":   r.location,
        "start_date": r.start_date.isoformat(),
        "end_date":   r.end_date.isoformat(),
        "data":       r.data,
        "created_at": r.created_at.isoformat()
    } for r in recs])

# ==== READ ONE ====
@app.route("/records/<int:record_id>", methods=["GET"])
def get_record(record_id):
    r = WeatherRecord.query.get_or_404(record_id)
    return jsonify({
        "id":         r.id,
        "location":   r.location,
        "start_date": r.start_date.isoformat(),
        "end_date":   r.end_date.isoformat(),
        "data":       r.data,
        "created_at": r.created_at.isoformat()
    })

# ==== UPDATE ====
@app.route("/records/<int:record_id>", methods=["PUT"])
def update_record(record_id):
    r    = WeatherRecord.query.get_or_404(record_id)
    body = request.get_json() or {}
    loc  = body.get("location", r.location).strip()
    sd   = body.get("start_date", r.start_date.isoformat())
    ed   = body.get("end_date",   r.end_date.isoformat())

    # same validations as create
    try:
        dt_start = datetime.strptime(sd, "%Y-%m-%d").date()
        dt_end   = datetime.strptime(ed, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error":"Dates must be YYYY-MM-DD"}), 400
    if dt_end < dt_start:
        return jsonify({"error":"end_date must be ≥ start_date"}), 400

    # re-fetch history
    try:
        history = call_weatherapi("history", {
            "q": loc, "dt": sd, "end_dt": ed
        })
        days = history["forecast"]["forecastday"]
    except requests.HTTPError as e:
        msg = e.response.json().get("error", {}).get("message", str(e))
        return jsonify({"error":msg}), e.response.status_code

    # update and commit
    r.location   = loc
    r.start_date = dt_start
    r.end_date   = dt_end
    r.data       = days
    db.session.commit()

    return jsonify({"id": r.id, "data": days})

# ==== DELETE ====
@app.route("/records/<int:record_id>", methods=["DELETE"])
def delete_record(record_id):
    r = WeatherRecord.query.get_or_404(record_id)
    db.session.delete(r)
    db.session.commit()
    return jsonify({"deleted": record_id})

if __name__ == "__main__":
    app.run(
      port=int(os.getenv("PORT", 5000)),
      debug=os.getenv("DEBUG", "False") == "True"
    )
