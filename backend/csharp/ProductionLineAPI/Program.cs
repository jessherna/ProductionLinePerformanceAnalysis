using ProductionLineAPI.Hubs;
using ProductionLineAPI.Services;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with appropriate settings for SignalR
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder
            .SetIsOriginAllowed(_ => true) // Allow any origin
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Required for SignalR
    });
});

// Add SignalR with improved settings
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
    options.KeepAliveInterval = TimeSpan.FromSeconds(10);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 102400; // 100 KB
    options.StreamBufferCapacity = 20; // Default is 10
});

// Register services
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IPythonAnalysisService, PythonAnalysisService>();
builder.Services.AddSingleton<IProductionLineService, ProductionLineService>(sp => 
{
    var pythonService = sp.GetRequiredService<IPythonAnalysisService>();
    var logger = sp.GetRequiredService<ILogger<ProductionLineService>>();
    var hubContext = sp.GetRequiredService<IHubContext<ProductionHub>>();
    return new ProductionLineService(pythonService, logger, hubContext);
});

// Configure Python API URL
builder.Services.Configure<PythonApiSettings>(builder.Configuration.GetSection("PythonApiSettings"));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: Use CORS before other middleware
app.UseCors("AllowAll");

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

// Configure SignalR hub at the correct endpoint
app.MapHub<ProductionHub>("/hubs/production");

app.Run();

// Settings class
public class PythonApiSettings
{
    public string BaseUrl { get; set; } = "http://localhost:5000/api";
}
