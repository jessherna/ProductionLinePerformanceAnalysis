namespace ProductionLineAPI.Models
{
    public class ProductionData
    {
        public double Temperature { get; set; }
        public double Pressure { get; set; }
        public double Speed { get; set; }
        public double Vibration { get; set; }
        public string Timestamp { get; set; } = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    }

    public class AnomalyPredictionResult
    {
        public bool IsAnomaly { get; set; }
        public double AnomalyScore { get; set; }
        public string? ProbableCause { get; set; }
        public string? Recommendation { get; set; }
    }

    public class ProductionSummary
    {
        public int TotalReadings { get; set; }
        public int AnomaliesDetected { get; set; }
        public double AnomalyPercentage { get; set; }
        public double AvgTemperature { get; set; }
        public double AvgPressure { get; set; }
        public double AvgSpeed { get; set; }
        public double AvgVibration { get; set; }
    }

    public class AnomalyData : ProductionData
    {
        public double AnomalyScore { get; set; }
    }

    public class TimeSeriesData
    {
        public List<ProductionData> Data { get; set; } = new List<ProductionData>();
    }

    public class AnomalyList
    {
        public List<AnomalyData> Anomalies { get; set; } = new List<AnomalyData>();
    }
} 