import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Orders from './pages/Orders';
import { connectSignalR } from './services/signalRService';
import { AnomalyAlert } from './components/AnomalyAlert';
import { AnomalyPredictionResult, ProductionData } from './services/types';

const App: React.FC = () => {
  const [anomalyAlert, setAnomalyAlert] = useState<{anomaly: AnomalyPredictionResult, data: ProductionData} | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const connection = connectSignalR();

    connection.on('ReceiveAnomalyAlert', (anomaly, data) => {
      setAnomalyAlert({ anomaly, data });
      setShowAlert(true);
    });

    connection.on('ReceiveErrorAlert', (errorMessage) => {
      alert(`System Error: ${errorMessage}`);
    });

    return () => {
      connection.stop();
    };
  }, []);

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <>
      <NavBar />
      <div className="container-fluid mt-3">
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

export default App; 