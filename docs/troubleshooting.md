# Troubleshooting Guide

## SignalR Connection Issues

If you're experiencing problems with SignalR connections, follow these steps to diagnose and fix the issue:

### 1. Check Server Status

First, ensure both backend services are running:
- C# API should be running on port 5028
- Python Analysis API should be running on port 5000

Run the startup script or start each service manually to verify they're running properly.

### 2. Browser Console Errors

Check your browser's developer console (F12) for specific error messages:
- Look for "SignalR Connection Error" messages
- Check for CORS-related errors which appear as "Access-Control-Allow-Origin" errors

### 3. Network Connectivity

Ensure connectivity between frontend and backend:
- Try accessing the backend API directly in your browser: http://localhost:5028/swagger
- Verify your firewall isn't blocking connections on ports 5028 and 5000
- Check if you're behind a corporate proxy that might block WebSocket connections

### 4. Quick Connection Test

The application now includes a ping feature for testing connectivity:
- Open the browser console
- Type `window.pingSignalRServer()` to manually trigger a ping test
- Look for "Received pong from server" in the console log

### 5. Configuration Issues

Check the following configuration items:
- CORS settings in Program.cs should include your frontend origin
- SignalR hub URL in signalRService.ts should match your backend address
- Connection transport types configured correctly (WebSockets preferred)

### 6. Common Solutions

Try these common fixes:
1. Restart both frontend and backend services
2. Clear browser cache and cookies
3. Try a different browser
4. Temporarily disable antivirus/firewall
5. Check for port conflicts using `netstat -ano | findstr 5028` (Windows) or `lsof -i :5028` (Linux/Mac)

### 7. Application-Specific Troubleshooting

If the above steps don't resolve the issue:
1. Try changing the transport type in signalRService.ts to fallback options
2. Check for any middleware in the backend that might interfere with SignalR
3. Verify the hub is registered correctly in Program.cs
4. Look for any custom authentication/authorization that might affect the connection

### 8. Last Resort Options

If nothing else works:
1. Try running everything on localhost without Docker if applicable
2. Simplify the application to isolate the issue
3. Create a minimal reproduction of the issue to better diagnose the problem 