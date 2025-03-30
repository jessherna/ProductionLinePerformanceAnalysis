import React, { useEffect, useState, useCallback } from 'react';
import { 
  getProductionStatus, 
  initializeProductionLine, 
  startProduction, 
  stopProduction, 
  pauseProduction, 
  resetProduction, 
  emergencyStop 
} from '../services/apiService';
import { connectSignalR, getConnection, resetConnection } from '../services/signalRService';
import { DeviceStatus, ProductionLine, ProductionStatus } from '../services/types';
import * as signalR from '@microsoft/signalr';

interface ProductionStage {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  progress: number; // 0-100
  timeRemaining?: number; // seconds
  description: string;
}

const getStatusClassName = (status: DeviceStatus | ProductionStatus | string): string => {
  return `status-${String(status).toLowerCase()}`;
};

const Dashboard: React.FC = () => {
  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [productionStages, setProductionStages] = useState<ProductionStage[]>([
    { 
      id: 'stamping', 
      name: 'Body Stamping', 
      status: 'idle', 
      progress: 0, 
      description: 'Stamping metal sheets into body panels'
    },
    { 
      id: 'welding', 
      name: 'Body Welding', 
      status: 'idle', 
      progress: 0, 
      description: 'Joining body panels with robotic welding'
    },
    { 
      id: 'painting', 
      name: 'Paint Shop', 
      status: 'idle', 
      progress: 0, 
      description: 'Applying base coat, color, and clear coat'
    },
    { 
      id: 'assembly', 
      name: 'Final Assembly', 
      status: 'idle', 
      progress: 0, 
      description: 'Installing components and finishing'
    },
    { 
      id: 'testing', 
      name: 'Quality Testing', 
      status: 'idle', 
      progress: 0, 
      description: 'Final inspection and testing'
    }
  ]);

  // Function to safely get updates via SignalR
  const setupSignalRConnection = useCallback(() => {
    try {
      const connection = connectSignalR(); // Use connectSignalR instead of getConnection to ensure a fresh connection
      
      // Check if connection is already established
      if (connection.state === signalR.HubConnectionState.Connected) {
        console.log('SignalR already connected:', connection.connectionId);
        setSignalRConnected(true);
      } else {
        console.log('SignalR connecting...', connection.state);
      }
      
      // Set up connection state handlers
      connection.onclose(() => {
        console.log('SignalR connection closed');
        setSignalRConnected(false);
      });
      
      connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
        setSignalRConnected(false);
      });
      
      connection.onreconnected(() => {
        console.log('SignalR reconnected!');
        setSignalRConnected(true);
      });
      
      // Set up event handlers
      connection.on('ReceiveProductionUpdate', (data: ProductionLine) => {
        console.log('Production update received via SignalR:', data);
        setProductionLine(data);
        
        // Update production stages based on the status and production stats
        if (data.status === ProductionStatus.Running) {
          const totalParts = data.partsProduced + data.partsRejected;
          
          // If we have produced parts and production is running, update the stages to reflect this
          if (totalParts > 0) {
            setProductionStages(prevStages => {
              // Calculate how many parts should be in each stage (simulate a pipeline)
              const stages = [...prevStages];
              
              // Set stages based on how many parts have been produced
              // All stages active when production is high
              if (totalParts > 20) {
                // Distribute progress across all stages when we have a lot of parts
                const stageCount = stages.length;
                
                // Update each stage based on parts produced
                for (let i = 0; i < stageCount; i++) {
                  // Set all stages active with varying progress
                  stages[i].status = 'active';
                  
                  // Calculate progress - earlier stages have higher progress
                  // Later stages have less progress to simulate a pipeline effect
                  const stagePosition = (stageCount - i) / stageCount; // 1.0 to 0.2 as i increases
                  const baseProgress = Math.min(100, totalParts * 2); // Base progress from part count
                  stages[i].progress = Math.min(100, baseProgress * stagePosition);
                  
                  // If a stage is at 100%, mark it as completed
                  if (stages[i].progress >= 95) {
                    stages[i].status = 'completed';
                  }
                }
                
                // If we have rejections, show a random stage in error state
                if (data.partsRejected > 0 && data.partsRejected % 5 === 0) {
                  const errorStageIndex = Math.floor(Math.random() * (stages.length - 1)) + 1; // Skip first stage
                  stages[errorStageIndex].status = 'error';
                }
              } else {
                // In early production, activate stages progressively
                const activeStagesToShow = Math.max(1, Math.min(stages.length, Math.ceil(totalParts / 4)));
                
                for (let i = 0; i < stages.length; i++) {
                  if (i < activeStagesToShow) {
                    // Active stages
                    stages[i].status = 'active';
                    const progress = i === activeStagesToShow - 1 
                      ? (totalParts % 4) * 25 // Last active stage has partial progress
                      : 100; // Earlier stages are at 100%
                    stages[i].progress = progress;
                    
                    // Mark completed stages
                    if (progress >= 100) {
                      stages[i].status = 'completed';
                    }
                  } else {
                    // Inactive stages
                    stages[i].status = 'idle';
                    stages[i].progress = 0;
                  }
                }
              }
              
              return stages;
            });
          } else {
            // If no parts yet but running, activate the first stage
            setProductionStages(prevStages => {
              // If no active stages and production is running, activate the first stage
              if (!prevStages.some(s => s.status === 'active' || s.status === 'completed')) {
                const newStages = [...prevStages];
                newStages[0].status = 'active';
                return newStages;
              }
              return prevStages;
            });
          }
        } else if (data.status === ProductionStatus.Idle || 
                   data.status === ProductionStatus.Stopped || 
                   data.status === ProductionStatus.Completed) {
          // Reset stages when not running
          setProductionStages(prevStages => 
            prevStages.map(stage => ({
              ...stage,
              status: 'idle',
              progress: 0,
              timeRemaining: undefined
            }))
          );
        } else if (data.status === ProductionStatus.Error) {
          // Set a random stage to error
          setProductionStages(prevStages => {
            const newStages = [...prevStages];
            const randomIndex = Math.floor(Math.random() * newStages.length);
            newStages[randomIndex].status = 'error';
            return newStages;
          });
        }
      });

      connection.on('ReceiveStatusChange', (oldStatus: string, newStatus: string) => {
        console.log(`Production status changed from ${oldStatus} to ${newStatus}`);
      });
      
      connection.on('ReceiveAnomalyAlert', (anomaly: any, data: any) => {
        console.log('Anomaly alert received:', anomaly, data);
        // You could show a notification here
        setError(`Anomaly detected: ${anomaly.probableCause}`);
      });
      
      connection.on('ReceiveErrorAlert', (errorMsg: string) => {
        console.log('Error alert received:', errorMsg);
        setError(errorMsg);
      });
      
      connection.on('ConnectionEstablished', (data: any) => {
        console.log('Connection established:', data);
        setSignalRConnected(true);
      });

      return connection;
    } catch (err) {
      console.error('Error setting up SignalR connection:', err);
      setError('Failed to connect to real-time updates. Refresh the page to try again.');
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
    
    // Ping the server every 30 seconds to keep the connection alive
    const pingInterval = setInterval(() => {
      if (connection && connection.state === signalR.HubConnectionState.Connected) {
        connection.invoke('Ping').catch(err => {
          console.error('Error pinging server:', err);
        });
      }
    }, 30000);
    
    // Cleanup function
    return () => {
      if (connection) {
        connection.off('ReceiveProductionUpdate');
        connection.off('ReceiveStatusChange');
        connection.off('ReceiveAnomalyAlert');
        connection.off('ReceiveErrorAlert');
        connection.off('ConnectionEstablished');
      }
      clearInterval(pingInterval);
    };
  }, [setupSignalRConnection]);
  
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

  useEffect(() => {
    // Only update production stages based on the production line status
    if (productionLine) {
      if (productionLine.status === ProductionStatus.Running) {
        // If production is running, leave the stages as they are
        // and let the simulation handle the animation in the other useEffect
      } else if (productionLine.status === ProductionStatus.Idle || 
                productionLine.status === ProductionStatus.Stopped) {
        // Reset stages when not running
        setProductionStages(prevStages => 
          prevStages.map(stage => ({
            ...stage,
            status: 'idle',
            progress: 0
          }))
        );
      }
    }
  }, [productionLine?.status]);

  useEffect(() => {
    // Only run simulation when production line is running and SignalR is connected
    if (!productionLine || productionLine.status !== ProductionStatus.Running) {
      return;
    }

    console.log('Starting production simulation');
    
    // Simulation interval for small animations and progress changes
    // This adds visual feedback independent of the actual data updates
    const simulationInterval = setInterval(() => {
      setProductionStages(prevStages => {
        // Get total parts from production line
        const totalParts = productionLine.partsProduced + productionLine.partsRejected;
        
        // If we have a significant number of parts, don't rely on animation
        // instead, let the production data drive the visualization
        if (totalParts > 5) {
          // Only make minor visual tweaks for active stages
          return prevStages.map(stage => {
            if (stage.status === 'active') {
              // Small random fluctuations in progress for visual interest
              const fluctuation = Math.random() * 4 - 2; // -2 to +2
              const newProgress = Math.max(0, Math.min(99, stage.progress + fluctuation));
              return { ...stage, progress: newProgress };
            }
            return stage;
          });
        }
        
        // Early production or when parts count is low, use regular simulation
        // Create a new copy of stages to modify
        const newStages = [...prevStages];
        
        // Find the first active stage or stage to activate
        let activeStageIndex = newStages.findIndex(s => s.status === 'active');
        
        // If no active stage, activate the first non-completed stage
        if (activeStageIndex === -1) {
          activeStageIndex = newStages.findIndex(s => s.status !== 'completed');
          if (activeStageIndex !== -1) {
            newStages[activeStageIndex].status = 'active';
          }
        }
        
        // If there's an active stage, advance its progress
        if (activeStageIndex !== -1) {
          const activeStage = newStages[activeStageIndex];
          
          // Advance progress by a random amount (1-5%)
          const progressIncrement = Math.floor(Math.random() * 5) + 1;
          let newProgress = activeStage.progress + progressIncrement;
          
          // Handle completion of a stage
          if (newProgress >= 100) {
            newProgress = 100;
            activeStage.status = 'completed';
            
            // Activate next stage if available
            if (activeStageIndex < newStages.length - 1) {
              newStages[activeStageIndex + 1].status = 'active';
            }
          }
          
          // Update the progress
          activeStage.progress = newProgress;
          
          // Calculate time remaining (random between 5-20 seconds)
          const timeRemaining = Math.floor(((100 - newProgress) / 100) * (Math.random() * 15 + 5));
          activeStage.timeRemaining = timeRemaining;
        }
        
        return newStages;
      });
    }, 1000); // Update every second
    
    return () => {
      console.log('Stopping production simulation');
      clearInterval(simulationInterval);
    };
  }, [productionLine?.status, productionLine?.partsProduced, productionLine?.partsRejected]);

  const getStageStatusClass = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'error': return 'bg-danger';
      default: return 'bg-secondary';
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

      <div className="row mb-3">
        <div className="col-md-12">
          <div className="panel">
            <h4>
              <i className="bi bi-bar-chart"></i> Production Line Visualization
            </h4>
            
            {/* Production Line Flow Visualization */}
            <div className="production-flow-container mt-3 mb-4">
              <div className="d-flex justify-content-between align-items-center production-flow">
                {productionStages.map((stage, idx) => (
                  <React.Fragment key={stage.id}>
                    <div className={`production-station ${stage.status}`}>
                      <div className="station-icon">
                        {stage.id === 'stamping' && <i className="bi bi-hammer"></i>}
                        {stage.id === 'welding' && <i className="bi bi-lightning"></i>}
                        {stage.id === 'painting' && <i className="bi bi-palette"></i>}
                        {stage.id === 'assembly' && <i className="bi bi-tools"></i>}
                        {stage.id === 'testing' && <i className="bi bi-check-circle"></i>}
                      </div>
                      <div className="station-name">{stage.name}</div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div 
                          className={`progress-bar ${getStageStatusClass(stage.status)}`} 
                          role="progressbar" 
                          style={{ width: `${stage.progress}%` }}
                          aria-valuenow={stage.progress} 
                          aria-valuemin={0} 
                          aria-valuemax={100}
                        ></div>
                      </div>
                      <div className="status-badge">
                        {stage.status === 'active' && (
                          <span className="badge bg-primary">
                            <i className="bi bi-arrow-repeat spin"></i> Working
                          </span>
                        )}
                        {stage.status === 'completed' && (
                          <span className="badge bg-success">
                            <i className="bi bi-check-lg"></i> Complete
                          </span>
                        )}
                        {stage.status === 'error' && (
                          <span className="badge bg-danger">
                            <i className="bi bi-exclamation-triangle"></i> Error
                          </span>
                        )}
                        {stage.status === 'idle' && (
                          <span className="badge bg-secondary">
                            <i className="bi bi-hourglass"></i> Waiting
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Arrows between stations (except after the last one) */}
                    {idx < productionStages.length - 1 && (
                      <div className="flow-arrow">
                        <i className="bi bi-arrow-right"></i>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Automotive Parts Counter */}
            <div className="row mb-3">
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-car-front"></i> In Production
                    </h5>
                    <p className="card-text display-4">
                      {productionStages.filter(s => s.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-check-circle"></i> Completed
                    </h5>
                    <p className="card-text display-4">
                      {productionLine?.partsProduced || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-exclamation-triangle"></i> Defects
                    </h5>
                    <p className="card-text display-4">
                      {productionLine?.partsRejected || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card bg-light">
                  <div className="card-body">
                    <h5 className="card-title">
                      <i className="bi bi-stopwatch"></i> Cycle Time
                    </h5>
                    <p className="card-text display-4">
                      {productionLine?.cycleTime?.toFixed(1) || 0}s
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detailed Station Information */}
            <div className="row">
              {productionStages.map((stage, idx) => (
                <div key={idx} className="col-md-4 mb-3">
                  <div className={`card ${stage.status === 'idle' ? '' : `border-${getStageStatusClass(stage.status).replace('bg-', '')}`}`}>
                    <div className={`card-header ${stage.status === 'idle' ? '' : getStageStatusClass(stage.status)}`}>
                      <h5 className="mb-0">
                        {stage.id === 'stamping' && <i className="bi bi-hammer me-2"></i>}
                        {stage.id === 'welding' && <i className="bi bi-lightning me-2"></i>}
                        {stage.id === 'painting' && <i className="bi bi-palette me-2"></i>}
                        {stage.id === 'assembly' && <i className="bi bi-tools me-2"></i>}
                        {stage.id === 'testing' && <i className="bi bi-check-circle me-2"></i>}
                        {stage.name}
                      </h5>
                    </div>
                    <div className="card-body">
                      <p className="card-text">{stage.description}</p>
                      <div className="progress mb-3" style={{ height: '20px' }}>
                        <div 
                          className={`progress-bar ${getStageStatusClass(stage.status)}`} 
                          role="progressbar" 
                          style={{ width: `${stage.progress}%` }}
                          aria-valuenow={stage.progress} 
                          aria-valuemin={0} 
                          aria-valuemax={100}
                        >
                          {stage.progress}%
                        </div>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>
                          <strong>Status:</strong>{' '}
                          <span className={`badge ${getStageStatusClass(stage.status)}`}>
                            {stage.status.toUpperCase()}
                          </span>
                        </span>
                        {stage.timeRemaining && stage.status === 'active' && (
                          <span>
                            <i className="bi bi-clock"></i> {stage.timeRemaining.toFixed(0)}s remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 