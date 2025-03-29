from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd
import json
import os

app = Flask(__name__)
CORS(app)

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

# Generate dummy data and train model
data = generate_dummy_data(1000)
model = IsolationForest(contamination=0.05, random_state=42)
model.fit(data[['temperature', 'pressure', 'speed', 'vibration']])

# Save some predictions
data['anomaly'] = model.predict(data[['temperature', 'pressure', 'speed', 'vibration']])
data['anomaly_score'] = model.decision_function(data[['temperature', 'pressure', 'speed', 'vibration']])
anomalies = data[data['anomaly'] == -1].copy()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 