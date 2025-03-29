#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script for preprocessing the Bosch Production Line Performance dataset.

This script performs the following operations:
1. Load the raw data files
2. Handle missing values
3. Merge the data files (numeric, categorical, date)
4. Perform feature selection
5. Save the processed data
"""

import os
import sys
import logging
import pickle
from pathlib import Path
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
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
RAW_DATA_DIR = DATA_DIR / "raw"
INTERIM_DATA_DIR = DATA_DIR / "interim"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

def ensure_dirs_exist():
    """Create necessary directories if they don't exist."""
    INTERIM_DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    """Load the raw data files."""
    logger.info("Loading raw data files...")
    
    # Check if files exist
    required_files = [
        "train_numeric.csv",
        "train_categorical.csv",
        "train_date.csv",
    ]
    for file in required_files:
        if not (RAW_DATA_DIR / file).exists():
            logger.error(f"Required file {file} not found in {RAW_DATA_DIR}")
            logger.info("Please run the download.py script first.")
            sys.exit(1)
    
    # Load the data
    try:
        train_numeric = pd.read_csv(RAW_DATA_DIR / "train_numeric.csv")
        train_categorical = pd.read_csv(RAW_DATA_DIR / "train_categorical.csv")
        train_date = pd.read_csv(RAW_DATA_DIR / "train_date.csv")
        
        logger.info(f"Loaded train_numeric.csv: {train_numeric.shape}")
        logger.info(f"Loaded train_categorical.csv: {train_categorical.shape}")
        logger.info(f"Loaded train_date.csv: {train_date.shape}")
        
        return {
            "numeric": train_numeric,
            "categorical": train_categorical,
            "date": train_date,
        }
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        sys.exit(1)

def analyze_missing_values(data):
    """Analyze missing values in the dataset."""
    logger.info("Analyzing missing values...")
    
    for data_type, df in data.items():
        logger.info(f"Missing values in {data_type} data:")
        missing = df.isnull().sum()
        missing_percent = 100 * missing / len(df)
        missing_info = pd.DataFrame({
            'missing_count': missing,
            'missing_percent': missing_percent
        })
        logger.info(f"Total columns with missing values: {sum(missing > 0)}")
        
        # Save missing value analysis
        missing_file = INTERIM_DATA_DIR / f"missing_values_{data_type}.csv"
        missing_info.to_csv(missing_file)
        logger.info(f"Missing value analysis saved to {missing_file}")
    
    return missing_info

def handle_missing_values(data):
    """Handle missing values in the dataset."""
    logger.info("Handling missing values...")
    
    processed_data = {}
    
    # Handle numeric data
    numeric_df = data["numeric"].copy()
    
    # Get column names for Id and Response
    id_col = "Id" if "Id" in numeric_df.columns else numeric_df.columns[0]
    response_col = "Response" if "Response" in numeric_df.columns else None
    
    # Separate features from Id and Response
    if response_col:
        numeric_features = numeric_df.drop([id_col, response_col], axis=1)
    else:
        numeric_features = numeric_df.drop([id_col], axis=1)
    
    # Impute missing values for numeric features
    logger.info("Imputing missing values for numeric features...")
    numeric_imputer = SimpleImputer(strategy='median')
    numeric_features_imputed = pd.DataFrame(
        numeric_imputer.fit_transform(numeric_features),
        columns=numeric_features.columns
    )
    
    # Save the imputer for later use
    with open(INTERIM_DATA_DIR / "numeric_imputer.pkl", 'wb') as f:
        pickle.dump(numeric_imputer, f)
    
    # Reconstruct the dataframe with Id and Response
    if response_col:
        numeric_df_processed = pd.concat([
            numeric_df[[id_col, response_col]].reset_index(drop=True),
            numeric_features_imputed.reset_index(drop=True)
        ], axis=1)
    else:
        numeric_df_processed = pd.concat([
            numeric_df[[id_col]].reset_index(drop=True),
            numeric_features_imputed.reset_index(drop=True)
        ], axis=1)
    
    processed_data["numeric"] = numeric_df_processed
    
    # Handle categorical data
    categorical_df = data["categorical"].copy()
    
    # Separate features from Id
    categorical_features = categorical_df.drop([id_col], axis=1)
    
    # Impute missing values for categorical features
    logger.info("Imputing missing values for categorical features...")
    categorical_imputer = SimpleImputer(strategy='most_frequent')
    categorical_features_imputed = pd.DataFrame(
        categorical_imputer.fit_transform(categorical_features),
        columns=categorical_features.columns
    )
    
    # Save the imputer for later use
    with open(INTERIM_DATA_DIR / "categorical_imputer.pkl", 'wb') as f:
        pickle.dump(categorical_imputer, f)
    
    # Reconstruct the dataframe with Id
    categorical_df_processed = pd.concat([
        categorical_df[[id_col]].reset_index(drop=True),
        categorical_features_imputed.reset_index(drop=True)
    ], axis=1)
    
    processed_data["categorical"] = categorical_df_processed
    
    # Handle date data (if needed)
    if "date" in data and not data["date"].empty:
        date_df = data["date"].copy()
        processed_data["date"] = date_df
    
    return processed_data

def merge_datasets(processed_data):
    """Merge the numeric, categorical, and date datasets."""
    logger.info("Merging datasets...")
    
    # Get the base dataset (numeric)
    merged_df = processed_data["numeric"]
    
    # Identify the ID column name
    id_col = "Id" if "Id" in merged_df.columns else merged_df.columns[0]
    
    # Merge with categorical data
    if "categorical" in processed_data and not processed_data["categorical"].empty:
        categorical_df = processed_data["categorical"]
        merged_df = pd.merge(merged_df, categorical_df, on=id_col, how='left')
    
    # Merge with date data
    if "date" in processed_data and not processed_data["date"].empty:
        date_df = processed_data["date"]
        merged_df = pd.merge(merged_df, date_df, on=id_col, how='left')
    
    logger.info(f"Merged dataset shape: {merged_df.shape}")
    return merged_df

def feature_selection(merged_df):
    """Perform feature selection on the merged dataset."""
    logger.info("Performing feature selection...")
    
    # Get column names for Id and Response
    id_col = "Id" if "Id" in merged_df.columns else merged_df.columns[0]
    response_col = "Response" if "Response" in merged_df.columns else None
    
    # If no Response column (test data), just return the merged data
    if not response_col:
        logger.info("No Response column found (test data), skipping feature selection.")
        return merged_df
    
    # Calculate feature importance or correlation with Response
    # For simplicity, we'll use correlation here
    # In a real project, you might use more advanced feature selection methods
    features = merged_df.drop([id_col, response_col], axis=1)
    numeric_features = features.select_dtypes(include=np.number).columns
    
    # Calculate correlation for numeric features
    correlation = merged_df[numeric_features].corrwith(merged_df[response_col])
    abs_correlation = correlation.abs().sort_values(ascending=False)
    
    # Select top features (example: top 100 or those with correlation > 0.05)
    # In a real project, you would tune this threshold
    important_features = abs_correlation[abs_correlation > 0.01].index.tolist()
    
    # Log feature selection results
    logger.info(f"Selected {len(important_features)} important features")
    
    # Save feature importance/correlation
    correlation_df = pd.DataFrame({
        'feature': correlation.index,
        'correlation': correlation.values,
        'abs_correlation': abs_correlation.values
    }).sort_values('abs_correlation', ascending=False)
    
    correlation_df.to_csv(INTERIM_DATA_DIR / "feature_correlation.csv", index=False)
    
    # Create dataset with selected features
    selected_columns = [id_col, response_col] + important_features
    selected_df = merged_df[selected_columns]
    
    logger.info(f"Dataset after feature selection: {selected_df.shape}")
    return selected_df

def save_processed_data(processed_df, dataset_type="train"):
    """Save the processed dataset."""
    logger.info(f"Saving processed {dataset_type} data...")
    
    # Save as CSV
    csv_file = PROCESSED_DATA_DIR / f"{dataset_type}_processed.csv"
    processed_df.to_csv(csv_file, index=False)
    logger.info(f"Saved to {csv_file}")
    
    # Save as pickle for faster loading
    pickle_file = PROCESSED_DATA_DIR / f"{dataset_type}_processed.pkl"
    processed_df.to_pickle(pickle_file)
    logger.info(f"Saved to {pickle_file}")

def main():
    """Main function to preprocess the Bosch dataset."""
    logger.info("Starting Bosch dataset preprocessing...")
    ensure_dirs_exist()
    
    # Load data
    data = load_data()
    
    # Analyze missing values
    analyze_missing_values(data)
    
    # Handle missing values
    processed_data = handle_missing_values(data)
    
    # Merge datasets
    merged_df = merge_datasets(processed_data)
    
    # Feature selection (optional for train data)
    if "Response" in merged_df.columns:
        selected_df = feature_selection(merged_df)
        save_processed_data(selected_df, "train")
    else:
        save_processed_data(merged_df, "test")
    
    logger.info("Preprocessing completed successfully.")

if __name__ == "__main__":
    main() 