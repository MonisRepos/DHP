import os
import json
import logging
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__, static_folder="static")

# Load state and city data from JSON file
def load_states_and_cities():
    try:
        with open(os.path.join('data', 'india_states.json'), 'r') as f:
            return json.load(f)
    except Exception as e:
        logging.error(f"Error loading states and cities: {e}")
        return {}

# Get available years from temperature data
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

# Routes
@app.route("/")
def index():
    return send_from_directory('static', 'index.html')

@app.route("/about")
def about():
    return send_from_directory('static', 'about.html')

@app.route("/team")
def team():
    return send_from_directory('static', 'team.html')

@app.route("/analysis")
def analysis():
    return send_from_directory('static', 'analysis.html')

@app.route("/api/temperature")
def api_temperature():
    try:
        # Get query parameters
        state = request.args.get("state")
        city = request.args.get("city")
        year = request.args.get("year")
        month = request.args.get("month")
        day_level = request.args.get("day_level", "false").lower() == "true"
        
        # If day-level data is requested, use the daywise data files
        if day_level:
            if not city:
                # If no city is specified, default to Delhi (Safdarjung)
                city = "Safdarjung"
                
            # Path to the city's daywise data file
            base = os.path.dirname(__file__)
            csv_path = os.path.join(base, "data", "daywise_data", f"{city}.csv")
            
            if not os.path.exists(csv_path):
                logging.error(f"Day-level data not found for city: {city}")
                return jsonify({"error": f"Day-level data not available for {city}"}), 404
                
            # Read the CSV file
            df = pd.read_csv(csv_path)
            
            # Parse the date column to extract year, month, day
            df['DATE'] = pd.to_datetime(df['DATE'])
            df['Year'] = df['DATE'].dt.year
            df['Month'] = df['DATE'].dt.month
            df['Day'] = df['DATE'].dt.day
            
            # Rename columns to match frontend expectations
            df = df.rename(columns={
                'TEMP': 'Temperature (°C)',
                'MAX': 'Max_Temp_C',
                'MIN': 'Min_Temp_C'
            })
            
            # Filter based on year and month if provided
            if year:
                df = df[df['Year'] == int(year)]
            if month:
                df = df[df['Month'] == int(month)]
                
            # Return results
            return jsonify(df.to_dict(orient="records"))
        else:
            # For monthly data, determine which file to use based on city
            if city:
                # Check if we have daywise data for this city
                base = os.path.dirname(__file__)
                daywise_path = os.path.join(base, "data", "daywise_data", f"{city}.csv")
                
                if os.path.exists(daywise_path):
                    # Load the daywise data and aggregate by month
                    df = pd.read_csv(daywise_path)
                    df['DATE'] = pd.to_datetime(df['DATE'])
                    df['Year'] = df['DATE'].dt.year
                    df['Month'] = df['DATE'].dt.month
                    
                    # Group by year and month to get monthly averages
                    monthly_df = df.groupby(['Year', 'Month']).agg({
                        'TEMP': 'mean',
                        'MAX': 'max',
                        'MIN': 'min'
                    }).reset_index()
                    
                    # Rename columns
                    monthly_df = monthly_df.rename(columns={
                        'TEMP': 'Temperature (°C)',
                        'MAX': 'Max_Temp_C',
                        'MIN': 'Min_Temp_C'
                    })
                    
                    # Filter based on year and month if provided
                    if year:
                        monthly_df = monthly_df[monthly_df['Year'] == int(year)]
                    if month:
                        monthly_df = monthly_df[monthly_df['Month'] == int(month)]
                        
                    return jsonify(monthly_df.to_dict(orient="records"))
                else:
                    # Fall back to Delhi data if city not found
                    logging.warning(f"Data not found for {city}, using Delhi data instead")
            
            # If no specific city or data not found, use the default Delhi data
            csv_path = os.path.join(os.path.dirname(__file__), "data", "delhi_temperature.csv")
            df = pd.read_csv(csv_path)
            
            # Rename columns
            df = df.rename(columns={
                'Avg_Temp_C': 'Temperature (°C)',
                'Max_Temp_C': 'Max_Temp_C',
                'Min_Temp_C': 'Min_Temp_C'
            })
            
            # Filter based on parameters
            if year:
                df = df[df['Year'] == int(year)]
            if month:
                df = df[df['Month'] == int(month)]
                
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