#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for anomaly detection on the Bosch Production Line Performance dataset.

This script implements various anomaly detection techniques:
1. Isolation Forest
2. Local Outlier Factor (LOF)
3. One-Class SVM
4. Robust covariance estimation (Elliptic Envelope)

The script:
1. Loads the preprocessed data
2. Applies anomaly detection algorithms
3. Analyzes and visualizes the results
4. Saves the anomaly detection models
"""

import os
import sys
import logging
import pickle
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.svm import OneClassSVM
from sklearn.covariance import EllipticEnvelope
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.decomposition import PCA
from tqdm import tqdm

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

def ensure_dirs_exist():
    """Create necessary directories if they don't exist."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    PLOTS_DIR.mkdir(parents=True, exist_ok=True)

def load_processed_data(dataset_type="train"):
    """Load the processed dataset."""
    logger.info(f"Loading processed {dataset_type} data...")
    
    # Try loading the pickle file first (faster)
    pickle_file = PROCESSED_DATA_DIR / f"{dataset_type}_processed.pkl"
    if pickle_file.exists():
        try:
            data = pd.read_pickle(pickle_file)
            logger.info(f"Loaded data from {pickle_file}")
            return data
        except Exception as e:
            logger.warning(f"Error loading pickle file: {e}")
    
    # Fall back to CSV if pickle fails
    csv_file = PROCESSED_DATA_DIR / f"{dataset_type}_processed.csv"
    if csv_file.exists():
        try:
            data = pd.read_csv(csv_file)
            logger.info(f"Loaded data from {csv_file}")
            return data
        except Exception as e:
            logger.error(f"Error loading CSV file: {e}")
            sys.exit(1)
    
    logger.error(f"No processed data found at {PROCESSED_DATA_DIR}")
    logger.info("Please run the preprocess.py script first.")
    sys.exit(1)

def prepare_data_for_anomaly_detection(data):
    """Prepare the data for anomaly detection."""
    logger.info("Preparing data for anomaly detection...")
    
    # Get column names for Id and Response
    id_col = "Id" if "Id" in data.columns else data.columns[0]
    response_col = "Response" if "Response" in data.columns else None
    
    # Create X (features) and y (label if available)
    if response_col:
        X = data.drop([id_col, response_col], axis=1)
        y = data[response_col]
    else:
        X = data.drop([id_col], axis=1)
        y = None
    
    # Get only numeric features for now
    numeric_cols = X.select_dtypes(include=np.number).columns
    X_numeric = X[numeric_cols]
    
    logger.info(f"Prepared data shape: {X_numeric.shape}")
    return X_numeric, y

def detect_anomalies_isolation_forest(X, contamination=0.01, random_state=42):
    """Detect anomalies using Isolation Forest."""
    logger.info("Detecting anomalies using Isolation Forest...")
    
    # Train the model
    model = IsolationForest(
        contamination=contamination,
        random_state=random_state,
        n_estimators=100,
        n_jobs=-1
    )
    
    # Fit and predict
    # -1 for outliers and 1 for inliers
    y_pred = model.fit_predict(X)
    
    # Convert to binary labels (1 for anomalies, 0 for normal)
    # Note: Isolation Forest returns -1 for anomalies, 1 for normal
    anomalies = np.where(y_pred == -1, 1, 0)
    
    # Get anomaly scores
    scores = -model.score_samples(X)  # Negating to have high score = more anomalous
    
    logger.info(f"Identified {sum(anomalies)} anomalies out of {len(X)} samples")
    
    return model, anomalies, scores

def detect_anomalies_lof(X, contamination=0.01):
    """Detect anomalies using Local Outlier Factor."""
    logger.info("Detecting anomalies using Local Outlier Factor...")
    
    # Train the model
    model = LocalOutlierFactor(
        n_neighbors=20,
        contamination=contamination,
        n_jobs=-1
    )
    
    # Fit and predict
    y_pred = model.fit_predict(X)
    
    # Convert to binary labels (1 for anomalies, 0 for normal)
    # Note: LOF returns -1 for anomalies, 1 for normal
    anomalies = np.where(y_pred == -1, 1, 0)
    
    # Get anomaly scores (negative of _decision_function)
    scores = -model.negative_outlier_factor_
    
    logger.info(f"Identified {sum(anomalies)} anomalies out of {len(X)} samples")
    
    return model, anomalies, scores

def detect_anomalies_ocsvm(X, contamination=0.01):
    """Detect anomalies using One-Class SVM."""
    logger.info("Detecting anomalies using One-Class SVM...")
    
    # Train the model
    model = OneClassSVM(
        nu=contamination,
        kernel="rbf",
        gamma="auto"
    )
    
    # Fit and predict
    y_pred = model.fit_predict(X)
    
    # Convert to binary labels (1 for anomalies, 0 for normal)
    # Note: OneClassSVM returns -1 for anomalies, 1 for normal
    anomalies = np.where(y_pred == -1, 1, 0)
    
    # Get anomaly scores
    scores = -model.decision_function(X)  # Negating to have high score = more anomalous
    
    logger.info(f"Identified {sum(anomalies)} anomalies out of {len(X)} samples")
    
    return model, anomalies, scores

def detect_anomalies_elliptic_envelope(X, contamination=0.01, random_state=42):
    """Detect anomalies using Robust Covariance (Elliptic Envelope)."""
    logger.info("Detecting anomalies using Elliptic Envelope...")
    
    # Train the model
    model = EllipticEnvelope(
        contamination=contamination,
        random_state=random_state
    )
    
    # Fit and predict
    y_pred = model.fit_predict(X)
    
    # Convert to binary labels (1 for anomalies, 0 for normal)
    # Note: EllipticEnvelope returns -1 for anomalies, 1 for normal
    anomalies = np.where(y_pred == -1, 1, 0)
    
    # Get anomaly scores
    scores = -model.decision_function(X)  # Negating to have high score = more anomalous
    
    logger.info(f"Identified {sum(anomalies)} anomalies out of {len(X)} samples")
    
    return model, anomalies, scores

def evaluate_anomaly_detection(y_true, anomalies, scores, method_name):
    """Evaluate the anomaly detection results."""
    if y_true is None:
        logger.info("No ground truth labels available for evaluation.")
        return {}
    
    logger.info(f"Evaluating {method_name} results...")
    
    # Confusion matrix
    cm = confusion_matrix(y_true, anomalies)
    
    # Classification report
    report = classification_report(y_true, anomalies, output_dict=True)
    
    # Summarize results
    tn, fp, fn, tp = cm.ravel()
    logger.info(f"True Positives: {tp}")
    logger.info(f"False Positives: {fp}")
    logger.info(f"True Negatives: {tn}")
    logger.info(f"False Negatives: {fn}")
    
    precision = report['1']['precision'] if '1' in report else 0
    recall = report['1']['recall'] if '1' in report else 0
    f1 = report['1']['f1-score'] if '1' in report else 0
    
    logger.info(f"Precision: {precision:.4f}")
    logger.info(f"Recall: {recall:.4f}")
    logger.info(f"F1-Score: {f1:.4f}")
    
    return {
        'confusion_matrix': cm,
        'report': report,
        'precision': precision,
        'recall': recall,
        'f1': f1
    }

def visualize_anomalies(X, anomalies, scores, method_name):
    """Visualize the anomalies using PCA."""
    logger.info(f"Visualizing anomalies detected by {method_name}...")
    
    # Apply PCA for dimensionality reduction
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    
    # Create a DataFrame for plotting
    df_pca = pd.DataFrame(X_pca, columns=['PC1', 'PC2'])
    df_pca['anomaly'] = anomalies
    df_pca['score'] = scores
    
    # Create the plot
    plt.figure(figsize=(12, 10))
    
    # Scatter plot
    plt.subplot(2, 1, 1)
    sns.scatterplot(
        x='PC1', 
        y='PC2', 
        hue='anomaly',
        style='anomaly',
        palette={0: 'blue', 1: 'red'},
        data=df_pca
    )
    plt.title(f'Anomalies detected by {method_name} (PCA visualization)')
    plt.legend(title='Anomaly', labels=['Normal', 'Anomaly'])
    
    # Score distribution
    plt.subplot(2, 1, 2)
    sns.histplot(df_pca['score'], bins=50, kde=True)
    plt.axvline(x=np.percentile(scores, 99), color='r', linestyle='--')
    plt.title(f'Distribution of Anomaly Scores ({method_name})')
    plt.xlabel('Anomaly Score')
    plt.ylabel('Count')
    
    plt.tight_layout()
    
    # Save the plot
    output_file = PLOTS_DIR / f"anomalies_{method_name.lower().replace(' ', '_')}.png"
    plt.savefig(output_file)
    logger.info(f"Plot saved to {output_file}")
    
    # Close the plot
    plt.close()

def save_model(model, method_name):
    """Save the trained anomaly detection model."""
    logger.info(f"Saving {method_name} model...")
    
    model_file = MODELS_DIR / f"anomaly_detection_{method_name.lower().replace(' ', '_')}.pkl"
    
    try:
        with open(model_file, 'wb') as f:
            pickle.dump(model, f)
        logger.info(f"Model saved to {model_file}")
    except Exception as e:
        logger.error(f"Error saving model: {e}")

def save_results(anomalies, scores, evaluation, method_name):
    """Save the anomaly detection results."""
    logger.info(f"Saving {method_name} results...")
    
    # Create results DataFrame
    results_df = pd.DataFrame({
        'anomaly': anomalies,
        'score': scores
    })
    
    # Save results
    results_file = RESULTS_DIR / f"anomaly_results_{method_name.lower().replace(' ', '_')}.csv"
    results_df.to_csv(results_file, index=False)
    logger.info(f"Results saved to {results_file}")
    
    # Save evaluation metrics if available
    if evaluation:
        metrics_file = RESULTS_DIR / f"anomaly_metrics_{method_name.lower().replace(' ', '_')}.json"
        
        # Convert numpy arrays to lists for JSON serialization
        serializable_eval = {}
        for key, value in evaluation.items():
            if isinstance(value, np.ndarray):
                serializable_eval[key] = value.tolist()
            else:
                serializable_eval[key] = value
        
        import json
        with open(metrics_file, 'w') as f:
            json.dump(serializable_eval, f, indent=4)
        logger.info(f"Evaluation metrics saved to {metrics_file}")

def main():
    """Main function to detect anomalies in the Bosch dataset."""
    logger.info("Starting anomaly detection...")
    ensure_dirs_exist()
    
    # Load data
    data = load_processed_data("train")
    
    # Prepare data
    X, y = prepare_data_for_anomaly_detection(data)
    
    # Define contamination rate (proportion of anomalies expected)
    # This should be tuned based on domain knowledge or through validation
    contamination = 0.01  # Example: 1% anomalies
    
    # Method 1: Isolation Forest
    method_name = "Isolation Forest"
    model, anomalies, scores = detect_anomalies_isolation_forest(X, contamination)
    evaluation = evaluate_anomaly_detection(y, anomalies, scores, method_name)
    visualize_anomalies(X, anomalies, scores, method_name)
    save_model(model, method_name)
    save_results(anomalies, scores, evaluation, method_name)
    
    # Method 2: Local Outlier Factor
    method_name = "Local Outlier Factor"
    model, anomalies, scores = detect_anomalies_lof(X, contamination)
    evaluation = evaluate_anomaly_detection(y, anomalies, scores, method_name)
    visualize_anomalies(X, anomalies, scores, method_name)
    # Note: LOF model doesn't support predict() on new data in sklearn
    # so we don't save it
    save_results(anomalies, scores, evaluation, method_name)
    
    # Method 3: One-Class SVM (using a sample if data is large)
    # One-Class SVM can be computationally expensive for large datasets
    if len(X) > 10000:
        logger.info("Dataset is large, sampling for One-Class SVM...")
        sample_size = min(10000, len(X))
        sample_indices = np.random.choice(len(X), sample_size, replace=False)
        X_sample = X.iloc[sample_indices]
        y_sample = y.iloc[sample_indices] if y is not None else None
    else:
        X_sample = X
        y_sample = y
    
    method_name = "One-Class SVM"
    model, anomalies, scores = detect_anomalies_ocsvm(X_sample, contamination)
    evaluation = evaluate_anomaly_detection(y_sample, anomalies, scores, method_name)
    visualize_anomalies(X_sample, anomalies, scores, method_name)
    save_model(model, method_name)
    save_results(anomalies, scores, evaluation, method_name)
    
    # Method 4: Elliptic Envelope (only if data is not too high-dimensional)
    # Elliptic Envelope works poorly in high dimensions
    if X.shape[1] <= 20:
        method_name = "Elliptic Envelope"
        model, anomalies, scores = detect_anomalies_elliptic_envelope(X, contamination)
        evaluation = evaluate_anomaly_detection(y, anomalies, scores, method_name)
        visualize_anomalies(X, anomalies, scores, method_name)
        save_model(model, method_name)
        save_results(anomalies, scores, evaluation, method_name)
    else:
        logger.info(f"Skipping Elliptic Envelope: data is too high-dimensional ({X.shape[1]} features)")
    
    logger.info("Anomaly detection completed successfully.")

if __name__ == "__main__":
    main() 