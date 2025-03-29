import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { getSummary, getAnomalies, getLatestData, predictAnomaly } from '../services/apiService';
import { AnomalyData, ProductionData, ProductionSummary, TimeSeriesData } from '../services/types';

const Analytics: React.FC = () => {
  const [summary, setSummary] = useState<ProductionSummary | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<ProductionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<ProductionData>({
    temperature: 50,
    pressure: 100,
    speed: 75,
    vibration: 25,
    timestamp: new Date().toISOString()
  });
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, anomaliesData, latestData] = await Promise.all([
          getSummary(),
          getAnomalies(),
          getLatestData()
        ]);
        
        setSummary(summaryData);
        setAnomalies(anomaliesData.anomalies);
        setTimeSeriesData(latestData.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load analytics data');
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestData({
      ...testData,
      [name]: parseFloat(value)
    });
  };

  const handlePredictClick = async () => {
    try {
      setPredicting(true);
      setPredictionResult(null);
      const result = await predictAnomaly(testData);
      setPredictionResult(result);
      setPredicting(false);
    } catch (err) {
      setError('Failed to predict anomaly');
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="panel">
            <h3>Production Line Analytics</h3>
            <p>Visual analysis of production metrics and anomaly detection.</p>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6">
          <div className="panel">
            <h4>Summary Statistics</h4>
            {summary && (
              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Total Readings</h5>
                      <p className="card-text display-6">{summary.totalReadings}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Anomalies Detected</h5>
                      <p className="card-text display-6">{summary.anomaliesDetected}</p>
                      <p className="text-muted">{summary.anomalyPercentage.toFixed(1)}% of total</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Average Sensor Values</h5>
                      <div className="row">
                        <div className="col-md-6">
                          <p><strong>Temperature:</strong> {summary.avgTemperature.toFixed(1)} °C</p>
                          <p><strong>Pressure:</strong> {summary.avgPressure.toFixed(1)} kPa</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Speed:</strong> {summary.avgSpeed.toFixed(1)} RPM</p>
                          <p><strong>Vibration:</strong> {summary.avgVibration.toFixed(1)} mm/s</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="panel">
            <h4>Anomaly Test Tool</h4>
            <p>Enter values to check if they would be flagged as anomalies:</p>
            <div className="mb-3">
              <label htmlFor="temperature" className="form-label">Temperature (°C)</label>
              <input 
                type="number" 
                className="form-control" 
                id="temperature" 
                name="temperature" 
                value={testData.temperature} 
                onChange={handleInputChange}
              />
              <div className="form-text">Normal range: 40-60 °C</div>
            </div>
            <div className="mb-3">
              <label htmlFor="pressure" className="form-label">Pressure (kPa)</label>
              <input 
                type="number" 
                className="form-control" 
                id="pressure" 
                name="pressure" 
                value={testData.pressure} 
                onChange={handleInputChange}
              />
              <div className="form-text">Normal range: 90-110 kPa</div>
            </div>
            <div className="mb-3">
              <label htmlFor="speed" className="form-label">Speed (RPM)</label>
              <input 
                type="number" 
                className="form-control" 
                id="speed" 
                name="speed" 
                value={testData.speed} 
                onChange={handleInputChange}
              />
              <div className="form-text">Normal range: 65-85 RPM</div>
            </div>
            <div className="mb-3">
              <label htmlFor="vibration" className="form-label">Vibration (mm/s)</label>
              <input 
                type="number" 
                className="form-control" 
                id="vibration" 
                name="vibration" 
                value={testData.vibration} 
                onChange={handleInputChange}
              />
              <div className="form-text">Normal range: 20-30 mm/s</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handlePredictClick}
              disabled={predicting}
            >
              {predicting ? 'Analyzing...' : 'Check for Anomaly'}
            </button>

            {predictionResult && (
              <div className={`mt-3 alert ${predictionResult.isAnomaly ? 'alert-danger' : 'alert-success'}`}>
                <h5>
                  {predictionResult.isAnomaly ? 
                    <><i className="bi bi-exclamation-triangle-fill me-2"></i>Anomaly Detected!</> : 
                    <><i className="bi bi-check-circle-fill me-2"></i>Normal Operation</>}
                </h5>
                <p><strong>Anomaly Score:</strong> {predictionResult.anomalyScore.toFixed(4)}</p>
                {predictionResult.isAnomaly && (
                  <>
                    <p><strong>Probable Cause:</strong> {predictionResult.probableCause}</p>
                    <p><strong>Recommendation:</strong> {predictionResult.recommendation}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="panel">
            <h4>Sensor Data Time Series</h4>
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tick={{ fontSize: 12 }}
                    interval={Math.floor(timeSeriesData.length / 6)}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${parseFloat(value).toFixed(2)}`, '']} 
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#dc3545" 
                    name="Temperature (°C)" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#0d6efd" 
                    name="Pressure (kPa)" 
                    dot={false} 
                    strokeDasharray="5 5" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#198754" 
                    name="Speed (RPM)" 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vibration" 
                    stroke="#ffc107" 
                    name="Vibration (mm/s)" 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="panel">
            <h4>Recent Anomalies</h4>
            {anomalies.length === 0 ? (
              <div className="alert alert-success">
                <i className="bi bi-check-circle-fill me-2"></i>
                No anomalies detected in the recent data.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Temperature (°C)</th>
                      <th>Pressure (kPa)</th>
                      <th>Speed (RPM)</th>
                      <th>Vibration (mm/s)</th>
                      <th>Anomaly Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map((anomaly, idx) => (
                      <tr key={idx} className={anomaly.anomalyScore < -0.15 ? 'table-danger' : 'table-warning'}>
                        <td>{anomaly.timestamp}</td>
                        <td>{anomaly.temperature.toFixed(1)}</td>
                        <td>{anomaly.pressure.toFixed(1)}</td>
                        <td>{anomaly.speed.toFixed(1)}</td>
                        <td>{anomaly.vibration.toFixed(1)}</td>
                        <td>{anomaly.anomalyScore.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 