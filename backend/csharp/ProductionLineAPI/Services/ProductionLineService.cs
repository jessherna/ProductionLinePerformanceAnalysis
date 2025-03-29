using ProductionLineAPI.Models;

namespace ProductionLineAPI.Services
{
    public class ProductionLineService : IProductionLineService
    {
        private readonly IPythonAnalysisService _pythonAnalysisService;
        private readonly ILogger<ProductionLineService> _logger;
        private readonly Random _random = new Random();
        private Timer? _updateTimer;
        private ProductionLine _productionLine = new ProductionLine();
        private List<OrderDetails> _orders = new List<OrderDetails>();
        private bool _isInitialized = false;

        public ProductionLineService(
            IPythonAnalysisService pythonAnalysisService,
            ILogger<ProductionLineService> logger)
        {
            _pythonAnalysisService = pythonAnalysisService;
            _logger = logger;
            
            // Create some dummy orders
            _orders = new List<OrderDetails>
            {
                new OrderDetails
                {
                    OrderId = 1001,
                    ProductName = "Widget A",
                    QuantityRequired = 100,
                    QuantityProduced = 0,
                    DueDate = DateTime.Now.AddDays(2),
                    Status = "Pending"
                },
                new OrderDetails
                {
                    OrderId = 1002,
                    ProductName = "Widget B",
                    QuantityRequired = 50,
                    QuantityProduced = 0,
                    DueDate = DateTime.Now.AddDays(3),
                    Status = "Pending"
                },
                new OrderDetails
                {
                    OrderId = 1003,
                    ProductName = "Widget C",
                    QuantityRequired = 75,
                    QuantityProduced = 0,
                    DueDate = DateTime.Now.AddDays(5),
                    Status = "Pending"
                }
            };
        }

        public async Task InitializeAsync()
        {
            if (_isInitialized)
            {
                return;
            }

            _logger.LogInformation("Initializing production line...");

            // Simulate PLC initialization
            _productionLine.PLC.Status = DeviceStatus.Initializing;
            await Task.Delay(1000);
            _productionLine.PLC.Connected = true;
            _productionLine.PLC.Status = DeviceStatus.Ready;
            _productionLine.PLC.Inputs = GenerateDummyIOPoints("Input", 8);
            _productionLine.PLC.Outputs = GenerateDummyIOPoints("Output", 8);

            // Simulate Robot initialization
            _productionLine.Robot.Status = DeviceStatus.Initializing;
            await Task.Delay(500);
            _productionLine.Robot.Connected = true;
            _productionLine.Robot.Status = DeviceStatus.Ready;
            _productionLine.Robot.CurrentProgram = "Home";

            // Simulate Vision System initialization
            _productionLine.Vision.Status = DeviceStatus.Initializing;
            await Task.Delay(750);
            _productionLine.Vision.Connected = true;
            _productionLine.Vision.Status = DeviceStatus.Ready;

            // Get initial sensor data
            await UpdateSensorDataAsync();

            _isInitialized = true;
            _logger.LogInformation("Production line initialized successfully");
        }

        public async Task StartProductionAsync()
        {
            if (!_isInitialized)
            {
                await InitializeAsync();
            }

            _logger.LogInformation("Starting production...");

            if (_productionLine.Status == ProductionStatus.Paused)
            {
                // Resume from paused state
                _productionLine.Status = ProductionStatus.Running;
                _productionLine.PLC.Status = DeviceStatus.Running;
                _productionLine.Robot.Status = DeviceStatus.Running;
                _productionLine.Vision.Status = DeviceStatus.Running;
            }
            else if (_productionLine.Status != ProductionStatus.Running)
            {
                // Start from idle or stopped state
                _productionLine.Status = ProductionStatus.Running;
                _productionLine.PLC.Status = DeviceStatus.Running;
                _productionLine.Robot.Status = DeviceStatus.Running;
                _productionLine.Vision.Status = DeviceStatus.Running;

                // Start the update timer to simulate production
                _updateTimer = new Timer(UpdateProductionStateCallback, null, 0, 2000);
            }

            // Update the first order to "In Progress"
            var order = _orders.FirstOrDefault(o => o.Status == "Pending");
            if (order != null)
            {
                order.Status = "In Progress";
            }
        }

        public async Task StopProductionAsync()
        {
            _logger.LogInformation("Stopping production...");

            _productionLine.Status = ProductionStatus.Stopped;
            _productionLine.PLC.Status = DeviceStatus.Ready;
            _productionLine.Robot.Status = DeviceStatus.Ready;
            _productionLine.Vision.Status = DeviceStatus.Ready;

            // Stop the update timer
            _updateTimer?.Dispose();
            _updateTimer = null;

            await Task.CompletedTask;
        }

        public async Task PauseProductionAsync()
        {
            _logger.LogInformation("Pausing production...");

            _productionLine.Status = ProductionStatus.Paused;

            // Stop the update timer
            _updateTimer?.Dispose();
            _updateTimer = null;

            await Task.CompletedTask;
        }

        public async Task ResetAsync()
        {
            _logger.LogInformation("Resetting production line...");

            // Stop production if running
            if (_productionLine.Status == ProductionStatus.Running || 
                _productionLine.Status == ProductionStatus.Paused)
            {
                await StopProductionAsync();
            }

            _productionLine.Status = ProductionStatus.Idle;
            _productionLine.PLC.Status = DeviceStatus.Ready;
            _productionLine.PLC.CycleCount = 0;
            _productionLine.PLC.EmergencyStopActive = false;
            _productionLine.Robot.Status = DeviceStatus.Ready;
            _productionLine.Robot.XPosition = 0;
            _productionLine.Robot.YPosition = 0;
            _productionLine.Robot.ZPosition = 0;
            _productionLine.Vision.Status = DeviceStatus.Ready;
            _productionLine.Vision.InspectionCount = 0;
            _productionLine.Vision.PassCount = 0;
            _productionLine.Vision.FailCount = 0;
            _productionLine.PartsProduced = 0;
            _productionLine.PartsRejected = 0;

            // Reset orders
            foreach (var order in _orders)
            {
                order.QuantityProduced = 0;
                order.Status = "Pending";
            }

            await Task.CompletedTask;
        }

        public async Task EmergencyStopAsync()
        {
            _logger.LogInformation("Emergency stop activated!");

            _productionLine.Status = ProductionStatus.Stopped;
            _productionLine.PLC.Status = DeviceStatus.EmergencyStop;
            _productionLine.PLC.EmergencyStopActive = true;
            _productionLine.Robot.Status = DeviceStatus.EmergencyStop;
            _productionLine.Vision.Status = DeviceStatus.EmergencyStop;

            // Stop the update timer
            _updateTimer?.Dispose();
            _updateTimer = null;

            await Task.CompletedTask;
        }

        public async Task<ProductionLine> GetStatusAsync()
        {
            return await Task.FromResult(_productionLine);
        }

        public async Task<List<OrderDetails>> GetOrdersAsync()
        {
            return await Task.FromResult(_orders);
        }

        public async Task UpdateSensorDataAsync()
        {
            try
            {
                // Get new sensor data from the Python API
                var newData = await _pythonAnalysisService.GenerateReadingAsync();
                _productionLine.CurrentSensorData = newData;
                _productionLine.LastUpdated = DateTime.Now;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating sensor data");
            }
        }

        private List<IOPoint> GenerateDummyIOPoints(string prefix, int count)
        {
            var points = new List<IOPoint>();
            for (int i = 0; i < count; i++)
            {
                points.Add(new IOPoint
                {
                    Name = $"{prefix}{i}",
                    Address = $"%{prefix[0]}{i}",
                    Value = i % 2 == 0,
                    DataType = "Boolean"
                });
            }
            return points;
        }

        private async void UpdateProductionStateCallback(object? state)
        {
            if (_productionLine.Status != ProductionStatus.Running)
            {
                return;
            }

            try
            {
                // Update sensor data
                await UpdateSensorDataAsync();

                // Update PLC state
                _productionLine.PLC.CycleCount++;
                _productionLine.PLC.CycleTime = _random.Next(15, 25) / 10.0;
                
                // Toggle some I/O points to simulate activity
                foreach (var input in _productionLine.PLC.Inputs)
                {
                    if (_random.Next(10) < 3) // 30% chance to toggle
                    {
                        input.Value = !(bool)input.Value;
                    }
                }

                // Update Robot state (simulate movement)
                _productionLine.Robot.XPosition = Math.Round(_random.NextDouble() * 100, 2);
                _productionLine.Robot.YPosition = Math.Round(_random.NextDouble() * 100, 2);
                _productionLine.Robot.ZPosition = Math.Round(_random.NextDouble() * 50, 2);
                _productionLine.Robot.Speed = Math.Round(_random.NextDouble() * 100, 2);

                // Update Vision System
                bool passInspection = _random.NextDouble() > 0.15; // 15% failure rate
                _productionLine.Vision.InspectionCount++;
                
                if (passInspection)
                {
                    _productionLine.Vision.PassCount++;
                    _productionLine.PartsProduced++;

                    // Update order quantity
                    var order = _orders.FirstOrDefault(o => o.Status == "In Progress");
                    if (order != null)
                    {
                        order.QuantityProduced++;
                        
                        // Check if order is complete
                        if (order.QuantityProduced >= order.QuantityRequired)
                        {
                            order.Status = "Completed";
                            
                            // Start the next order
                            var nextOrder = _orders.FirstOrDefault(o => o.Status == "Pending");
                            if (nextOrder != null)
                            {
                                nextOrder.Status = "In Progress";
                            }
                            else
                            {
                                // All orders complete
                                _productionLine.Status = ProductionStatus.Completed;
                                await StopProductionAsync();
                            }
                        }
                    }
                }
                else
                {
                    _productionLine.Vision.FailCount++;
                    _productionLine.PartsRejected++;
                    _productionLine.Vision.LastFailureReason = GetRandomFailureReason();
                }

                // Simulate anomaly detection
                var anomalyResult = await _pythonAnalysisService.PredictAnomalyAsync(_productionLine.CurrentSensorData);
                if (anomalyResult.IsAnomaly)
                {
                    _logger.LogWarning("Anomaly detected: {Cause} - {Recommendation}", 
                        anomalyResult.ProbableCause, 
                        anomalyResult.Recommendation);

                    // Randomly generate an error that stops production (small chance)
                    if (_random.Next(100) < 5) // 5% chance of error
                    {
                        _productionLine.Status = ProductionStatus.Error;
                        _productionLine.PLC.Status = DeviceStatus.Error;
                        _productionLine.PLC.ErrorMessage = $"Error: {anomalyResult.ProbableCause}";
                        
                        // Stop the update timer
                        _updateTimer?.Dispose();
                        _updateTimer = null;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating production state");
            }
        }

        private string GetRandomFailureReason()
        {
            string[] reasons = new[] 
            {
                "Dimensional error",
                "Surface defect",
                "Missing component",
                "Alignment error",
                "Color variance",
                "Label defect"
            };

            return reasons[_random.Next(reasons.Length)];
        }
    }
} 