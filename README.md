# Production Line Control and Analysis System

A comprehensive demo showcasing a production line control system with real-time monitoring, anomaly detection, and predictive maintenance capabilities.

![Production Line Control System Demo](docs/screenshot.png)

## Overview

This project simulates an industrial production line control system with:

- Real-time hardware integration (PLC, robot, vision system)
- Anomaly detection using machine learning (Python/scikit-learn)
- Interactive operator HMI dashboard
- Integration with simulated MES/ERP systems

The system architecture demonstrates the integration of C# for control systems with Python for data analysis, connected via REST APIs and SignalR for real-time updates.

## Architecture

The project consists of three main components:

1. **Python Analysis API**: Flask-based backend that provides anomaly detection using Isolation Forest algorithm.
2. **C# Production Line API**: .NET-based backend that simulates hardware control and production processes.
3. **React Frontend**: Modern UI for monitoring and controlling the production line.

![System Architecture](docs/architecture-diagram.png)

## Features

- 🔄 Real-time production monitoring and control
- 🤖 Hardware simulation (PLC, robot arm, vision system)
- 📊 Data visualization with time series charts
- 🔍 Anomaly detection using machine learning
- 🔔 Real-time alerts and notifications
- 📋 Order management and tracking
- 🚨 Emergency stop functionality
- 📱 Responsive design for desktop and mobile

## Technologies Used

- **Backend**:
  - C# / ASP.NET Core Web API
  - Python / Flask
  - SignalR for real-time communication
  - RESTful API architecture

- **Frontend**:
  - React with TypeScript
  - Bootstrap for UI components
  - Recharts for data visualization
  - Axios for API communication

- **Data Analysis**:
  - scikit-learn for anomaly detection (Isolation Forest)
  - pandas for data manipulation
  - NumPy for numerical operations

## Getting Started

### Prerequisites

- .NET 6.0+
- Python 3.9+
- Node.js 14.0+
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/production-line-simulator.git
cd production-line-simulator
```

2. Set up the Python backend:
```
cd backend/python/AnalysisAPI
python -m venv venv
venv\Scripts\activate  # On Windows
source venv/bin/activate  # On Unix/macOS
pip install -r requirements.txt
```

3. Set up the C# backend:
```
cd backend/csharp/ProductionLineAPI
dotnet restore
```

4. Set up the frontend:
```
cd frontend
npm install
```

### Running the Application

For Windows users, you can use the included startup script:
```
.\startup.bat
```

Or run each component separately:

1. Run the Python Analysis API:
```
cd backend/python/AnalysisAPI
python app.py
```

2. Run the C# Production Line API:
```
cd backend/csharp/ProductionLineAPI
dotnet run
```

3. Run the React frontend:
```
cd frontend
npm start
```

4. Open your browser and navigate to `http://localhost:1234`

## Usage

1. Initialize the production line
2. Start the production process
3. Monitor the dashboard for real-time updates
4. Test the anomaly detection by adjusting sensor values
5. Use the emergency stop if needed

## Troubleshooting

### Port Conflicts

If you encounter an error like `Failed to bind to address http://127.0.0.1:5028: address already in use`, you need to:

1. Close any existing instances of the application
2. Kill processes using the ports with:
   ```
   taskkill /F /IM dotnet.exe
   taskkill /F /IM node.exe
   ```
3. Run the startup script again

### SignalR Connection Issues

If you experience SignalR connection problems:

1. Check browser console for errors
2. Verify CORS is properly configured in the backend
3. Ensure your browser supports WebSockets
4. Confirm all ports are accessible (5000 for Python API, 5028 for C# API, 1234 for Frontend)

### React Component Errors

For React errors related to type handling:

1. Ensure proper type conversion for enums with `String(enumValue)`
2. Check that API responses match the expected TypeScript interfaces
3. Implement proper null checking for objects before accessing properties

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was developed as a portfolio piece for showcasing control system software engineering skills
- Inspiration drawn from real-world industrial automation systems
- Thanks to the open-source community for the tools and libraries used in this project 