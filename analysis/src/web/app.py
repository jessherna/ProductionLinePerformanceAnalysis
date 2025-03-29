#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Flask web application for serving the production line analysis results.

This application provides:
1. A dashboard with key findings and visualizations
2. API endpoints for accessing analysis results
3. Interactive charts for exploring the data
"""

import os
import sys
import logging
from pathlib import Path
import json
import pandas as pd
import numpy as np
from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Define paths
CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent.parent
DATA_DIR = ROOT_DIR / "data"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = ROOT_DIR / "models"
RESULTS_DIR = ROOT_DIR / "results"
PLOTS_DIR = RESULTS_DIR / "plots"
STATIC_DIR = CURRENT_DIR / "static"
TEMPLATES_DIR = CURRENT_DIR / "templates"

# Initialize Flask app
app = Flask(
    __name__,
    static_folder=str(STATIC_DIR),
    template_folder=str(TEMPLATES_DIR)
)
CORS(app)

# Ensure directories exist
def ensure_dirs_exist():
    """Create necessary directories if they don't exist."""
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create symbolic link to plots directory in static
    plots_link = STATIC_DIR / "plots"
    if not plots_link.exists():
        try:
            os.symlink(PLOTS_DIR, plots_link, target_is_directory=True)
        except Exception as e:
            logger.warning(f"Could not create symbolic link: {e}")
            # If symlink fails, copy plot files
            plots_link.mkdir(exist_ok=True)
            for plot_file in PLOTS_DIR.glob("*.png"):
                os.system(f"cp {plot_file} {plots_link}/{plot_file.name}")

# Load data and results
def load_data_and_results():
    """Load processed data and anomaly detection results."""
    data = {}
    
    # Load processed data
    try:
        train_file = PROCESSED_DATA_DIR / "train_processed.pkl"
        if train_file.exists():
            data["train"] = pd.read_pickle(train_file)
            logger.info(f"Loaded training data: {data['train'].shape}")
        else:
            logger.warning("Training data not found.")
    except Exception as e:
        logger.error(f"Error loading training data: {e}")
    
    # Load anomaly detection results
    methods = ["isolation_forest", "local_outlier_factor", "one-class_svm", "elliptic_envelope"]
    data["anomaly_results"] = {}
    
    for method in methods:
        results_file = RESULTS_DIR / f"anomaly_results_{method}.csv"
        metrics_file = RESULTS_DIR / f"anomaly_metrics_{method}.json"
        
        if results_file.exists():
            try:
                results = pd.read_csv(results_file)
                data["anomaly_results"][method] = {
                    "results": results,
                    "metrics": None
                }
                
                if metrics_file.exists():
                    with open(metrics_file, 'r') as f:
                        metrics = json.load(f)
                    data["anomaly_results"][method]["metrics"] = metrics
                
                logger.info(f"Loaded anomaly results for {method}")
            except Exception as e:
                logger.error(f"Error loading anomaly results for {method}: {e}")
    
    return data

# Define routes
@app.route('/')
def index():
    """Home page route."""
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard page with visualizations."""
    return render_template('dashboard.html')

@app.route('/anomalies')
def anomalies():
    """Anomaly detection results page."""
    return render_template('anomalies.html')

@app.route('/api/anomaly-summary')
def anomaly_summary():
    """API endpoint for anomaly detection summary."""
    summary = {}
    
    for method, results_data in app.config['data']['anomaly_results'].items():
        if results_data['results'] is not None:
            results = results_data['results']
            metrics = results_data['metrics']
            
            method_name = method.replace('_', ' ').title()
            anomaly_count = results['anomaly'].sum()
            total_samples = len(results)
            anomaly_percentage = (anomaly_count / total_samples) * 100
            
            summary[method] = {
                'method': method_name,
                'anomaly_count': int(anomaly_count),
                'total_samples': total_samples,
                'anomaly_percentage': round(anomaly_percentage, 2)
            }
            
            if metrics:
                # Add select metrics if available
                precision = metrics.get('precision', 'N/A')
                recall = metrics.get('recall', 'N/A')
                f1 = metrics.get('f1', 'N/A')
                
                summary[method].update({
                    'precision': precision,
                    'recall': recall,
                    'f1': f1
                })
    
    return jsonify(summary)

@app.route('/api/plots')
def list_plots():
    """API endpoint to list available plots."""
    plots = []
    
    for plot_file in PLOTS_DIR.glob("*.png"):
        plots.append({
            'name': plot_file.stem,
            'url': f"/static/plots/{plot_file.name}"
        })
    
    return jsonify(plots)

# Main function to run the app
def main():
    """Main function to run the Flask app."""
    logger.info("Starting Flask application...")
    ensure_dirs_exist()
    
    # Load data and results
    app.config['data'] = load_data_and_results()
    
    # Check if template files exist, copy example templates if not
    index_template = TEMPLATES_DIR / "index.html"
    dashboard_template = TEMPLATES_DIR / "dashboard.html"
    anomalies_template = TEMPLATES_DIR / "anomalies.html"
    
    # Create example templates if they don't exist
    # We would normally have these files in the repository
    # but we'll generate them here for this example
    if not index_template.exists():
        with open(index_template, 'w') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Production Line Analysis</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="/">Production Line Analysis</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item active">
                    <a class="nav-link" href="/">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/anomalies">Anomalies</a>
                </li>
            </ul>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="jumbotron">
            <h1>Production Line Performance Analysis</h1>
            <p class="lead">Analysis of Bosch production line data</p>
            <hr class="my-4">
            <p>This application presents analysis results from the Bosch Production Line Performance dataset.</p>
            <a class="btn btn-primary btn-lg" href="/dashboard" role="button">View Dashboard</a>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="{{ url_for('static', filename='js/main.js') }}"></script>
</body>
</html>
            """)
    
    if not dashboard_template.exists():
        with open(dashboard_template, 'w') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard - Production Line Analysis</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="/">Production Line Analysis</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="/">Home</a>
                </li>
                <li class="nav-item active">
                    <a class="nav-link" href="/dashboard">Dashboard</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/anomalies">Anomalies</a>
                </li>
            </ul>
        </div>
    </nav>

    <div class="container mt-4">
        <h1>Production Line Dashboard</h1>
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Anomaly Detection Summary
                    </div>
                    <div class="card-body">
                        <div id="anomaly-summary"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        Production Line Metrics
                    </div>
                    <div class="card-body">
                        <div id="metrics-chart"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        Available Visualizations
                    </div>
                    <div class="card-body">
                        <div class="row" id="plot-gallery"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="{{ url_for('static', filename='js/dashboard.js') }}"></script>
</body>
</html>
            """)
    
    if not anomalies_template.exists():
        with open(anomalies_template, 'w') as f:
            f.write("""
<!DOCTYPE html>
<html>
<head>
    <title>Anomalies - Production Line Analysis</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <a class="navbar-brand" href="/">Production Line Analysis</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link" href="/">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/dashboard">Dashboard</a>
                </li>
                <li class="nav-item active">
                    <a class="nav-link" href="/anomalies">Anomalies</a>
                </li>
            </ul>
        </div>
    </nav>

    <div class="container mt-4">
        <h1>Anomaly Detection Results</h1>
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        Anomaly Detection Methods
                    </div>
                    <div class="card-body">
                        <div class="method-tabs">
                            <ul class="nav nav-tabs" id="method-tabs" role="tablist">
                                <li class="nav-item">
                                    <a class="nav-link active" id="isolation-forest-tab" data-toggle="tab" href="#isolation-forest" role="tab">Isolation Forest</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" id="lof-tab" data-toggle="tab" href="#lof" role="tab">Local Outlier Factor</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" id="ocsvm-tab" data-toggle="tab" href="#ocsvm" role="tab">One-Class SVM</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" id="elliptic-tab" data-toggle="tab" href="#elliptic" role="tab">Elliptic Envelope</a>
                                </li>
                            </ul>
                            <div class="tab-content mt-3" id="method-content">
                                <div class="tab-pane fade show active" id="isolation-forest" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>Isolation Forest Results</h4>
                                            <div id="if-metrics"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <img src="/static/plots/anomalies_isolation_forest.png" class="img-fluid" alt="Isolation Forest Results">
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="lof" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>Local Outlier Factor Results</h4>
                                            <div id="lof-metrics"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <img src="/static/plots/anomalies_local_outlier_factor.png" class="img-fluid" alt="Local Outlier Factor Results">
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="ocsvm" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>One-Class SVM Results</h4>
                                            <div id="ocsvm-metrics"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <img src="/static/plots/anomalies_one-class_svm.png" class="img-fluid" alt="One-Class SVM Results">
                                        </div>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="elliptic" role="tabpanel">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <h4>Elliptic Envelope Results</h4>
                                            <div id="elliptic-metrics"></div>
                                        </div>
                                        <div class="col-md-6">
                                            <img src="/static/plots/anomalies_elliptic_envelope.png" class="img-fluid" alt="Elliptic Envelope Results">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    <script src="{{ url_for('static', filename='js/anomalies.js') }}"></script>
</body>
</html>
            """)
    
    # Create CSS and JavaScript files
    css_dir = STATIC_DIR / "css"
    js_dir = STATIC_DIR / "js"
    css_dir.mkdir(exist_ok=True)
    js_dir.mkdir(exist_ok=True)
    
    style_css = css_dir / "style.css"
    if not style_css.exists():
        with open(style_css, 'w') as f:
            f.write("""
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
}

.navbar {
    margin-bottom: 20px;
}

.card {
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
    background-color: #343a40;
    color: white;
    font-weight: bold;
}

.jumbotron {
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

#plot-gallery img {
    max-width: 100%;
    height: auto;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px;
}

#plot-gallery .col-md-6 {
    margin-bottom: 20px;
}

.table-responsive {
    margin-top: 20px;
}
            """)
    
    main_js = js_dir / "main.js"
    if not main_js.exists():
        with open(main_js, 'w') as f:
            f.write("""
// Main JavaScript file for the application
$(document).ready(function() {
    console.log('Production Line Analysis application loaded');
});
            """)
    
    dashboard_js = js_dir / "dashboard.js"
    if not dashboard_js.exists():
        with open(dashboard_js, 'w') as f:
            f.write("""
// Dashboard JavaScript file
$(document).ready(function() {
    // Load anomaly summary
    $.getJSON('/api/anomaly-summary', function(data) {
        let html = '<table class="table table-striped">';
        html += '<thead><tr><th>Method</th><th>Anomalies</th><th>Samples</th><th>Percentage</th></tr></thead>';
        html += '<tbody>';
        
        for (let key in data) {
            let method = data[key];
            html += '<tr>';
            html += '<td>' + method.method + '</td>';
            html += '<td>' + method.anomaly_count + '</td>';
            html += '<td>' + method.total_samples + '</td>';
            html += '<td>' + method.anomaly_percentage + '%</td>';
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        $('#anomaly-summary').html(html);
    });
    
    // Load available plots
    $.getJSON('/api/plots', function(data) {
        let html = '';
        
        data.forEach(function(plot) {
            html += '<div class="col-md-6">';
            html += '<div class="card">';
            html += '<div class="card-header">' + plot.name.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase()) + '</div>';
            html += '<div class="card-body">';
            html += '<a href="' + plot.url + '" target="_blank">';
            html += '<img src="' + plot.url + '" class="img-fluid" alt="' + plot.name + '">';
            html += '</a>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        
        $('#plot-gallery').html(html);
    });
});
            """)
    
    anomalies_js = js_dir / "anomalies.js"
    if not anomalies_js.exists():
        with open(anomalies_js, 'w') as f:
            f.write("""
// Anomalies JavaScript file
$(document).ready(function() {
    // Load anomaly metrics for each method
    $.getJSON('/api/anomaly-summary', function(data) {
        // Isolation Forest
        if (data.isolation_forest) {
            let ifHtml = '<table class="table table-striped">';
            ifHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ifHtml += '<tr><td>Anomaly Count</td><td>' + data.isolation_forest.anomaly_count + '</td></tr>';
            ifHtml += '<tr><td>Total Samples</td><td>' + data.isolation_forest.total_samples + '</td></tr>';
            ifHtml += '<tr><td>Anomaly Percentage</td><td>' + data.isolation_forest.anomaly_percentage + '%</td></tr>';
            
            if (data.isolation_forest.precision !== 'N/A') {
                ifHtml += '<tr><td>Precision</td><td>' + data.isolation_forest.precision.toFixed(4) + '</td></tr>';
                ifHtml += '<tr><td>Recall</td><td>' + data.isolation_forest.recall.toFixed(4) + '</td></tr>';
                ifHtml += '<tr><td>F1 Score</td><td>' + data.isolation_forest.f1.toFixed(4) + '</td></tr>';
            }
            
            ifHtml += '</table>';
            $('#if-metrics').html(ifHtml);
        }
        
        // Local Outlier Factor
        if (data.local_outlier_factor) {
            let lofHtml = '<table class="table table-striped">';
            lofHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            lofHtml += '<tr><td>Anomaly Count</td><td>' + data.local_outlier_factor.anomaly_count + '</td></tr>';
            lofHtml += '<tr><td>Total Samples</td><td>' + data.local_outlier_factor.total_samples + '</td></tr>';
            lofHtml += '<tr><td>Anomaly Percentage</td><td>' + data.local_outlier_factor.anomaly_percentage + '%</td></tr>';
            
            if (data.local_outlier_factor.precision !== 'N/A') {
                lofHtml += '<tr><td>Precision</td><td>' + data.local_outlier_factor.precision.toFixed(4) + '</td></tr>';
                lofHtml += '<tr><td>Recall</td><td>' + data.local_outlier_factor.recall.toFixed(4) + '</td></tr>';
                lofHtml += '<tr><td>F1 Score</td><td>' + data.local_outlier_factor.f1.toFixed(4) + '</td></tr>';
            }
            
            lofHtml += '</table>';
            $('#lof-metrics').html(lofHtml);
        }
        
        // One-Class SVM
        if (data['one-class_svm']) {
            let ocsvmHtml = '<table class="table table-striped">';
            ocsvmHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ocsvmHtml += '<tr><td>Anomaly Count</td><td>' + data['one-class_svm'].anomaly_count + '</td></tr>';
            ocsvmHtml += '<tr><td>Total Samples</td><td>' + data['one-class_svm'].total_samples + '</td></tr>';
            ocsvmHtml += '<tr><td>Anomaly Percentage</td><td>' + data['one-class_svm'].anomaly_percentage + '%</td></tr>';
            
            if (data['one-class_svm'].precision !== 'N/A') {
                ocsvmHtml += '<tr><td>Precision</td><td>' + data['one-class_svm'].precision.toFixed(4) + '</td></tr>';
                ocsvmHtml += '<tr><td>Recall</td><td>' + data['one-class_svm'].recall.toFixed(4) + '</td></tr>';
                ocsvmHtml += '<tr><td>F1 Score</td><td>' + data['one-class_svm'].f1.toFixed(4) + '</td></tr>';
            }
            
            ocsvmHtml += '</table>';
            $('#ocsvm-metrics').html(ocsvmHtml);
        }
        
        // Elliptic Envelope
        if (data.elliptic_envelope) {
            let ellipticHtml = '<table class="table table-striped">';
            ellipticHtml += '<tr><th>Metric</th><th>Value</th></tr>';
            ellipticHtml += '<tr><td>Anomaly Count</td><td>' + data.elliptic_envelope.anomaly_count + '</td></tr>';
            ellipticHtml += '<tr><td>Total Samples</td><td>' + data.elliptic_envelope.total_samples + '</td></tr>';
            ellipticHtml += '<tr><td>Anomaly Percentage</td><td>' + data.elliptic_envelope.anomaly_percentage + '%</td></tr>';
            
            if (data.elliptic_envelope.precision !== 'N/A') {
                ellipticHtml += '<tr><td>Precision</td><td>' + data.elliptic_envelope.precision.toFixed(4) + '</td></tr>';
                ellipticHtml += '<tr><td>Recall</td><td>' + data.elliptic_envelope.recall.toFixed(4) + '</td></tr>';
                ellipticHtml += '<tr><td>F1 Score</td><td>' + data.elliptic_envelope.f1.toFixed(4) + '</td></tr>';
            }
            
            ellipticHtml += '</table>';
            $('#elliptic-metrics').html(ellipticHtml);
        }
    });
});
            """)
    
    # Run the app
    port = 5050
    host = '0.0.0.0'
    logger.info(f"Flask app starting on http://{host}:{port}")
    app.run(host=host, port=port, debug=True)

if __name__ == "__main__":
    main() 