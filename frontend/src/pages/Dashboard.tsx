import React, { useEffect, useState } from 'react';
import { 
  getProductionStatus, 
  initializeProductionLine, 
  startProduction, 
  stopProduction, 
  pauseProduction, 
  resetProduction, 
  emergencyStop 
} from '../services/apiService';
import { getConnection, resetConnection } from '../services/signalRService';
import { DeviceStatus, ProductionLine, ProductionStatus } from '../services/types';
import * as signalR from '@microsoft/signalr';

const getStatusClassName = (status: DeviceStatus | ProductionStatus | string): string => {
  return `status-${String(status).toLowerCase()}`;
};

const Dashboard: React.FC = () => {
  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signalRConnected, setSignalRConnected] = useState(false);

  // Function to safely get updates via SignalR
  const setupSignalRConnection = () => {
    try {
      const connection = getConnection();
      
      // Check if connection is already established
      if (connection.state === signalR.HubConnectionState.Connected) {
        setSignalRConnected(true);
      }
      
      // Set up connection state handlers
      connection.onclose(() => setSignalRConnected(false));
      connection.onreconnecting(() => setSignalRConnected(false));
      connection.onreconnected(() => setSignalRConnected(true));
      
      // Set up event handlers
      connection.on('ReceiveProductionUpdate', (data: ProductionLine) => {
        setProductionLine(data);
      });

      connection.on('ReceiveStatusChange', (oldStatus: string, newStatus: string) => {
        console.log(`Production status changed from ${oldStatus} to ${newStatus}`);
      });

      return connection;
    } catch (err) {
      console.error('Error setting up SignalR connection:', err);
      setError('Failed to connect to real-time updates. Refresh the page to try again.');
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductionStatus();
        setProductionLine(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load production line status');
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up SignalR
    const connection = setupSignalRConnection();
    
    // Cleanup function
    return () => {
      if (connection) {
        connection.off('ReceiveProductionUpdate');
        connection.off('ReceiveStatusChange');
      }
    };
  }, []);
  
  // Function to handle reconnection
  const handleReconnect = async () => {
    setError(null);
    try {
      console.log('Dashboard reconnect button clicked');
      
      // Display temporary connecting message
      setError('Reconnecting to server...');
      
      // Force reset the connection
      const conn = await resetConnection();
      console.log('Connection reset complete in Dashboard', conn);
      
      if (conn.state === signalR.HubConnectionState.Connected) {
        console.log('Connection successfully established');
        setSignalRConnected(true);
        setError(null);
        
        // Re-setup the event handlers
        conn.on('ReceiveProductionUpdate', (data: ProductionLine) => {
          setProductionLine(data);
        });

        conn.on('ReceiveStatusChange', (oldStatus: string, newStatus: string) => {
          console.log(`Production status changed from ${oldStatus} to ${newStatus}`);
        });
        
        // Refresh production data after reconnection
        const data = await getProductionStatus();
        setProductionLine(data);
      } else {
        setError('Connection is not in connected state. Try refreshing the page.');
        setSignalRConnected(false);
      }
    } catch (err) {
      console.error('Error during reconnection in Dashboard:', err);
      setError('Failed to reconnect. Please refresh the page to try again.');
    }
  };

  const handleInitialize = async () => {
    try {
      setInitializing(true);
      
      // Show loading state on the button
      const initBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
      if (initBtn) {
        initBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Initializing...';
      }
      
      // Wait for the backend to initialize
      await initializeProductionLine();
      
      // Fetch updated state after initialization
      const data = await getProductionStatus();
      setProductionLine(data);
      
      setInitializing(false);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Failed to initialize production line. Please check connection and try again.');
      setInitializing(false);
      
      // Reset the button state
      const initBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
      if (initBtn) {
        initBtn.innerHTML = 'Initialize Production Line';
      }
    }
  };

  const handleStart = async () => {
    try {
      // Show loading state on the button
      const startBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
      if (startBtn) {
        startBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Starting...';
        startBtn.disabled = true;
      }
      
      await startProduction();
      
      // Success - production should be started
      // The UI will be updated via SignalR when the status changes
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to start production. Please check connection.');
      
      // Reset the button state after a short delay
      setTimeout(() => {
        const startBtn = document.querySelector('.btn-primary') as HTMLButtonElement;
        if (startBtn) {
          startBtn.innerHTML = '<i class="bi bi-play-fill"></i> Start';
          startBtn.disabled = false;
        }
      }, 1000);
    }
  };

  const handleStop = async () => {
    try {
      // Show loading state on the button
      const stopBtn = document.querySelector('.btn-secondary') as HTMLButtonElement;
      if (stopBtn) {
        stopBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Stopping...';
        stopBtn.disabled = true;
      }
      
      await stopProduction();
      
      // Success - production should be stopped
      // The UI will be updated via SignalR when the status changes
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to stop production. Please try again or use emergency stop.');
      
      // Reset the button state after a short delay
      setTimeout(() => {
        const stopBtn = document.querySelector('.btn-secondary') as HTMLButtonElement;
        if (stopBtn) {
          stopBtn.innerHTML = '<i class="bi bi-stop-fill"></i> Stop';
          stopBtn.disabled = false;
        }
      }, 1000);
    }
  };

  const handlePause = async () => {
    try {
      // Show loading state on the button
      const pauseBtn = document.querySelector('.btn-warning') as HTMLButtonElement;
      if (pauseBtn) {
        pauseBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Pausing...';
        pauseBtn.disabled = true;
      }
      
      await pauseProduction();
      
      // Success - production should be paused
      // The UI will be updated via SignalR when the status changes
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to pause production. Please try again.');
      
      // Reset the button state after a short delay
      setTimeout(() => {
        const pauseBtn = document.querySelector('.btn-warning') as HTMLButtonElement;
        if (pauseBtn) {
          pauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i> Pause';
          pauseBtn.disabled = false;
        }
      }, 1000);
    }
  };

  const handleReset = async () => {
    try {
      // Show loading state on the button
      const resetBtn = document.querySelector('.btn-info') as HTMLButtonElement;
      if (resetBtn) {
        resetBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting...';
        resetBtn.disabled = true;
      }
      
      await resetProduction();
      
      // Success - production should be reset
      // The UI will be updated via SignalR when the status changes
    } catch (err: any) {
      // Show error message
      setError(err.message || 'Failed to reset production line. Please try again.');
      
      // Reset the button state after a short delay
      setTimeout(() => {
        const resetBtn = document.querySelector('.btn-info') as HTMLButtonElement;
        if (resetBtn) {
          resetBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Reset';
          resetBtn.disabled = false;
        }
      }, 1000);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      // Show loading state on the button
      const emergencyBtn = document.querySelector('.emergency-button') as HTMLButtonElement;
      if (emergencyBtn) {
        emergencyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> STOPPING...';
        emergencyBtn.disabled = true;
      }
      
      await emergencyStop();
      
      // Reset all buttons after emergency stop
      setTimeout(() => {
        // Reset all button states
        const emergencyBtn = document.querySelector('.emergency-button') as HTMLButtonElement;
        if (emergencyBtn) {
          emergencyBtn.innerHTML = '<i class="bi bi-exclamation-octagon-fill"></i> EMERGENCY STOP';
          emergencyBtn.disabled = false;
        }
      }, 1500);
      
    } catch (err: any) {
      // Show error message - for emergency stop, this is more critical
      setError(err.message || 'CRITICAL ERROR: Failed to activate emergency stop! Please check hardware and connections.');
      
      // Reset the button state after a short delay
      setTimeout(() => {
        const emergencyBtn = document.querySelector('.emergency-button') as HTMLButtonElement;
        if (emergencyBtn) {
          emergencyBtn.innerHTML = '<i class="bi bi-exclamation-octagon-fill"></i> EMERGENCY STOP';
          emergencyBtn.disabled = false;
        }
      }, 1000);
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

  if (!productionLine) {
    return (
      <div className="container mt-3">
        <div className="alert alert-warning">
          <h4>Production Line Not Initialized</h4>
          <p>Please initialize the production line to begin.</p>
          <button 
            className="btn btn-primary" 
            onClick={handleInitialize} 
            disabled={initializing}
          >
            {initializing ? 'Initializing...' : 'Initialize Production Line'}
          </button>
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

      {!signalRConnected && !error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Real-time updates disconnected.</strong> You may not see the latest production data.
          <button className="btn btn-sm btn-outline-dark ms-3" onClick={handleReconnect}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Reconnect
          </button>
          <span className="ms-2 small text-muted">
            (Try refreshing the page if reconnection fails)
          </span>
        </div>
      )}

      <div className="row mb-3">
        <div className="col-md-12">
          <div className="panel">
            <h3>
              <i className="bi bi-gear"></i> Production Line Status: 
              <span className={`ms-2 ${getStatusClassName(productionLine.status as unknown as DeviceStatus)}`}>
                {productionLine.status}
              </span>
              {signalRConnected && (
                <small className="ms-3 text-success">
                  <i className="bi bi-wifi"></i> Live updates
                </small>
              )}
            </h3>
            <div className="control-panel mt-3">
              <button 
                className="btn btn-primary" 
                onClick={handleStart}
                disabled={productionLine.status === ProductionStatus.Running}
              >
                <i className="bi bi-play-fill"></i> Start
              </button>
              <button 
                className="btn btn-warning" 
                onClick={handlePause}
                disabled={productionLine.status !== ProductionStatus.Running}
              >
                <i className="bi bi-pause-fill"></i> Pause
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleStop}
                disabled={productionLine.status !== ProductionStatus.Running && productionLine.status !== ProductionStatus.Paused}
              >
                <i className="bi bi-stop-fill"></i> Stop
              </button>
              <button 
                className="btn btn-info" 
                onClick={handleReset}
                disabled={productionLine.status === ProductionStatus.Running}
              >
                <i className="bi bi-arrow-repeat"></i> Reset
              </button>
              <button 
                className="btn emergency-button ms-md-4" 
                onClick={handleEmergencyStop}
              >
                <i className="bi bi-exclamation-octagon-fill"></i> EMERGENCY STOP
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="panel">
            <h4>
              <i className="bi bi-cpu"></i> PLC Controller
              <span className={`ms-2 ${getStatusClassName(productionLine.plc.status)}`}>
                {productionLine.plc.status}
              </span>
            </h4>
            <p>
              <strong>Connection:</strong> {productionLine.plc.connected ? 'Connected' : 'Disconnected'}
            </p>
            <p>
              <strong>Cycle Count:</strong> {productionLine.plc.cycleCount}
            </p>
            <p>
              <strong>Cycle Time:</strong> {productionLine.plc.cycleTime.toFixed(2)} sec
            </p>
            <p>
              <strong>Emergency Stop:</strong> {productionLine.plc.emergencyStopActive ? 'Active' : 'Inactive'}
            </p>
            {productionLine.plc.errorMessage && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {productionLine.plc.errorMessage}
              </div>
            )}
            <h5>I/O Points</h5>
            <div className="row">
              <div className="col-md-6">
                <h6>Inputs</h6>
                <ul className="list-unstyled">
                  {productionLine.plc.inputs.map((input, idx) => (
                    <li key={idx}>
                      <span className={`io-point io-point-${input.value.toString()}`}></span>
                      {input.name} ({input.address})
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-6">
                <h6>Outputs</h6>
                <ul className="list-unstyled">
                  {productionLine.plc.outputs.map((output, idx) => (
                    <li key={idx}>
                      <span className={`io-point io-point-${output.value.toString()}`}></span>
                      {output.name} ({output.address})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="panel">
            <h4>
              <i className="bi bi-robot"></i> Robot Controller
              <span className={`ms-2 ${getStatusClassName(productionLine.robot.status)}`}>
                {productionLine.robot.status}
              </span>
            </h4>
            <p>
              <strong>Connection:</strong> {productionLine.robot.connected ? 'Connected' : 'Disconnected'}
            </p>
            <p>
              <strong>Current Program:</strong> {productionLine.robot.currentProgram}
            </p>
            <p>
              <strong>Position:</strong> X: {productionLine.robot.xPosition.toFixed(2)}, 
              Y: {productionLine.robot.yPosition.toFixed(2)}, 
              Z: {productionLine.robot.zPosition.toFixed(2)}
            </p>
            <p>
              <strong>Speed:</strong> {productionLine.robot.speed.toFixed(2)} mm/s
            </p>
            {productionLine.robot.errorMessage && (
              <div className="alert alert-danger">
                <strong>Error:</strong> {productionLine.robot.errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="panel">
            <h4>
              <i className="bi bi-camera-video"></i> Vision System
              <span className={`ms-2 ${getStatusClassName(productionLine.vision.status)}`}>
                {productionLine.vision.status}
              </span>
            </h4>
            <p>
              <strong>Connection:</strong> {productionLine.vision.connected ? 'Connected' : 'Disconnected'}
            </p>
            <p>
              <strong>Inspections:</strong> {productionLine.vision.inspectionCount}
            </p>
            <div className="row">
              <div className="col-6">
                <p>
                  <strong>Pass:</strong> {productionLine.vision.passCount}
                </p>
              </div>
              <div className="col-6">
                <p>
                  <strong>Fail:</strong> {productionLine.vision.failCount}
                </p>
              </div>
            </div>
            <p>
              <strong>Last Inspection Time:</strong> {productionLine.vision.lastInspectionTime.toFixed(2)} ms
            </p>
            {productionLine.vision.lastFailureReason && (
              <div className="alert alert-warning">
                <strong>Last Failure:</strong> {productionLine.vision.lastFailureReason}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8 mb-3">
          <div className="panel">
            <h4>
              <i className="bi bi-graph-up"></i> Production Metrics
            </h4>
            <div className="row">
              <div className="col-md-6">
                <div className="card text-white bg-primary mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Parts Produced</h5>
                    <p className="card-text display-4">{productionLine.partsProduced}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card text-white bg-danger mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Parts Rejected</h5>
                    <p className="card-text display-4">{productionLine.partsRejected}</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3">
              <strong>Last Updated:</strong> {new Date(productionLine.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="panel">
            <h4>
              <i className="bi bi-thermometer-half"></i> Current Sensor Readings
            </h4>
            <div className="mb-3">
              <label className="form-label">Temperature: {productionLine.currentSensorData.temperature.toFixed(1)} °C</label>
              <div className="progress">
                <div 
                  className="progress-bar bg-danger" 
                  role="progressbar" 
                  style={{ width: `${(productionLine.currentSensorData.temperature / 100) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Pressure: {productionLine.currentSensorData.pressure.toFixed(1)} kPa</label>
              <div className="progress">
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${(productionLine.currentSensorData.pressure / 200) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Speed: {productionLine.currentSensorData.speed.toFixed(1)} RPM</label>
              <div className="progress">
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${(productionLine.currentSensorData.speed / 150) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Vibration: {productionLine.currentSensorData.vibration.toFixed(1)} mm/s</label>
              <div className="progress">
                <div 
                  className="progress-bar bg-warning" 
                  role="progressbar" 
                  style={{ width: `${(productionLine.currentSensorData.vibration / 50) * 100}%` }}
                ></div>
              </div>
            </div>
            <p>
              <strong>Timestamp:</strong> {productionLine.currentSensorData.timestamp}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 