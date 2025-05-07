from flask import Flask, jsonify, send_from_directory
import pandas as pd
import os

app = Flask(
    __name__,
    static_folder="../frontend",
    static_url_path="/"
)

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/api/temperature")
def api_temperature():
    base = os.path.dirname(__file__)
    csv_path = os.path.join(base, "data", "delhi_temperature.csv")
    df = pd.read_csv(csv_path)
    # Expects columns: Year, Month, Temperature (°C), Max_Temp_C, Min_Temp_C
    return jsonify(df.to_dict(orient="records"))

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == "__main__":
    app.run(debug=True)
