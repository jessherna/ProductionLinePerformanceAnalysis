export enum DeviceStatus {
  Offline = 'Offline',
  Initializing = 'Initializing',
  Ready = 'Ready',
  Running = 'Running',
  Error = 'Error',
  Maintenance = 'Maintenance',
  EmergencyStop = 'EmergencyStop'
}

export enum ProductionStatus {
  Idle = 'Idle',
  Running = 'Running',
  Paused = 'Paused',
  Stopped = 'Stopped',
  Completed = 'Completed',
  Error = 'Error'
}

export interface ProductionData {
  temperature: number;
  pressure: number;
  speed: number;
  vibration: number;
  timestamp: string;
}

export interface AnomalyPredictionResult {
  isAnomaly: boolean;
  anomalyScore: number;
  probableCause?: string;
  recommendation?: string;
}

export interface IOPoint {
  name: string;
  address: string;
  value: boolean | number | string;
  dataType: string;
}

export interface PLCState {
  connected: boolean;
  status: DeviceStatus;
  cycleCount: number;
  cycleTime: number;
  emergencyStopActive: boolean;
  inputs: IOPoint[];
  outputs: IOPoint[];
  errorMessage?: string;
}

export interface RobotState {
  connected: boolean;
  status: DeviceStatus;
  xPosition: number;
  yPosition: number;
  zPosition: number;
  speed: number;
  currentProgram: string;
  errorMessage?: string;
}

export interface VisionSystem {
  connected: boolean;
  status: DeviceStatus;
  inspectionCount: number;
  passCount: number;
  failCount: number;
  lastInspectionTime: number;
  lastFailureReason?: string;
}

export interface ProductionLine {
  plc: PLCState;
  robot: RobotState;
  vision: VisionSystem;
  status: ProductionStatus;
  partsProduced: number;
  partsRejected: number;
  currentSensorData: ProductionData;
  lastUpdated: string;
}

export interface OrderDetails {
  orderId: number;
  productName: string;
  quantityRequired: number;
  quantityProduced: number;
  dueDate: string;
  status: string;
}

export interface ProductionSummary {
  total_readings: number;
  anomalies_detected: number;
  anomaly_percentage: number;
  avg_temperature: number;
  avg_pressure: number;
  avg_speed: number;
  avg_vibration: number;
}

export interface AnomalyData {
  temperature: number;
  pressure: number;
  speed: number;
  vibration: number;
  timestamp: string;
  anomaly_score: number;
}

export interface AnomalyList {
  anomalies: AnomalyData[];
}

export interface TimeSeriesItem {
  temperature: number;
  pressure: number;
  speed: number;
  vibration: number;
  timestamp: string;
  anomaly: number;
  anomaly_score: number;
}

export interface TimeSeriesData {
  data: TimeSeriesItem[];
}

export interface AnomalyPredictionResult {
  is_anomaly: boolean;
  anomaly_score: number;
  recommendation: string;
  probable_cause?: string;
}

export interface OrderDetails {
  id: number;
  product: string;
  status: string; // "Pending" | "In Progress" | "Completed" | "Canceled"
  quantity: number;
  due_date: string;
  progress: number;
  created_at: string;
}

export interface AnalysisApiStatus {
  status: string;
  advanced_analysis_available: boolean;
  advanced_models: string[];
}

export interface AdvancedAnomalyResult {
  is_anomaly: boolean;
  anomaly_score: number;
  model: string;
  recommendation: string;
  feature_contributions?: Record<string, number>;
  similar_cases?: string[];
}

export interface ModelInfo {
  name: string;
  description: string;
  features: string[];
}

export interface ModelList {
  models: Record<string, ModelInfo>;
  default_model: string;
}

export interface AnalysisResultItem {
  values: Record<string, any>;
}

export interface AnalysisMetrics {
  precision: number;
  recall: number;
  f1: number;
  true_positives: number;
  false_positives: number;
  true_negatives: number;
  false_negatives: number;
}

export interface AnalysisResults {
  model: string;
  metrics?: AnalysisMetrics;
  results: AnalysisResultItem[];
  total_records: number;
}

export interface PlotInfo {
  name: string;
  path: string;
  description: string;
}

export interface PlotList {
  plots: PlotInfo[];
}

export interface AdvancedAnalysisRequest {
  data: ProductionData;
  modelName?: string;
}

export interface SignalRConnectionInfo {
  url: string;
  accessToken: string;
}

export enum ProductionLineStatus {
  Running = "Running",
  Stopped = "Stopped",
  Maintenance = "Maintenance",
  Error = "Error"
}

export enum AlertType {
  Info = "info",
  Warning = "warning",
  Error = "error",
  Success = "success"
}

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  details?: any;
} 