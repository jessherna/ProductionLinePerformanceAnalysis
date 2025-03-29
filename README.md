# Production Line Control and Analysis System

This project consists of two main components:

1. **Production Line Control System**: Real-time monitoring and control for manufacturing operations
2. **Production Line Performance Analysis**: Historical data analysis with anomaly detection

## Project Overview

This system provides a comprehensive solution for manufacturing environments, combining:

- Real-time production monitoring and control
- Historical data analysis for quality improvement
- Anomaly detection to identify potential issues
- Performance visualization and reporting

## Components

### 1. Production Line Control System

A real-time dashboard for monitoring and controlling manufacturing operations:

- Live sensor data visualization
- Order management and tracking
- Production scheduling
- Anomaly alerts

**Tech Stack:**
- Frontend: React with TypeScript
- Backend: C# (.NET 6+) with SignalR for real-time updates
- Database: SQL Server

### 2. Production Line Performance Analysis

Data analysis tools focused on manufacturing performance and quality improvement:

- Historical data analysis
- Pattern recognition
- Anomaly detection
- Performance reporting

**Tech Stack:**
- Python 3.8+
- Flask for web interface
- scikit-learn for machine learning
- Pandas for data processing

## System Architecture

The system follows a modular architecture with these key components:

```
├── Production Line Control (C# + React)
│   ├── Real-time Dashboard
│   ├── Order Management
│   └── Alerts System
└── Performance Analysis (Python)
    ├── Data Processing
    ├── Anomaly Detection
    └── Visualization
```

## Getting Started

### Setting up the Production Line Control System

1. **Clone the repository**

   ```
   git clone https://github.com/yourusername/production-line-control.git
   cd production-line-control
   ```

2. **Backend setup**

   ```
   cd backend/csharp/ProductionLineAPI
   dotnet restore
   dotnet run
   ```

3. **Frontend setup**

   ```
   cd frontend
   npm install
   npm start
   ```

4. **Open your browser** to `http://localhost:1234`

### Setting up the Production Line Performance Analysis

1. **Set up Python environment**

   ```
   cd analysis
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Unix/macOS
   pip install -r requirements.txt
   ```

2. **Download and process the dataset**

   The system uses the Bosch Production Line Performance dataset from Kaggle.

   ```
   python src/data/download.py
   python src/data/preprocess.py
   ```

   **Note about Kaggle authentication:**
   - If you have a Kaggle account, place your `kaggle.json` credentials file in `~/.kaggle/`
   - If you encounter authentication issues, the system will automatically create synthetic data for development
   - The synthetic data mirrors the structure and statistical properties of the real dataset
   - To use real data, manually download from [Kaggle](https://www.kaggle.com/c/bosch-production-line-performance/data) and place in `analysis/data/raw/`

3. **Run the anomaly detection model**

   ```
   python src/models/anomaly.py
   ```

4. **Start the web application**

   ```
   python src/web/app.py
   ```

5. **Open your browser** to `http://localhost:5050`

## Running the Complete System

For convenience, you can start all components using the provided startup script:

**Windows:**
```
.\startup.bat
```

**macOS/Linux:**
```
./startup.sh
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - The C# API uses port 5000
   - The Python Analysis uses port 5050
   - The React frontend uses port 1234
   - If any port is already in use, modify the corresponding configuration

2. **SignalR Connection Issues:**
   - Ensure all CORS settings are properly configured
   - Check browser console for specific error messages

3. **Kaggle API Authentication:**
   - If you encounter "403 Forbidden" errors with the Kaggle API:
     - Verify your `kaggle.json` file has the correct permissions
     - Use the synthetic data generated automatically instead
     - The system will detect this scenario and create realistic test data

4. **Python Environment:**
   - Ensure all dependencies are installed with `pip install -r requirements.txt`
   - Python 3.8+ is required

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was developed as a portfolio piece for showcasing control system software engineering skills
- Inspiration drawn from real-world industrial automation systems
- Thanks to the open-source community for the tools and libraries used in this project 