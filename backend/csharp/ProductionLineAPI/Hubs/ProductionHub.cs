using Microsoft.AspNetCore.SignalR;
using ProductionLineAPI.Models;

namespace ProductionLineAPI.Hubs
{
    public class ProductionHub : Hub
    {
        private readonly ILogger<ProductionHub> _logger;

        public ProductionHub(ILogger<ProductionHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client connected: {Context.ConnectionId}");
            await Clients.Caller.SendAsync("ConnectionEstablished", new { message = "Connected to ProductionHub", connectionId = Context.ConnectionId });
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            _logger.LogInformation($"Client disconnected: {Context.ConnectionId}. Exception: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendProductionUpdate(ProductionLine productionLine)
        {
            _logger.LogInformation($"Sending production update to all clients");
            await Clients.All.SendAsync("ReceiveProductionUpdate", productionLine);
        }

        public async Task SendAnomalyAlert(AnomalyPredictionResult anomaly, ProductionData data)
        {
            _logger.LogInformation($"Sending anomaly alert to all clients");
            await Clients.All.SendAsync("ReceiveAnomalyAlert", anomaly, data);
        }

        public async Task SendStatusChange(ProductionStatus oldStatus, ProductionStatus newStatus)
        {
            _logger.LogInformation($"Sending status change from {oldStatus} to {newStatus}");
            await Clients.All.SendAsync("ReceiveStatusChange", oldStatus.ToString(), newStatus.ToString());
        }

        public async Task SendErrorAlert(string errorMessage)
        {
            _logger.LogInformation($"Sending error alert: {errorMessage}");
            await Clients.All.SendAsync("ReceiveErrorAlert", errorMessage);
        }

        // Simple ping method for connection testing
        public async Task Ping()
        {
            _logger.LogInformation($"Ping received from client: {Context.ConnectionId}");
            await Clients.Caller.SendAsync("Pong", new { timestamp = DateTime.UtcNow, message = "Pong from server" });
        }
    }
} 