import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Orders from './pages/Orders';
import { connectSignalR, pingServer, getConnection, resetConnection } from './services/signalRService';
import { AnomalyAlert } from './components/AnomalyAlert';
import { AnomalyPredictionResult, ProductionData } from './services/types';
import * as signalR from '@microsoft/signalr'; // Import for HubConnectionState
import './App.css';

const App: React.FC = () => {
  const [anomalyAlert, setAnomalyAlert] = useState<{anomaly: AnomalyPredictionResult, data: ProductionData} | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [connectionActive, setConnectionActive] = useState(false);

  useEffect(() => {
    // Initialize SignalR connection
    const conn = connectSignalR();
    
    // Register event handlers using the handler system in connectSignalR
    
    // Set up event handlers for specific component needs
    const handleAnomalyAlert = (anomaly: AnomalyPredictionResult, data: ProductionData) => {
      setAnomalyAlert({ anomaly, data });
      setShowAlert(true);
    };
    
    const handleErrorAlert = (errorMessage: string) => {
      setAlertMessage(errorMessage);
      alert(`System Error: ${errorMessage}`);
    };
    
    conn.on('ReceiveAnomalyAlert', handleAnomalyAlert);
    conn.on('ReceiveErrorAlert', handleErrorAlert);
    
    // Set up connection state change handlers
    conn.onclose(() => setConnectionActive(false));
    conn.onreconnected(() => setConnectionActive(true));
    conn.onreconnecting(() => setConnectionActive(false));
    
    // Initial connection state
    if (conn.state === signalR.HubConnectionState.Connected) { 
      setConnectionActive(true);
    }
    
    // Expose ping function globally for troubleshooting
    window.pingSignalRServer = pingServer;
    
    // Expose reset function for manual reconnection
    window.resetSignalRConnection = resetConnection;

    // Clean up function
    return () => {
      // Remove the event handlers we added in this component
      conn.off('ReceiveAnomalyAlert', handleAnomalyAlert);
      conn.off('ReceiveErrorAlert', handleErrorAlert);
    };
  }, []);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <>
      <NavBar />
      <div className="container-fluid mt-3">
        {!connectionActive && (
          <div className="alert alert-warning">
            <strong>Warning:</strong> SignalR connection is not active. Real-time updates are not available.
            <button 
              className="btn btn-sm btn-outline-dark ms-3" 
              onClick={async () => {
                console.log('Reconnect button clicked');
                try {
                  // Show connecting state visually
                  const reconnectBtn = document.querySelector('.btn-outline-dark') as HTMLButtonElement;
                  if (reconnectBtn) {
                    reconnectBtn.disabled = true;
                    reconnectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
                  }
                  
                  // Reset connection
                  const conn = await resetConnection();
                  console.log('Connection reset complete', conn);
                  
                  // Update UI based on connection state
                  if (conn.state === signalR.HubConnectionState.Connected) {
                    console.log('Connection successfully established');
                    setConnectionActive(true);
                  } else {
                    console.error('Connection not in connected state', conn.state);
                    setConnectionActive(false);
                    alert('Could not establish connection. Please refresh the page.');
                  }
                  
                  // Reset button state
                  if (reconnectBtn) {
                    reconnectBtn.disabled = false;
                    reconnectBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Reconnect';
                  }
                } catch (err) {
                  console.error('Error during reconnection:', err);
                  setConnectionActive(false);
                  
                  // Reset button state
                  const reconnectBtn = document.querySelector('.btn-outline-dark') as HTMLButtonElement;
                  if (reconnectBtn) {
                    reconnectBtn.disabled = false;
                    reconnectBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Reconnect';
                  }
                  
                  alert('Error reconnecting. Please refresh the page.');
                }
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Reconnect
            </button>
            <span className="ms-2 small text-muted">
              (Try refreshing the page if reconnection fails)
            </span>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </div>

      {showAlert && anomalyAlert && (
        <AnomalyAlert 
          anomaly={anomalyAlert.anomaly} 
          data={anomalyAlert.data} 
          onClose={handleCloseAlert} 
        />
      )}
    </>
  );
};

// Add TypeScript declaration for global window object
declare global {
  interface Window {
    pingSignalRServer: () => void;
    resetSignalRConnection: () => void;
  }
}

export default App; 