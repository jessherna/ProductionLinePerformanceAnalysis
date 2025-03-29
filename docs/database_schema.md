# Database Schema

## Overview
The Production Line Control System uses a SQL database for persistent storage and MongoDB for sensor data storage. Below is a description of the main database tables and their relationships.

## SQL Database (Production Data)

### Products
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| ProductID | INT | Primary Key |
| Name | VARCHAR(100) | Product name |
| Description | VARCHAR(500) | Product description |
| SKU | VARCHAR(50) | Stock Keeping Unit |
| ImageURL | VARCHAR(200) | Product image URL |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last update timestamp |

### ProductionOrders
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| OrderID | INT | Primary Key |
| ProductID | INT | Foreign Key to Products |
| Quantity | INT | Order quantity |
| Status | VARCHAR(20) | Current status (Pending, In Progress, Completed, Failed) |
| Priority | INT | Order priority (1-5) |
| DueDate | DATETIME | Due date for completion |
| StartTime | DATETIME | Actual start time |
| EndTime | DATETIME | Actual end time |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last update timestamp |

### ProductionSteps
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| StepID | INT | Primary Key |
| ProductID | INT | Foreign Key to Products |
| Name | VARCHAR(100) | Step name |
| Description | VARCHAR(500) | Step description |
| Duration | INT | Expected duration in seconds |
| Sequence | INT | Step sequence in production |
| MachineID | INT | Foreign Key to Machines |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last update timestamp |

### Machines
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| MachineID | INT | Primary Key |
| Name | VARCHAR(100) | Machine name |
| Type | VARCHAR(50) | Machine type |
| Status | VARCHAR(20) | Current status |
| LastMaintenance | DATETIME | Last maintenance date |
| NextMaintenance | DATETIME | Next scheduled maintenance |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last update timestamp |

### ProductionLogs
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| LogID | INT | Primary Key |
| OrderID | INT | Foreign Key to ProductionOrders |
| StepID | INT | Foreign Key to ProductionSteps |
| MachineID | INT | Foreign Key to Machines |
| StartTime | DATETIME | Start time |
| EndTime | DATETIME | End time |
| Status | VARCHAR(20) | Status (Completed, Failed, Aborted) |
| Notes | TEXT | Additional notes |
| CreatedAt | DATETIME | Creation timestamp |

### Anomalies
| Column Name | Data Type | Description |
|-------------|-----------|-------------|
| AnomalyID | INT | Primary Key |
| MachineID | INT | Foreign Key to Machines |
| Timestamp | DATETIME | Detection timestamp |
| Type | VARCHAR(50) | Anomaly type |
| Severity | INT | Severity level (1-5) |
| Description | TEXT | Description |
| Resolved | BOOLEAN | Resolution status |
| ResolvedAt | DATETIME | Resolution timestamp |
| CreatedAt | DATETIME | Creation timestamp |
| UpdatedAt | DATETIME | Last update timestamp |

## MongoDB (Sensor Data)

### sensor_readings
```json
{
  "_id": "ObjectId",
  "machine_id": "Integer",
  "timestamp": "ISODate",
  "readings": {
    "temperature": "Float",
    "pressure": "Float",
    "vibration": "Float",
    "rpm": "Float",
    "power_consumption": "Float"
  },
  "metadata": {
    "sensor_type": "String",
    "firmware_version": "String",
    "calibration_date": "ISODate"
  }
}
```

### machine_states
```json
{
  "_id": "ObjectId",
  "machine_id": "Integer",
  "timestamp": "ISODate",
  "state": "String",
  "uptime": "Integer",
  "cycle_count": "Integer",
  "current_order_id": "Integer",
  "current_step_id": "Integer",
  "predicted_maintenance": {
    "days_remaining": "Integer",
    "confidence": "Float",
    "components_at_risk": ["String"]
  }
}
```

## Relationships

1. **Products** to **ProductionOrders**: One-to-Many (One product can have many orders)
2. **Products** to **ProductionSteps**: One-to-Many (One product can have many production steps)
3. **Machines** to **ProductionSteps**: One-to-Many (One machine can be used in many production steps)
4. **ProductionOrders** to **ProductionLogs**: One-to-Many (One order can have many log entries)
5. **Machines** to **Anomalies**: One-to-Many (One machine can have many anomalies)
6. **SQL Database** to **MongoDB**: Related by machine_id and timestamps for comprehensive analytics 