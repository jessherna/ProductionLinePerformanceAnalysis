# API Reference

## C# Production Line API

### Authentication
All API endpoints require authentication using JWT tokens.

```
POST /api/auth/login
```
Request body:
```json
{
  "username": "string",
  "password": "string"
}
```
Response:
```json
{
  "token": "string",
  "expiration": "datetime"
}
```

### Orders

#### Get All Orders
```
GET /api/orders
```
Response:
```json
[
  {
    "orderId": 1,
    "productId": 1,
    "productName": "Product A",
    "quantity": 100,
    "status": "In Progress",
    "priority": 2,
    "dueDate": "2024-04-15T00:00:00Z",
    "startTime": "2024-04-10T09:00:00Z",
    "endTime": null,
    "completedItems": 45,
    "createdAt": "2024-04-01T00:00:00Z",
    "updatedAt": "2024-04-10T09:00:00Z"
  }
]
```

#### Get Order by ID
```
GET /api/orders/{id}
```
Response:
```json
{
  "orderId": 1,
  "productId": 1,
  "productName": "Product A",
  "quantity": 100,
  "status": "In Progress",
  "priority": 2,
  "dueDate": "2024-04-15T00:00:00Z",
  "startTime": "2024-04-10T09:00:00Z",
  "endTime": null,
  "completedItems": 45,
  "createdAt": "2024-04-01T00:00:00Z",
  "updatedAt": "2024-04-10T09:00:00Z",
  "productionSteps": [
    {
      "stepId": 1,
      "name": "Assembly",
      "status": "Completed",
      "startTime": "2024-04-10T09:00:00Z",
      "endTime": "2024-04-10T11:30:00Z"
    },
    {
      "stepId": 2,
      "name": "Testing",
      "status": "In Progress",
      "startTime": "2024-04-10T11:35:00Z",
      "endTime": null
    }
  ]
}
```

#### Create Order
```
POST /api/orders
```
Request body:
```json
{
  "productId": 1,
  "quantity": 100,
  "priority": 2,
  "dueDate": "2024-04-15T00:00:00Z"
}
```
Response:
```json
{
  "orderId": 2,
  "productId": 1,
  "productName": "Product A",
  "quantity": 100,
  "status": "Pending",
  "priority": 2,
  "dueDate": "2024-04-15T00:00:00Z",
  "startTime": null,
  "endTime": null,
  "completedItems": 0,
  "createdAt": "2024-04-10T12:00:00Z",
  "updatedAt": "2024-04-10T12:00:00Z"
}
```

#### Update Order
```
PUT /api/orders/{id}
```
Request body:
```json
{
  "status": "In Progress",
  "priority": 1
}
```
Response: 204 No Content

#### Delete Order
```
DELETE /api/orders/{id}
```
Response: 204 No Content

### Products

#### Get All Products
```
GET /api/products
```
Response:
```json
[
  {
    "productId": 1,
    "name": "Product A",
    "description": "Description of Product A",
    "sku": "SKU-001",
    "imageUrl": "https://example.com/images/product-a.jpg",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### Get Product by ID
```
GET /api/products/{id}
```
Response:
```json
{
  "productId": 1,
  "name": "Product A",
  "description": "Description of Product A",
  "sku": "SKU-001",
  "imageUrl": "https://example.com/images/product-a.jpg",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "productionSteps": [
    {
      "stepId": 1,
      "name": "Assembly",
      "description": "Assemble components",
      "duration": 7200,
      "sequence": 1,
      "machineId": 1,
      "machineName": "Assembly Station 1"
    },
    {
      "stepId": 2,
      "name": "Testing",
      "description": "Test functionality",
      "duration": 3600,
      "sequence": 2,
      "machineId": 2,
      "machineName": "Testing Station 1"
    }
  ]
}
```

### Machines

#### Get All Machines
```
GET /api/machines
```
Response:
```json
[
  {
    "machineId": 1,
    "name": "Assembly Station 1",
    "type": "Assembly",
    "status": "Running",
    "lastMaintenance": "2024-03-15T00:00:00Z",
    "nextMaintenance": "2024-06-15T00:00:00Z",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2024-04-10T09:00:00Z"
  }
]
```

#### Get Machine Status
```
GET /api/machines/{id}/status
```
Response:
```json
{
  "machineId": 1,
  "name": "Assembly Station 1",
  "status": "Running",
  "currentOrderId": 1,
  "currentStepId": 1,
  "uptime": 7320,
  "cycleCount": 45,
  "temperature": 42.5,
  "pressure": 101.3,
  "vibration": 0.25,
  "rpm": 1200,
  "powerConsumption": 2.4,
  "lastUpdated": "2024-04-10T12:05:00Z"
}
```

#### Start Machine
```
POST /api/machines/{id}/start
```
Response: 204 No Content

#### Stop Machine
```
POST /api/machines/{id}/stop
```
Response: 204 No Content

### Anomalies

#### Get All Anomalies
```
GET /api/anomalies
```
Query parameters:
- `resolved` (boolean, optional): Filter by resolution status
- `machineId` (integer, optional): Filter by machine ID
- `severity` (integer, optional): Filter by minimum severity level

Response:
```json
[
  {
    "anomalyId": 1,
    "machineId": 1,
    "machineName": "Assembly Station 1",
    "timestamp": "2024-04-10T11:45:00Z",
    "type": "Temperature",
    "severity": 3,
    "description": "Temperature exceeds normal operating range",
    "resolved": false,
    "resolvedAt": null,
    "createdAt": "2024-04-10T11:45:00Z",
    "updatedAt": "2024-04-10T11:45:00Z"
  }
]
```

#### Mark Anomaly as Resolved
```
POST /api/anomalies/{id}/resolve
```
Response: 204 No Content

## Python Analysis API

### Anomaly Detection

#### Detect Anomalies
```
POST /api/analysis/detect-anomalies
```
Request body:
```json
{
  "machine_id": 1,
  "readings": [
    {
      "timestamp": "2024-04-10T12:00:00Z",
      "temperature": 42.5,
      "pressure": 101.3,
      "vibration": 0.25,
      "rpm": 1200,
      "power_consumption": 2.4
    },
    {
      "timestamp": "2024-04-10T12:01:00Z",
      "temperature": 43.2,
      "pressure": 101.5,
      "vibration": 0.28,
      "rpm": 1210,
      "power_consumption": 2.5
    }
  ]
}
```
Response:
```json
{
  "machine_id": 1,
  "anomalies": [
    {
      "timestamp": "2024-04-10T12:01:00Z",
      "type": "Temperature",
      "severity": 2,
      "description": "Temperature increasing abnormally",
      "confidence": 0.87,
      "contributing_factors": ["temperature", "vibration"]
    }
  ]
}
```

#### Train Model
```
POST /api/analysis/train-model
```
Request body:
```json
{
  "machine_id": 1,
  "start_date": "2024-03-01T00:00:00Z",
  "end_date": "2024-04-01T00:00:00Z"
}
```
Response:
```json
{
  "machine_id": 1,
  "model_id": "m-1234567890",
  "training_status": "completed",
  "metrics": {
    "precision": 0.95,
    "recall": 0.92,
    "f1_score": 0.93
  },
  "training_time": 345
}
```

### Predictive Maintenance

#### Predict Maintenance
```
GET /api/analysis/predict-maintenance/{machine_id}
```
Response:
```json
{
  "machine_id": 1,
  "prediction": {
    "days_remaining": 45,
    "confidence": 0.89,
    "components_at_risk": [
      {
        "name": "Bearing Assembly",
        "days_remaining": 45,
        "confidence": 0.89
      },
      {
        "name": "Drive Belt",
        "days_remaining": 76,
        "confidence": 0.92
      }
    ]
  },
  "last_updated": "2024-04-10T12:00:00Z"
}
```

## SignalR Hub Endpoints

The system uses SignalR for real-time updates. The following events are broadcast to connected clients:

### Connection
```javascript
// Connect to the SignalR hub
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/productionHub")
    .build();
```

### Events
```javascript
// Machine status updates
connection.on("machineStatusUpdated", (machineStatus) => {
    // Handle updated machine status
});

// New anomaly detected
connection.on("anomalyDetected", (anomaly) => {
    // Handle new anomaly
});

// Order status updated
connection.on("orderStatusUpdated", (order) => {
    // Handle updated order status
});

// Production progress updated
connection.on("productionProgressUpdated", (progress) => {
    // Handle updated production progress
});
```

### Methods
```javascript
// Start a machine
await connection.invoke("StartMachine", machineId);

// Stop a machine
await connection.invoke("StopMachine", machineId);

// Start an order
await connection.invoke("StartOrder", orderId);

// Pause an order
await connection.invoke("PauseOrder", orderId);

// Resume an order
await connection.invoke("ResumeOrder", orderId);

// Cancel an order
await connection.invoke("CancelOrder", orderId);
``` 