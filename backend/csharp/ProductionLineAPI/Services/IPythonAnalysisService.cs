using ProductionLineAPI.Models;

namespace ProductionLineAPI.Services
{
    public interface IPythonAnalysisService
    {
        Task<ProductionSummary> GetSummaryAsync();
        Task<AnomalyList> GetAnomaliesAsync();
        Task<TimeSeriesData> GetLatestDataAsync();
        Task<AnomalyPredictionResult> PredictAnomalyAsync(ProductionData data);
        Task<ProductionData> GenerateReadingAsync();
        
        // Advanced analysis methods
        Task<AnalysisApiStatus> GetApiStatusAsync();
        Task<AdvancedAnomalyResult> PerformAdvancedAnalysisAsync(ProductionData data, string modelName = null);
        Task<ModelList> GetAvailableModelsAsync();
        Task<AnalysisResults> GetAnalysisResultsAsync(string modelType = "isolation_forest");
        Task<PlotList> GetAvailablePlotsAsync();
        Task<byte[]> GetPlotImageAsync(string plotName);
    }
} 