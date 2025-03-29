using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ProductionLineAPI.Hubs;
using ProductionLineAPI.Models;
using ProductionLineAPI.Services;

namespace ProductionLineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductionLineController : ControllerBase
    {
        private readonly IProductionLineService _productionLineService;
        private readonly IHubContext<ProductionHub> _hubContext;
        private readonly ILogger<ProductionLineController> _logger;

        public ProductionLineController(
            IProductionLineService productionLineService,
            IHubContext<ProductionHub> hubContext,
            ILogger<ProductionLineController> logger)
        {
            _productionLineService = productionLineService;
            _hubContext = hubContext;
            _logger = logger;
        }

        [HttpGet("status")]
        public async Task<ActionResult<ProductionLine>> GetStatus()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting production line status");
                return StatusCode(500, "An error occurred while retrieving production line status");
            }
        }

        [HttpGet("orders")]
        public async Task<ActionResult<List<OrderDetails>>> GetOrders()
        {
            try
            {
                var orders = await _productionLineService.GetOrdersAsync();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orders");
                return StatusCode(500, "An error occurred while retrieving orders");
            }
        }

        [HttpPost("initialize")]
        public async Task<IActionResult> Initialize()
        {
            try
            {
                await _productionLineService.InitializeAsync();
                var status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                return Ok(new { Message = "Production line initialized successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing production line");
                return StatusCode(500, "An error occurred while initializing the production line");
            }
        }

        [HttpPost("start")]
        public async Task<IActionResult> Start()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                var oldStatus = status.Status;
                
                await _productionLineService.StartProductionAsync();
                
                status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                await _hubContext.Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), status.Status.ToString());
                
                return Ok(new { Message = "Production started successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting production");
                return StatusCode(500, "An error occurred while starting production");
            }
        }

        [HttpPost("stop")]
        public async Task<IActionResult> Stop()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                var oldStatus = status.Status;
                
                await _productionLineService.StopProductionAsync();
                
                status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                await _hubContext.Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), status.Status.ToString());
                
                return Ok(new { Message = "Production stopped successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping production");
                return StatusCode(500, "An error occurred while stopping production");
            }
        }

        [HttpPost("pause")]
        public async Task<IActionResult> Pause()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                var oldStatus = status.Status;
                
                await _productionLineService.PauseProductionAsync();
                
                status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                await _hubContext.Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), status.Status.ToString());
                
                return Ok(new { Message = "Production paused successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error pausing production");
                return StatusCode(500, "An error occurred while pausing production");
            }
        }

        [HttpPost("reset")]
        public async Task<IActionResult> Reset()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                var oldStatus = status.Status;
                
                await _productionLineService.ResetAsync();
                
                status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                await _hubContext.Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), status.Status.ToString());
                
                return Ok(new { Message = "Production line reset successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting production line");
                return StatusCode(500, "An error occurred while resetting the production line");
            }
        }

        [HttpPost("emergency-stop")]
        public async Task<IActionResult> EmergencyStop()
        {
            try
            {
                var status = await _productionLineService.GetStatusAsync();
                var oldStatus = status.Status;
                
                await _productionLineService.EmergencyStopAsync();
                
                status = await _productionLineService.GetStatusAsync();
                await _hubContext.Clients.All.SendAsync("ReceiveProductionUpdate", status);
                await _hubContext.Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), status.Status.ToString());
                await _hubContext.Clients.All.SendAsync("ReceiveErrorAlert", "Emergency stop activated!");
                
                return Ok(new { Message = "Emergency stop activated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error activating emergency stop");
                return StatusCode(500, "An error occurred while activating emergency stop");
            }
        }
    }
} 