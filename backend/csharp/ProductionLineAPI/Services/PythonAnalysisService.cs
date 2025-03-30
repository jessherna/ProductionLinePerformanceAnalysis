using System.Net.Http.Json;
using ProductionLineAPI.Models;
using System.Text.Json;
using System.Text;

namespace ProductionLineAPI.Services
{
    public class PythonAnalysisService : IPythonAnalysisService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PythonAnalysisService> _logger;
        private readonly string _baseUrl;
        private bool _advancedAnalysisAvailable = false;
        private List<string> _availableModels = new List<string>();

        public PythonAnalysisService(HttpClient httpClient, IConfiguration configuration, ILogger<PythonAnalysisService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _baseUrl = configuration["PythonApiSettings:BaseUrl"] ?? "http://localhost:5000/api";
            
            // Check API status on startup
            _ = InitializeAsync();
        }
        
        private async Task InitializeAsync()
        {
            try
            {
                var status = await GetApiStatusAsync();
                _advancedAnalysisAvailable = status.AdvancedAnalysisAvailable;
                _availableModels = status.AdvancedModels;
                _logger.LogInformation($"Python Analysis API status: {(_advancedAnalysisAvailable ? "Advanced analysis available" : "Basic analysis only")}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize connection to Python Analysis API");
            }
        }

        public async Task<ProductionSummary> GetSummaryAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/summary");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<ProductionSummary>() ?? new ProductionSummary();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting production summary from Python API");
                return new ProductionSummary();
            }
        }

        public async Task<AnomalyList> GetAnomaliesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/anomalies");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<AnomalyList>() ?? new AnomalyList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting anomalies from Python API");
                return new AnomalyList();
            }
        }

        public async Task<TimeSeriesData> GetLatestDataAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/latest-data");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<TimeSeriesData>() ?? new TimeSeriesData();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest data from Python API");
                return new TimeSeriesData();
            }
        }

        public async Task<AnomalyPredictionResult> PredictAnomalyAsync(ProductionData data)
        {
            try
            {
                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(data),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/predict", jsonContent);
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<AnomalyPredictionResult>() ?? new AnomalyPredictionResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting anomaly from Python API");
                return new AnomalyPredictionResult
                {
                    IsAnomaly = false,
                    AnomalyScore = 0,
                    Recommendation = "Error communicating with analysis service"
                };
            }
        }

        public async Task<ProductionData> GenerateReadingAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/generate-reading");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<ProductionData>() ?? new ProductionData();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating reading from Python API");
                
                // Return a random reading if the API is not available
                var random = new Random();
                return new ProductionData
                {
                    Temperature = random.Next(40, 60),
                    Pressure = random.Next(90, 110),
                    Speed = random.Next(65, 85),
                    Vibration = random.Next(20, 30),
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                };
            }
        }
        
        // Advanced Analysis Methods
        
        public async Task<AnalysisApiStatus> GetApiStatusAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/health");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<AnalysisApiStatus>() ?? new AnalysisApiStatus();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting API status from Python API");
                return new AnalysisApiStatus();
            }
        }
        
        public async Task<AdvancedAnomalyResult> PerformAdvancedAnalysisAsync(ProductionData data, string modelName = null)
        {
            if (!_advancedAnalysisAvailable)
            {
                _logger.LogWarning("Advanced analysis was requested but is not available");
                return new AdvancedAnomalyResult 
                { 
                    IsAnomaly = false,
                    Recommendation = "Advanced analysis not available" 
                };
            }
            
            try
            {
                var requestData = new Dictionary<string, object>
                {
                    { "temperature", data.Temperature },
                    { "pressure", data.Pressure },
                    { "speed", data.Speed },
                    { "vibration", data.Vibration }
                };
                
                if (!string.IsNullOrEmpty(modelName))
                {
                    requestData.Add("model", modelName);
                }
                
                var jsonContent = new StringContent(
                    JsonSerializer.Serialize(requestData),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/advanced-anomaly", jsonContent);
                response.EnsureSuccessStatusCode();
                
                var result = await response.Content.ReadFromJsonAsync<AdvancedAnomalyResult>();
                return result ?? new AdvancedAnomalyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing advanced analysis from Python API");
                return new AdvancedAnomalyResult
                {
                    IsAnomaly = false,
                    AnomalyScore = 0,
                    Recommendation = "Error communicating with advanced analysis service"
                };
            }
        }
        
        public async Task<ModelList> GetAvailableModelsAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/available-models");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<ModelList>() ?? new ModelList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available models from Python API");
                return new ModelList();
            }
        }
        
        public async Task<AnalysisResults> GetAnalysisResultsAsync(string modelType = "isolation_forest")
        {
            if (!_advancedAnalysisAvailable)
            {
                _logger.LogWarning("Analysis results were requested but advanced analysis is not available");
                return new AnalysisResults();
            }
            
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/analysis-results?model={modelType}");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<AnalysisResults>() ?? new AnalysisResults();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analysis results from Python API");
                return new AnalysisResults();
            }
        }
        
        public async Task<PlotList> GetAvailablePlotsAsync()
        {
            if (!_advancedAnalysisAvailable)
            {
                _logger.LogWarning("Plot list was requested but advanced analysis is not available");
                return new PlotList();
            }
            
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/analysis-plots");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadFromJsonAsync<PlotList>() ?? new PlotList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available plots from Python API");
                return new PlotList();
            }
        }
        
        public async Task<byte[]> GetPlotImageAsync(string plotName)
        {
            if (!_advancedAnalysisAvailable)
            {
                _logger.LogWarning("Plot image was requested but advanced analysis is not available");
                return Array.Empty<byte>();
            }
            
            try
            {
                var response = await _httpClient.GetAsync($"{_baseUrl}/plot/{plotName}");
                response.EnsureSuccessStatusCode();
                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting plot image from Python API");
                return Array.Empty<byte>();
            }
        }
    }
} 