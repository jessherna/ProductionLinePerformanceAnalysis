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

        public PythonAnalysisService(HttpClient httpClient, IConfiguration configuration, ILogger<PythonAnalysisService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _baseUrl = configuration["PythonApiSettings:BaseUrl"] ?? "http://localhost:5000/api";
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
    }
} 