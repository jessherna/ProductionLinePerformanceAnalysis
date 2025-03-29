import axios from 'axios';
import { 
  ProductionLine, 
  OrderDetails, 
  ProductionSummary, 
  AnomalyList, 
  TimeSeriesData, 
  ProductionData, 
  AnomalyPredictionResult 
} from './types';

const API_URL = 'http://localhost:5028/api';

// Create a custom axios instance with CORS credentials
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for CORS with credentials
});

// Production Line API
export const getProductionStatus = async (): Promise<ProductionLine> => {
  const response = await apiClient.get('/productionline/status');
  return response.data;
};

export const getOrders = async (): Promise<OrderDetails[]> => {
  const response = await apiClient.get('/productionline/orders');
  return response.data;
};

export const initializeProductionLine = async (): Promise<void> => {
  await apiClient.post('/productionline/initialize');
};

export const startProduction = async (): Promise<void> => {
  await apiClient.post('/productionline/start');
};

export const stopProduction = async (): Promise<void> => {
  await apiClient.post('/productionline/stop');
};

export const pauseProduction = async (): Promise<void> => {
  await apiClient.post('/productionline/pause');
};

export const resetProduction = async (): Promise<void> => {
  await apiClient.post('/productionline/reset');
};

export const emergencyStop = async (): Promise<void> => {
  await apiClient.post('/productionline/emergency-stop');
};

// Analytics API
export const getSummary = async (): Promise<ProductionSummary> => {
  const response = await apiClient.get('/analytics/summary');
  return response.data;
};

export const getAnomalies = async (): Promise<AnomalyList> => {
  const response = await apiClient.get('/analytics/anomalies');
  return response.data;
};

export const getLatestData = async (): Promise<TimeSeriesData> => {
  const response = await apiClient.get('/analytics/latest-data');
  return response.data;
};

export const predictAnomaly = async (data: ProductionData): Promise<AnomalyPredictionResult> => {
  const response = await apiClient.post('/analytics/predict', data);
  return response.data;
}; 