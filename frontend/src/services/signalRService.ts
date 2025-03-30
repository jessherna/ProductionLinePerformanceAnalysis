import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

export const connectSignalR = () => {
  // If we already have a connection, return it
  if (connection) {
    console.log(`Reusing existing SignalR connection (${connection.connectionId || 'no ID yet'})`);
    return connection;
  }

  console.log('Creating new SignalR connection');
  
  // Create a new connection with improved configuration
  connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5028/hubs/production', {
      // Remove skipNegotiation - this is often a source of connection issues
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000]) // More gradual reconnect attempts
    .configureLogging(signalR.LogLevel.Information) // Set to Information instead of Debug to reduce noise
    .build();

  // Keep track of registered event handlers to avoid duplicates
  const registeredHandlers = new Set();
  
  // Helper function to register handlers only once
  const registerHandler = (eventName, callback) => {
    if (!registeredHandlers.has(eventName)) {
      connection.on(eventName, callback);
      registeredHandlers.add(eventName);
      console.log(`Registered handler for "${eventName}" event`);
    }
  };

  // Add connection lifecycle event handlers
  connection.onclose((error) => {
    console.log('SignalR Connection closed', error);
    // Reset the connection on full close to allow for a clean restart
    connection = null;
    startPromise = null;
  });

  connection.onreconnecting((error) => {
    console.log('SignalR Reconnecting', error);
  });

  connection.onreconnected((connectionId) => {
    console.log('SignalR Reconnected', connectionId);
    // Reset the connection attempts counter on successful reconnection
    connectionAttempts = 0;
  });
  
  // Register event handlers for application events
  registerHandler('Pong', (response) => {
    console.log('Received pong from server:', response);
  });
  
  registerHandler('ConnectionEstablished', (data) => {
    console.log('Connection established with server:', data);
  });
  
  registerHandler('ReceiveProductionUpdate', (data) => {
    console.log('Production update received:', data);
  });
  
  registerHandler('ReceiveStatusChange', (status) => {
    console.log('Status change received:', status);
  });
  
  registerHandler('ReceiveAnomalyAlert', (alert) => {
    console.log('Anomaly alert received:', alert);
  });
  
  registerHandler('ReceiveErrorAlert', (error) => {
    console.log('Error alert received:', error);
  });

  // Start the connection
  startConnection();

  return connection;
};

export const startConnection = async (): Promise<void> => {
  if (!connection) {
    console.warn('Cannot start connection: SignalR connection not initialized');
    // Try to initialize the connection
    connectSignalR();
    return;
  }
  
  // Only try to start if in disconnected state
  if (connection.state !== signalR.HubConnectionState.Disconnected) {
    console.log(`Connection already in ${connection.state} state. Cannot start.`);
    return;
  }
  
  try {
    await connection.start();
    console.log('SignalR Connected!');
    connectionAttempts = 0; // Reset connection attempts on successful connection
    
    // Test the connection with ping
    pingServer();
  } catch (err) {
    console.error('SignalR Connection Error:', err);
    
    // Retry with backoff strategy
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      connectionAttempts++;
      const delay = Math.min(1000 * (2 ** connectionAttempts), 30000); // Exponential backoff with 30s cap
      console.log(`Connection attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}, retrying in ${delay}ms...`);
      
      // Clear any existing connection before retrying
      if (connection) {
        await connection.stop().catch(err => console.error("Error stopping connection during retry", err));
      }
      
      setTimeout(() => startConnection(), delay);
    } else {
      console.error(`Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts.`);
      resetConnection(); // Try a full reset after max attempts
    }
  }
};

export const getConnection = () => {
  if (!connection) {
    return connectSignalR();
  }
  
  // Check connection state and take appropriate action
  switch (connection.state) {
    case signalR.HubConnectionState.Connected:
      // Already connected, return connection
      return connection;
      
    case signalR.HubConnectionState.Connecting:
    case signalR.HubConnectionState.Reconnecting:
      // Connection is being established, just return it
      console.log(`Connection is currently ${connection.state}`);
      return connection;
      
    case signalR.HubConnectionState.Disconnected:
      // Try to restart the connection
      console.log('Connection is disconnected, attempting to start');
      startConnection().catch(err => console.error('Error starting connection:', err));
      return connection;
      
    case signalR.HubConnectionState.Disconnecting:
      // Wait for disconnection then restart
      console.log('Connection is currently disconnecting, will restart when done');
      connection.onclose(() => {
        console.log('Connection finished disconnecting, restarting');
        resetConnection();
      });
      return connection;
      
    default:
      return connection;
  }
};

// Explicitly handle failed connections by adding a method to reset
export const resetConnection = (): Promise<signalR.HubConnection> => {
  console.log('Reset connection requested');
  
  // Force clear any existing connection
  if (connection) {
    console.log('Stopping existing SignalR connection...');
    
    return connection.stop()
      .then(() => {
        console.log('SignalR connection stopped successfully');
      })
      .catch(err => {
        console.error("Error stopping connection", err);
      })
      .finally(() => {
        // Always clean up state regardless of success/failure
        connection = null;
        startPromise = null;
        connectionAttempts = 0;
        
        // Wait a moment before reconnecting to ensure clean state
        return new Promise(resolve => {
          console.log('Creating new SignalR connection after short delay...');
          setTimeout(() => {
            const newConnection = connectSignalR();
            resolve(newConnection);
          }, 1000);
        });
      });
  } else {
    console.log('No existing SignalR connection to reset');
    connection = null;
    startPromise = null;
    connectionAttempts = 0;
    
    // Return as promise for consistent API
    return Promise.resolve(connectSignalR());
  }
};

// Add ping functionality to test connection
export const pingServer = (): void => {
  try {
    // Get a fresh connection or use existing one
    const conn = getConnection();
    
    if (!conn) {
      console.warn('Cannot ping: SignalR connection initialization failed');
      return;
    }
    
    if (conn.state === signalR.HubConnectionState.Connected) {
      console.log('Sending ping to server...');
      conn.invoke('Ping')
        .then(response => {
          console.log('Ping sent successfully');
        })
        .catch(err => {
          console.error('Error sending ping:', err);
        });
    } else {
      console.warn(`Cannot ping: SignalR connection not in connected state (current state: ${conn.state})`);
      
      // Only try to reconnect if disconnected and not already connecting/reconnecting
      if (conn.state === signalR.HubConnectionState.Disconnected) {
        console.log('Connection disconnected, attempting to reconnect...');
        startConnection();
      }
    }
  } catch (error) {
    console.error('Ping operation failed with error:', error);
  }
}; 