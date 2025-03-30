using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ProductionLineAPI.Hubs;
using ProductionLineAPI.Models;
using ProductionLineAPI.Services;

namespace ProductionLineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IPythonAnalysisService _pythonAnalysisService;
        private readonly IHubContext<ProductionHub> _hubContext;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(
            IPythonAnalysisService pythonAnalysisService,
            IHubContext<ProductionHub> hubContext,
            ILogger<AnalyticsController> logger)
        {
            _pythonAnalysisService = pythonAnalysisService;
            _hubContext = hubContext;
            _logger = logger;
        }

        [HttpGet("summary")]
        public async Task<ActionResult<ProductionSummary>> GetSummary()
        {
            try
            {
                var summary = await _pythonAnalysisService.GetSummaryAsync();
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analytics summary");
                return StatusCode(500, "An error occurred while retrieving analytics summary");
            }
        }

        [HttpGet("anomalies")]
        public async Task<ActionResult<AnomalyList>> GetAnomalies()
        {
            try
            {
                var anomalies = await _pythonAnalysisService.GetAnomaliesAsync();
                return Ok(anomalies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting anomalies");
                return StatusCode(500, "An error occurred while retrieving anomalies");
            }
        }

        [HttpGet("latest-data")]
        public async Task<ActionResult<TimeSeriesData>> GetLatestData()
        {
            try
            {
                var data = await _pythonAnalysisService.GetLatestDataAsync();
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting latest data");
                return StatusCode(500, "An error occurred while retrieving latest data");
            }
        }

        [HttpPost("predict")]
        public async Task<ActionResult<AnomalyPredictionResult>> PredictAnomaly(ProductionData data)
        {
            try
            {
                var result = await _pythonAnalysisService.PredictAnomalyAsync(data);
                
                // If it's an anomaly, send an alert via SignalR
                if (result.IsAnomaly)
                {
                    await _hubContext.Clients.All.SendAsync("ReceiveAnomalyAlert", result, data);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting anomaly");
                return StatusCode(500, "An error occurred while predicting anomaly");
            }
        }
        
        // Advanced Analysis Endpoints
        
        [HttpGet("status")]
        public async Task<ActionResult<AnalysisApiStatus>> GetAnalysisStatus()
        {
            try
            {
                var status = await _pythonAnalysisService.GetApiStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analysis API status");
                return StatusCode(500, "An error occurred while retrieving analysis API status");
            }
        }
        
        [HttpPost("advanced-predict")]
        public async Task<ActionResult<AdvancedAnomalyResult>> PerformAdvancedAnalysis([FromBody] AdvancedAnalysisRequest request)
        {
            try
            {
                var result = await _pythonAnalysisService.PerformAdvancedAnalysisAsync(request.Data, request.ModelName);
                
                // If it's an anomaly, send an enhanced alert via SignalR
                if (result.IsAnomaly)
                {
                    await _hubContext.Clients.All.SendAsync("ReceiveAdvancedAnomalyAlert", result, request.Data);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing advanced analysis");
                return StatusCode(500, "An error occurred while performing advanced analysis");
            }
        }
        
        [HttpGet("models")]
        public async Task<ActionResult<ModelList>> GetAvailableModels()
        {
            try
            {
                var models = await _pythonAnalysisService.GetAvailableModelsAsync();
                return Ok(models);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available models");
                return StatusCode(500, "An error occurred while retrieving available models");
            }
        }
        
        [HttpGet("results")]
        public async Task<ActionResult<AnalysisResults>> GetAnalysisResults([FromQuery] string modelType = "isolation_forest")
        {
            try
            {
                var results = await _pythonAnalysisService.GetAnalysisResultsAsync(modelType);
                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analysis results");
                return StatusCode(500, "An error occurred while retrieving analysis results");
            }
        }
        
        [HttpGet("plots")]
        public async Task<ActionResult<PlotList>> GetAvailablePlots()
        {
            try
            {
                var plots = await _pythonAnalysisService.GetAvailablePlotsAsync();
                return Ok(plots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available plots");
                return StatusCode(500, "An error occurred while retrieving available plots");
            }
        }
        
        [HttpGet("plot/{plotName}")]
        public async Task<ActionResult> GetPlotImage(string plotName)
        {
            try
            {
                var imageData = await _pythonAnalysisService.GetPlotImageAsync(plotName);
                
                if (imageData.Length == 0)
                {
                    return NotFound($"Plot '{plotName}' not found");
                }
                
                // Determine content type
                string contentType = "image/png";
                if (plotName.EndsWith(".jpg") || plotName.EndsWith(".jpeg"))
                {
                    contentType = "image/jpeg";
                }
                
                return File(imageData, contentType);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting plot image");
                return StatusCode(500, "An error occurred while retrieving plot image");
            }
        }
    }
    
    public class AdvancedAnalysisRequest
    {
        public ProductionData Data { get; set; } = new ProductionData();
        public string? ModelName { get; set; }
    }
} 