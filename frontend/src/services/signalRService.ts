import * as signalR from '@microsoft/signalr';

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;

export const connectSignalR = () => {
  if (connection) {
    return connection;
  }

  // Create a new connection
  connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5028/hubs/production', {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
    .configureLogging(signalR.LogLevel.Debug)
    .build();

  // Add connection lifecycle event handlers
  connection.onclose((error) => {
    console.log('SignalR Connection closed', error);
  });

  connection.onreconnecting((error) => {
    console.log('SignalR Reconnecting', error);
  });

  connection.onreconnected((connectionId) => {
    console.log('SignalR Reconnected', connectionId);
  });

  // Start the connection
  startConnection();

  return connection;
};

const startConnection = () => {
  if (!connection) return;
  
  if (!startPromise) {
    // Start the connection if it's not already starting
    startPromise = connection.start()
      .then(() => {
        console.log('SignalR Connected successfully');
        startPromise = null;
      })
      .catch(err => {
        console.error('SignalR Connection Error: ', err);
        startPromise = null;
        // Try to restart after a delay
        setTimeout(() => startConnection(), 5000);
      });
  }
  
  return startPromise;
};

export const getConnection = () => {
  if (!connection) {
    return connectSignalR();
  }
  
  // If the connection is not in the Connected state, make sure it's starting
  if (connection.state !== signalR.HubConnectionState.Connected && 
      connection.state !== signalR.HubConnectionState.Connecting && 
      connection.state !== signalR.HubConnectionState.Reconnecting) {
    startConnection();
  }
  
  return connection;
}; 