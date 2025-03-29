using ProductionLineAPI.Models;

namespace ProductionLineAPI.Services
{
    public interface IProductionLineService
    {
        Task InitializeAsync();
        Task StartProductionAsync();
        Task StopProductionAsync();
        Task PauseProductionAsync();
        Task ResetAsync();
        Task EmergencyStopAsync();
        Task<ProductionLine> GetStatusAsync();
        Task<List<OrderDetails>> GetOrdersAsync();
        Task UpdateSensorDataAsync();
    }
} 