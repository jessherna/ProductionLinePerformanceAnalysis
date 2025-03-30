using System.Text.Json.Serialization;

namespace ProductionLineAPI.Models
{
    public class AnalysisApiStatus
    {
        public string Status { get; set; } = "unknown";
        public bool AdvancedAnalysisAvailable { get; set; } = false;
        public List<string> AdvancedModels { get; set; } = new List<string>();
    }
    
    public class AdvancedAnomalyResult
    {
        public bool IsAnomaly { get; set; }
        public double AnomalyScore { get; set; }
        public string Model { get; set; } = "basic";
        public string Recommendation { get; set; } = "No recommendation";
        
        // Extended properties
        public Dictionary<string, double> FeatureContributions { get; set; } = new Dictionary<string, double>();
        public List<string> SimilarCases { get; set; } = new List<string>();
    }
    
    public class ModelInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Features { get; set; } = new List<string>();
    }
    
    public class ModelList
    {
        [JsonPropertyName("models")]
        public Dictionary<string, ModelInfo> Models { get; set; } = new Dictionary<string, ModelInfo>();
        
        [JsonPropertyName("default_model")]
        public string DefaultModel { get; set; } = "basic";
    }
    
    public class AnalysisResultItem
    {
        public Dictionary<string, object> Values { get; set; } = new Dictionary<string, object>();
    }
    
    public class AnalysisMetrics
    {
        public double Precision { get; set; }
        public double Recall { get; set; }
        public double F1 { get; set; }
        public int TruePositives { get; set; }
        public int FalsePositives { get; set; }
        public int TrueNegatives { get; set; }
        public int FalseNegatives { get; set; }
    }
    
    public class AnalysisResults
    {
        public string Model { get; set; } = string.Empty;
        public AnalysisMetrics? Metrics { get; set; }
        public List<AnalysisResultItem> Results { get; set; } = new List<AnalysisResultItem>();
        public int TotalRecords { get; set; }
    }
    
    public class PlotInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
    
    public class PlotList
    {
        public List<PlotInfo> Plots { get; set; } = new List<PlotInfo>();
    }
} 