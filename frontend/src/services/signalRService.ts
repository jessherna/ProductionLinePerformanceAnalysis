import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// The URL of the SignalR hub
const HUB_URL = 'http://localhost:5028/hubs/production';

export const connectSignalR = () => {
  // If we already have a connection, return it
  if (connection) {
    console.log(`Reusing existing SignalR connection (${connection.connectionId || 'no ID yet'})`);
    
    // If the connection is disconnected, try to reconnect
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      console.log('Connection is disconnected, attempting to start it');
      startConnection().catch(err => console.error('Error restarting connection:', err));
    }
    
    return connection;
  }

  console.log('Creating new SignalR connection');
  
  // Create a new connection with improved configuration
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling // Try WebSockets first, fall back to long polling
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 15000, 30000]) // More gradual reconnect attempts
    .configureLogging(signalR.LogLevel.Warning) // Increase logging level for better diagnostics
    .build();

  // Add connection lifecycle event handlers
  connection.onclose((error) => {
    console.log('SignalR Connection closed', error);
    // Don't reset connection on close - let automatic reconnect try to reconnect
    if (error) {
      console.error('SignalR connection closed with error:', error);
    }
  });

  connection.onreconnecting((error) => {
    console.log('SignalR Reconnecting', error);
  });

  connection.onreconnected((connectionId) => {
    console.log('SignalR Reconnected', connectionId);
    // Reset the connection attempts counter on successful reconnection
    connectionAttempts = 0;
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
  
  // If we're already trying to start the connection, wait for that promise
  if (startPromise) {
    try {
      await startPromise;
      return;
    } catch (err) {
      console.error('Error waiting for existing start promise:', err);
      // Continue with a new connection attempt
    }
  }
  
  try {
    // Create a new start promise
    startPromise = connection.start();
    await startPromise;
    
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
      
      // Don't stop the connection before retrying - just wait and try again
      setTimeout(() => {
        startPromise = null; // Clear the start promise
        startConnection();
      }, delay);
    } else {
      console.error(`Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts.`);
      resetConnection(); // Try a full reset after max attempts
    }
  } finally {
    // Clear the start promise if it was completed or rejected
    if (startPromise) {
      startPromise.catch(() => {}); // Handle any unhandled rejection
      startPromise = null;
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
        connection = null;
        startPromise = null;
        connectSignalR();
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