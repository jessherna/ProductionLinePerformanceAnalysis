import axios, { AxiosError } from 'axios';
import { 
  ProductionLine, 
  OrderDetails, 
  ProductionSummary, 
  AnomalyList, 
  TimeSeriesData, 
  ProductionData, 
  AnomalyPredictionResult,
  AnalysisApiStatus,
  AdvancedAnomalyResult,
  ModelList,
  AnalysisResults,
  PlotList
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

// Error handling utility
const handleApiError = <T>(error: any, fallbackData: T, endpoint: string): T => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      console.error(`API Error (${endpoint}) - Status: ${axiosError.response.status}`, axiosError.response.data);
    } else if (axiosError.request) {
      console.error(`API Error (${endpoint}) - No response received:`, axiosError.request);
    } else {
      console.error(`API Error (${endpoint}):`, axiosError.message);
    }
  } else {
    console.error(`Unexpected error calling ${endpoint}:`, error);
  }
  
  return fallbackData;
};

// Production Line API
export const getProductionStatus = async (): Promise<ProductionLine> => {
  try {
    const response = await apiClient.get('/productionline/status');
    return response.data;
  } catch (error) {
    // Return a default production line with status indication
    return handleApiError(error, {
      id: '0',
      name: 'Disconnected',
      status: 'Error',
      plc: { status: 'Error', connected: false },
      robot: { status: 'Error', connected: false },
      vision: { status: 'Error', connected: false },
      sensors: { temperature: 0, pressure: 0, vibration: 0 },
      cycleTime: 0,
      cycleCount: 0
    }, '/productionline/status');
  }
};

export const getOrders = async (): Promise<OrderDetails[]> => {
  try {
    const response = await apiClient.get('/productionline/orders');
    return response.data;
  } catch (error) {
    return handleApiError(error, [], '/productionline/orders');
  }
};

export const initializeProductionLine = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/initialize');
  } catch (error) {
    console.error('Failed to initialize production line:', error);
    throw new Error('Failed to initialize production line. Please try again.');
  }
};

export const startProduction = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/start');
  } catch (error) {
    console.error('Failed to start production:', error);
    throw new Error('Failed to start production. Please check connection and try again.');
  }
};

export const stopProduction = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/stop');
  } catch (error) {
    console.error('Failed to stop production:', error);
    throw new Error('Failed to stop production. Please try again or use emergency stop.');
  }
};

export const pauseProduction = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/pause');
  } catch (error) {
    console.error('Failed to pause production:', error);
    throw new Error('Failed to pause production. Please try again.');
  }
};

export const resetProduction = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/reset');
  } catch (error) {
    console.error('Failed to reset production line:', error);
    throw new Error('Failed to reset production line. Please try again.');
  }
};

export const emergencyStop = async (): Promise<void> => {
  try {
    await apiClient.post('/productionline/emergency-stop');
  } catch (error) {
    console.error('Failed to execute emergency stop:', error);
    throw new Error('Failed to execute emergency stop! Please check connection.');
  }
};

// Analytics API
export const getSummary = async (): Promise<ProductionSummary> => {
  try {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      total_readings: 0,
      anomalies_detected: 0,
      anomaly_percentage: 0,
      avg_temperature: 0,
      avg_pressure: 0,
      avg_speed: 0,
      avg_vibration: 0
    }, '/analytics/summary');
  }
};

export const getAnomalies = async (): Promise<AnomalyList> => {
  try {
    const response = await apiClient.get('/analytics/anomalies');
    return response.data;
  } catch (error) {
    return handleApiError(error, { anomalies: [] }, '/analytics/anomalies');
  }
};

export const getLatestData = async (): Promise<TimeSeriesData> => {
  try {
    const response = await apiClient.get('/analytics/latest-data');
    return response.data;
  } catch (error) {
    return handleApiError(error, { data: [] }, '/analytics/latest-data');
  }
};

export const predictAnomaly = async (data: ProductionData): Promise<AnomalyPredictionResult> => {
  const response = await apiClient.post('/analytics/predict', data);
  return response.data;
};

// Analytics API - Advanced Features
export const getAnalysisStatus = async (): Promise<AnalysisApiStatus> => {
  try {
    const response = await apiClient.get('/analytics/status');
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      status: 'error',
      advanced_analysis_available: false,
      advanced_models: []
    }, '/analytics/status');
  }
};

export const performAdvancedAnalysis = async (
  data: ProductionData, 
  modelName?: string
): Promise<AdvancedAnomalyResult> => {
  try {
    const response = await apiClient.post('/analytics/advanced-predict', {
      data,
      modelName
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      is_anomaly: false,
      anomaly_score: 0,
      probability: 0,
      model_used: modelName || 'unknown',
      recommendation: 'Error performing analysis',
      confidence: 0,
      features_contribution: {}
    }, '/analytics/advanced-predict');
  }
};

export const getAvailableModels = async (): Promise<ModelList> => {
  try {
    const response = await apiClient.get('/analytics/models');
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      models: {},
      default_model: 'basic'
    }, '/analytics/models');
  }
};

export const getAnalysisResults = async (modelType: string = 'isolation_forest'): Promise<AnalysisResults> => {
  try {
    const response = await apiClient.get('/analytics/results?modelType=' + modelType);
    return response.data;
  } catch (error) {
    return handleApiError(error, {
      model_type: modelType,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1_score: 0,
      training_time: 0,
      anomalies_found: 0,
      total_samples: 0
    }, `/analytics/results?modelType=${modelType}`);
  }
};

export const getAvailablePlots = async (): Promise<PlotList> => {
  const response = await apiClient.get('/analytics/plots');
  return response.data;
};

export const getPlotUrl = (plotName: string): string => {
  return API_URL + '/analytics/plot/' + plotName;
}; 