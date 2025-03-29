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
    }
} 