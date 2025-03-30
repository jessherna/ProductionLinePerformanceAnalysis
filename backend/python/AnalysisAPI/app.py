from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
import json
import os
import sys
import logging
import pickle
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Add analysis module to path
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent.parent.parent
ANALYSIS_DIR = ROOT_DIR / "analysis"
ANALYSIS_SRC_DIR = ANALYSIS_DIR / "src"
ANALYSIS_MODELS_DIR = ANALYSIS_DIR / "models"
ANALYSIS_RESULTS_DIR = ANALYSIS_DIR / "results"

# Append analysis module to path if it exists
if ANALYSIS_SRC_DIR.exists():
    # Add the src directory directly to sys.path
    sys.path.append(str(ANALYSIS_SRC_DIR))
    logger.info(f"Added analysis module to path: {ANALYSIS_SRC_DIR}")
    # Import advanced analysis functionality if available
    try:
        from models.anomaly import load_model, predict_anomaly
        from data.preprocess import generate_synthetic_data
        HAS_ADVANCED_ANALYSIS = True
        logger.info("Successfully imported advanced analysis functionality")
    except ImportError as e:
        logger.warning(f"Could not import advanced analysis modules: {e}")
        HAS_ADVANCED_ANALYSIS = False
else:
    logger.warning(f"Analysis module not found at: {ANALYSIS_SRC_DIR}")
    HAS_ADVANCED_ANALYSIS = False

app = Flask(__name__)
CORS(app)

# Load advanced models if available
advanced_models = {}
if HAS_ADVANCED_ANALYSIS and ANALYSIS_MODELS_DIR.exists():
    try:
        for model_file in ANALYSIS_MODELS_DIR.glob("anomaly_detection_*.pkl"):
            model_name = model_file.stem.replace("anomaly_detection_", "")
            # Load model by method name rather than passing file path
            advanced_models[model_name] = load_model(model_name)
            logger.info(f"Loaded advanced model: {model_name}")
    except Exception as e:
        logger.error(f"Error loading advanced models: {e}")

# Dummy data for simulation
def generate_dummy_data(n_samples=100):
    np.random.seed(42)
    # Generate normal production data with occasional anomalies
    temp = np.random.normal(50, 5, n_samples)
    pressure = np.random.normal(100, 10, n_samples)
    speed = np.random.normal(75, 8, n_samples)
    vibration = np.random.normal(25, 3, n_samples)
    
    # Insert some anomalies
    anomaly_indices = np.random.choice(n_samples, 5, replace=False)
    temp[anomaly_indices] = np.random.normal(70, 8, 5)
    pressure[anomaly_indices] = np.random.normal(140, 15, 5)
    speed[anomaly_indices] = np.random.normal(40, 10, 5)
    vibration[anomaly_indices] = np.random.normal(40, 6, 5)
    
    data = pd.DataFrame({
        'temperature': temp,
        'pressure': pressure,
        'speed': speed,
        'vibration': vibration,
        'timestamp': pd.date_range(start='2023-01-01', periods=n_samples, freq='H')
    })
    
    return data

# Generate dummy data and train model for basic analysis
data = generate_dummy_data(1000)
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(data[['temperature', 'pressure', 'speed', 'vibration']])

# Save some predictions
data['anomaly'] = model.predict(data[['temperature', 'pressure', 'speed', 'vibration']])
data['anomaly_score'] = model.decision_function(data[['temperature', 'pressure', 'speed', 'vibration']])
anomalies = data[data['anomaly'] == -1].copy()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint that also reports availability of advanced analysis."""
    return jsonify({
        'status': 'ok',
        'advanced_analysis_available': HAS_ADVANCED_ANALYSIS,
        'advanced_models': list(advanced_models.keys()) if HAS_ADVANCED_ANALYSIS else []
    })

@app.route('/api/summary', methods=['GET'])
def get_summary():
    return jsonify({
        'total_readings': len(data),
        'anomalies_detected': len(anomalies),
        'anomaly_percentage': len(anomalies) / len(data) * 100,
        'avg_temperature': data['temperature'].mean(),
        'avg_pressure': data['pressure'].mean(),
        'avg_speed': data['speed'].mean(),
        'avg_vibration': data['vibration'].mean()
    })

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    result = anomalies.sort_values('anomaly_score').head(10)
    result_dict = []
    for _, row in result.iterrows():
        result_dict.append({
            'temperature': float(row['temperature']),
            'pressure': float(row['pressure']),
            'speed': float(row['speed']),
            'vibration': float(row['vibration']),
            'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            'anomaly_score': float(row['anomaly_score'])
        })
    return jsonify({
        'anomalies': result_dict
    })

@app.route('/api/predict', methods=['POST'])
def predict_anomaly():
    try:
        input_data = request.get_json()
        sample = np.array([[
            input_data.get('temperature', 50),
            input_data.get('pressure', 100),
            input_data.get('speed', 75),
            input_data.get('vibration', 25)
        ]])
        
        prediction = model.predict(sample)[0]
        score = model.decision_function(sample)[0]
        
        is_anomaly = prediction == -1
        
        response = {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(score),
            'recommendation': 'Maintenance required' if is_anomaly else 'Normal operation'
        }
        
        if is_anomaly:
            # Determine which feature contributed most to the anomaly
            feature_names = ['temperature', 'pressure', 'speed', 'vibration']
            normal_values = [50, 100, 75, 25]  # Expected normal values
            deviations = [abs(sample[0][i] - normal_values[i]) / normal_values[i] for i in range(4)]
            max_deviation_idx = np.argmax(deviations)
            
            response['probable_cause'] = f'Abnormal {feature_names[max_deviation_idx]}'
            
            if feature_names[max_deviation_idx] == 'temperature':
                response['recommendation'] = 'Check cooling system'
            elif feature_names[max_deviation_idx] == 'pressure':
                response['recommendation'] = 'Inspect pressure valves'
            elif feature_names[max_deviation_idx] == 'speed':
                response['recommendation'] = 'Verify motor operation'
            elif feature_names[max_deviation_idx] == 'vibration':
                response['recommendation'] = 'Check for loose components'
        
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/latest-data', methods=['GET'])
def get_latest_data():
    # Return the latest 50 data points for time series visualization
    result = data.tail(50).copy()
    result_dict = []
    for _, row in result.iterrows():
        result_dict.append({
            'temperature': float(row['temperature']),
            'pressure': float(row['pressure']),
            'speed': float(row['speed']),
            'vibration': float(row['vibration']),
            'timestamp': row['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
            'anomaly': int(row['anomaly']),
            'anomaly_score': float(row['anomaly_score'])
        })
    return jsonify({
        'data': result_dict
    })

@app.route('/api/generate-reading', methods=['GET'])
def generate_reading():
    # Generate a random reading based on normal values
    # with a small chance of anomaly
    is_anomaly = np.random.random() < 0.1
    
    if is_anomaly:
        temp = np.random.normal(70, 8)
        pressure = np.random.normal(140, 15)
        speed = np.random.normal(40, 10)
        vibration = np.random.normal(40, 6)
    else:
        temp = np.random.normal(50, 5)
        pressure = np.random.normal(100, 10)
        speed = np.random.normal(75, 8)
        vibration = np.random.normal(25, 3)
    
    return jsonify({
        'temperature': float(temp),
        'pressure': float(pressure),
        'speed': float(speed),
        'vibration': float(vibration),
        'timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    })

# Advanced Analysis Endpoints
@app.route('/api/advanced-anomaly', methods=['POST'])
def advanced_anomaly_detection():
    """Use advanced models for anomaly detection."""
    if not HAS_ADVANCED_ANALYSIS:
        return jsonify({'error': 'Advanced analysis not available'}), 503
    
    try:
        input_data = request.get_json()
        
        # Extract features
        features = np.array([[
            input_data.get('temperature', 50),
            input_data.get('pressure', 100),
            input_data.get('speed', 75),
            input_data.get('vibration', 25)
        ]])
        
        # Check which model to use
        model_name = input_data.get('model', 'isolation_forest')
        if model_name not in advanced_models:
            return jsonify({'error': f'Model {model_name} not available'}), 400
        
        # Make prediction
        advanced_model = advanced_models[model_name]
        prediction = advanced_model.predict(features)[0]
        score = advanced_model.decision_function(features)[0]
        
        is_anomaly = prediction == -1
        
        response = {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(score),
            'model': model_name,
            'recommendation': 'Maintenance required' if is_anomaly else 'Normal operation'
        }
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error in advanced anomaly detection: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/available-models', methods=['GET'])
def available_models():
    """List available advanced models."""
    models_info = {
        'basic': {
            'name': 'Basic Isolation Forest',
            'description': 'Standard anomaly detection for production data',
            'features': ['temperature', 'pressure', 'speed', 'vibration']
        }
    }
    
    if HAS_ADVANCED_ANALYSIS:
        for model_name in advanced_models:
            models_info[model_name] = {
                'name': model_name.replace('_', ' ').title(),
                'description': f'Advanced anomaly detection using {model_name.replace("_", " ").title()}',
                'features': ['temperature', 'pressure', 'speed', 'vibration'] + 
                           ['production_features'] if model_name != 'isolation_forest' else []
            }
    
    return jsonify({
        'models': models_info,
        'default_model': 'basic'
    })

@app.route('/api/analysis-results', methods=['GET'])
def get_analysis_results():
    """Get results from the advanced analysis module."""
    if not HAS_ADVANCED_ANALYSIS or not ANALYSIS_RESULTS_DIR.exists():
        return jsonify({'error': 'Analysis results not available'}), 404
    
    try:
        # Get model type from query parameters
        model_type = request.args.get('model', 'isolation_forest')
        
        # Look for results file
        results_file = ANALYSIS_RESULTS_DIR / f"anomaly_results_{model_type}.csv"
        metrics_file = ANALYSIS_RESULTS_DIR / f"anomaly_metrics_{model_type}.json"
        
        if not results_file.exists():
            return jsonify({'error': f'Results for {model_type} not found'}), 404
        
        # Load results
        results = pd.read_csv(results_file)
        
        # Load metrics if available
        metrics = None
        if metrics_file.exists():
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
        
        # Format results
        results_dict = []
        for _, row in results.head(50).iterrows():
            row_dict = {}
            for col in results.columns:
                row_dict[col] = float(row[col]) if isinstance(row[col], (int, float)) else str(row[col])
            results_dict.append(row_dict)
        
        return jsonify({
            'model': model_type,
            'metrics': metrics,
            'results': results_dict,
            'total_records': len(results)
        })
    except Exception as e:
        logger.error(f"Error retrieving analysis results: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis-plots', methods=['GET'])
def get_analysis_plots():
    """Get available analysis plots."""
    if not HAS_ADVANCED_ANALYSIS or not ANALYSIS_RESULTS_DIR.exists():
        return jsonify({'error': 'Analysis plots not available'}), 404
    
    plots_dir = ANALYSIS_RESULTS_DIR / "plots"
    if not plots_dir.exists():
        return jsonify({'error': 'Plots directory not found'}), 404
    
    try:
        plots = []
        for plot_file in plots_dir.glob("*.png"):
            plots.append({
                'name': plot_file.stem,
                'path': f"/api/plot/{plot_file.name}",
                'description': plot_file.stem.replace('_', ' ').title()
            })
        
        return jsonify({
            'plots': plots
        })
    except Exception as e:
        logger.error(f"Error listing analysis plots: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/plot/<plot_name>', methods=['GET'])
def serve_plot(plot_name):
    """Serve a specific plot image."""
    if not HAS_ADVANCED_ANALYSIS:
        return jsonify({'error': 'Analysis plots not available'}), 404
    
    plots_dir = ANALYSIS_RESULTS_DIR / "plots"
    plot_path = plots_dir / plot_name
    
    if not plot_path.exists():
        return jsonify({'error': f'Plot {plot_name} not found'}), 404
    
    # Determine file type for correct mimetype
    if plot_name.endswith('.png'):
        mimetype = 'image/png'
    elif plot_name.endswith('.jpg') or plot_name.endswith('.jpeg'):
        mimetype = 'image/jpeg'
    else:
        mimetype = 'application/octet-stream'
    
    return send_from_directory(str(plots_dir), plot_name, mimetype=mimetype)

if __name__ == '__main__':
    # Check what port to use
    port = int(os.environ.get('PORT', 5000))
    
    # Log startup information
    logger.info(f"Starting Flask API on port {port}")
    if HAS_ADVANCED_ANALYSIS:
        logger.info(f"Advanced analysis is available with {len(advanced_models)} models")
    else:
        logger.info("Advanced analysis is NOT available")
    
    app.run(host='0.0.0.0', port=port, debug=True) 