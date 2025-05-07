from flask import Flask, jsonify, send_from_directory, request, render_template
import pandas as pd
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "weather-analysis-app-secret")

# Load available states and cities from a JSON file
def load_states_and_cities():
    try:
        with open(os.path.join('data', 'india_states.json'), 'r') as f:
            data = json.load(f)
        return data
    except Exception as e:
        logging.error(f"Error loading states and cities: {e}")
        return {"states": []}

# Get available years from data
def get_available_years():
    try:
        base = os.path.dirname(__file__)
        csv_path = os.path.join(base, "data", "delhi_temperature.csv")
        df = pd.read_csv(csv_path)
        years = sorted(df['Year'].unique().tolist())
        return years
    except Exception as e:
        logging.error(f"Error getting available years: {e}")
        return []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/team")
def team():
    return render_template("team.html")

@app.route("/analysis")
def analysis():
    # Get available states, cities, and years for dropdowns
    states_and_cities = load_states_and_cities()
    available_years = get_available_years()
    
    # Set default selections
    selected_state = request.args.get("state", "Delhi")
    selected_city = request.args.get("city", "Delhi")
    selected_year = request.args.get("year", str(available_years[-1]) if available_years else "2022")
    
    return render_template("analysis.html", 
                          states_and_cities=states_and_cities,
                          available_years=available_years,
                          selected_state=selected_state,
                          selected_city=selected_city,
                          selected_year=selected_year)

@app.route("/api/temperature")
def api_temperature():
    base = os.path.dirname(__file__)
    csv_path = os.path.join(base, "data", "delhi_temperature.csv")
    
    try:
        df = pd.read_csv(csv_path)
        
        # Rename columns to match what the frontend expects
        df = df.rename(columns={
            'Avg_Temp_C': 'Temperature (°C)',
            'Max_Temp_C': 'Max_Temp_C',
            'Min_Temp_C': 'Min_Temp_C'
        })
        
        # Filter data based on query parameters
        state = request.args.get("state")
        city = request.args.get("city")
        year = request.args.get("year")
        month = request.args.get("month")
        
        # Note: In a real app, we would filter based on state and city
        # For now, we're just using delhi_temperature.csv for all cases
        
        if year:
            df = df[df['Year'] == int(year)]
        if month:
            df = df[df['Month'] == int(month)]
            
        # Return data as JSON
        return jsonify(df.to_dict(orient="records"))
    except Exception as e:
        logging.error(f"Error processing temperature data: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/states")
def api_states():
    states_and_cities = load_states_and_cities()
    return jsonify(states_and_cities)

@app.route("/api/years")
def api_years():
    available_years = get_available_years()
    return jsonify(available_years)

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
