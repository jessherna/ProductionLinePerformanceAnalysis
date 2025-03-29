import React from 'react';
import { AnomalyPredictionResult, ProductionData } from '../services/types';

interface AnomalyAlertProps {
  anomaly: AnomalyPredictionResult;
  data: ProductionData;
  onClose: () => void;
}

export const AnomalyAlert: React.FC<AnomalyAlertProps> = ({ anomaly, data, onClose }) => {
  return (
    <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 11 }}>
      <div className="toast show anomaly-alert" role="alert" aria-live="assertive" aria-atomic="true">
        <div className="toast-header bg-danger text-white">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong className="me-auto">Anomaly Detected!</strong>
          <small>{data.timestamp}</small>
          <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
        </div>
        <div className="toast-body">
          <div className="mb-2">
            <strong>Probable Cause:</strong> {anomaly.probableCause}
          </div>
          <div className="mb-2">
            <strong>Recommendation:</strong> {anomaly.recommendation}
          </div>
          <div className="mb-2">
            <strong>Anomaly Score:</strong> {anomaly.anomalyScore.toFixed(4)}
          </div>
          <div className="row">
            <div className="col-6">
              <small><strong>Temperature:</strong> {data.temperature.toFixed(1)} °C</small>
            </div>
            <div className="col-6">
              <small><strong>Pressure:</strong> {data.pressure.toFixed(1)} kPa</small>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <small><strong>Speed:</strong> {data.speed.toFixed(1)} RPM</small>
            </div>
            <div className="col-6">
              <small><strong>Vibration:</strong> {data.vibration.toFixed(1)} mm/s</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 