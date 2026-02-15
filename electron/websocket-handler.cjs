const { WebSocketServer } = require('ws');

class WebSocketHandler {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.wss = new WebSocketServer({
      port: 4444,
    });

    this.wss.on('connection', (ws) => {
      this.sendToRenderer('ws:connection');
      
      ws.on('close', () => {
        this.sendToRenderer('ws:disconnection');
      });

      // Future: handle messages from clients if needed
      ws.on('message', () => {
        // Currently not used but can be implemented
      });
    });
  }

  sendToRenderer(channel, ...args) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  getClientCount() {
    return this.wss.clients.size;
  }

  sendToClients(data) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
      }
    });
  }

  sendToClientsAndWaitForResponse(data) {
    return new Promise((resolve) => {
      let responded = false;
      this.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(data));
          client.once('message', () => {
            if (!responded) {
              responded = true;
              resolve(true);
            }
          });
        }
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!responded) {
          resolve(false);
        }
      }, 5000);
    });
  }
}

module.exports = WebSocketHandler;
