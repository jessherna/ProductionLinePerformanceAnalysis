using System.Text.Json.Serialization;

namespace ProductionLineAPI.Models
{
    public enum DeviceStatus
    {
        Offline,
        Initializing,
        Ready,
        Running,
        Error,
        Maintenance,
        EmergencyStop
    }

    public enum ProductionStatus
    {
        Idle,
        Running,
        Paused,
        Stopped,
        Completed,
        Error
    }

    public class PLCState
    {
        public bool Connected { get; set; } = false;
        public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
        public int CycleCount { get; set; } = 0;
        public double CycleTime { get; set; } = 0;
        public bool EmergencyStopActive { get; set; } = false;
        public List<IOPoint> Inputs { get; set; } = new List<IOPoint>();
        public List<IOPoint> Outputs { get; set; } = new List<IOPoint>();
        public string? ErrorMessage { get; set; }
    }

    public class RobotState
    {
        public bool Connected { get; set; } = false;
        public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
        public double XPosition { get; set; } = 0;
        public double YPosition { get; set; } = 0;
        public double ZPosition { get; set; } = 0;
        public double Speed { get; set; } = 0;
        public string CurrentProgram { get; set; } = string.Empty;
        public string? ErrorMessage { get; set; }
    }

    public class VisionSystem
    {
        public bool Connected { get; set; } = false;
        public DeviceStatus Status { get; set; } = DeviceStatus.Offline;
        public int InspectionCount { get; set; } = 0;
        public int PassCount { get; set; } = 0;
        public int FailCount { get; set; } = 0;
        public double LastInspectionTime { get; set; } = 0;
        public string? LastFailureReason { get; set; }
    }

    public class ProductionLine
    {
        public PLCState PLC { get; set; } = new PLCState();
        public RobotState Robot { get; set; } = new RobotState();
        public VisionSystem Vision { get; set; } = new VisionSystem();
        public ProductionStatus Status { get; set; } = ProductionStatus.Idle;
        public int PartsProduced { get; set; } = 0;
        public int PartsRejected { get; set; } = 0;
        public ProductionData CurrentSensorData { get; set; } = new ProductionData();
        public DateTime LastUpdated { get; set; } = DateTime.Now;
    }

    public class IOPoint
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public object Value { get; set; } = false;
        public string DataType { get; set; } = "Boolean";
    }

    public class OrderDetails
    {
        public int OrderId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int QuantityRequired { get; set; }
        public int QuantityProduced { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "Pending";
    }
} 