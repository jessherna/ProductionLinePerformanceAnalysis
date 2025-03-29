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
  totalReadings: number;
  anomaliesDetected: number;
  anomalyPercentage: number;
  avgTemperature: number;
  avgPressure: number;
  avgSpeed: number;
  avgVibration: number;
}

export interface AnomalyData extends ProductionData {
  anomalyScore: number;
}

export interface AnomalyList {
  anomalies: AnomalyData[];
}

export interface TimeSeriesData {
  data: ProductionData[];
} 