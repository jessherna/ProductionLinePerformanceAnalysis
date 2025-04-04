```mermaid
classDiagram
    class ControlSystemManager {
        #43;InitializeSystem()
        #43;StartProduction()
        #43;StopProduction()
        #43;EmergencyStop()
        #43;MonitorSystem()
    }
    
    class DeviceController {
        <<interface>>
        #43;Connect()
        #43;Disconnect()
        #43;ExecuteCommand()
        #43;GetStatus()
    }
    
    class PLCController {
        #45;connectionString: string
        #45;deviceId: string
        #43;Connect()
        #43;Disconnect()
        #43;ExecuteCommand()
        #43;GetStatus()
        #43;ReadTags()
        #43;WriteTags()
    }
    
    class RobotController {
        #45;ipAddress: string
        #45;port: int
        #45;robotType: RobotType
        #43;Connect()
        #43;Disconnect()
        #43;ExecuteCommand()
        #43;GetStatus()
        #43;MoveToPosition()
        #43;RunProgram()
    }
    
    class VisionSystemController {
        #45;cameraId: string
        #43;Connect()
        #43;Disconnect()
        #43;ExecuteCommand()
        #43;GetStatus()
        #43;CaptureImage()
        #43;AnalyzeImage()
    }
    
    class DataAcquisitionService {
        #45;sampleRate: int
        #43;StartCollection()
        #43;StopCollection()
        #43;GetLiveData()
        #43;ExportDataForAnalysis()
    }
    
    class PythonAnalyticsIntegration {
        #45;apiEndpoint: string
        #43;SendDataForAnalysis()
        #43;GetAnalysisResults()
        #43;GetAnomalyPredictions()
        #43;UpdateModels()
    }
    
    class MESIntegration {
        #45;mesEndpoint: string
        #43;GetProductionOrders()
        #43;UpdateOrderStatus()
        #43;ReportQualityData()
        #43;GetBOMData()
    }
    
    class HMIController {
        #43;UpdateDisplay()
        #43;HandleUserInput()
        #43;DisplayAlarms()
        #43;ShowProductionStatus()
    }
    
    ControlSystemManager o-- DeviceController : manages
    DeviceController <|.. PLCController : implements
    DeviceController <|.. RobotController : implements
    DeviceController <|.. VisionSystemController : implements
    ControlSystemManager o-- DataAcquisitionService : uses
    ControlSystemManager o-- PythonAnalyticsIntegration : uses
    ControlSystemManager o-- MESIntegration : uses
    ControlSystemManager o-- HMIController : uses
```