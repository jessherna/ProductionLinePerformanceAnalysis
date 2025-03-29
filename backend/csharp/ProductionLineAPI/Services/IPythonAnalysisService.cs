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
    }
} 