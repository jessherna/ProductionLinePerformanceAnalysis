# Bosch Production Line Performance Dataset - Data Dictionary

## Overview

The Bosch Production Line Performance dataset contains anonymous measurements captured automatically during the manufacturing process. The goal is to predict which parts will fail quality control based on these measurements.

This dataset consists of three main components:
1. Numeric features
2. Categorical features
3. Date-time features

## Files Description

- `train_numeric.csv` - Training set with numeric features
- `train_categorical.csv` - Training set with categorical features
- `train_date.csv` - Training set with date-time features
- `test_numeric.csv` - Test set with numeric features
- `test_categorical.csv` - Test set with categorical features
- `test_date.csv` - Test set with date-time features
- `sample_submission.csv` - Sample submission file for the competition

## Feature Descriptions

### Common Features Across Files

- `Id` - Unique identifier for each part
- `Response` - (Only in training set) Binary target variable:
  - `0` = The part passed quality control (majority class)
  - `1` = The part failed quality control (minority class)

### Numeric Features

The numeric features are measurements and sensor readings from the production line, represented as station_feature format:

- Format: `L[line]_S[station]_F[feature]`
- Example: `L0_S0_F0` represents feature 0 from station 0 on line 0

All numeric features are continuous values, mostly normalized to ranges that don't reveal the original measurement units to maintain anonymity.

### Categorical Features

Categorical features represent discrete states, modes, or categories observed during production:

- Format: `L[line]_S[station]_F[feature]`
- Values are categorical labels, anonymized to preserve confidentiality

### Date Features

Date features capture the time when a part passes through various stations on the production line:

- Format: `L[line]_S[station]_D[date feature]`
- The values represent time and date information, with various granularities

## Data Characteristics

- **High dimensionality**: The dataset contains thousands of features
- **Missing values**: Many features have missing values, which may indicate:
  - The feature was not measured for this part
  - The part did not go through that particular station
  - The measurement failed
- **Imbalanced classes**: Failed parts (Response=1) represent only approximately 0.5-1% of the dataset
- **Sequential nature**: The features follow the production line sequence

## Feature Engineering Opportunities

Based on the dataset characteristics, several types of derived features may be useful:

1. **Process duration**: Time differences between consecutive stations
2. **Missing value patterns**: Engineered features based on patterns of missing values
3. **Statistical aggregations**: Within-station statistics across features
4. **Deviation features**: Differences from typical/expected values

## Important Considerations

- The data comes from a real manufacturing environment and contains significant class imbalance
- The anonymous nature of the features requires more data-driven approaches rather than domain expertise
- The sequential nature of the production process means temporal aspects are important

## Privacy and Anonymization

All features have been anonymized to protect confidential manufacturing information:
- Station and line identifiers are replaced with indices
- Feature names do not reveal their actual meaning
- Values are normalized or transformed to hide actual measurement units
- Categorical values are encoded to hide their original meaning 