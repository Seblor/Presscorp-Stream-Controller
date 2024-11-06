import { writable } from "svelte/store";
import type { WebSocket, WebSocketServer } from "ws";

const { 'WebSocketServer': WSS } = require('ws')

export const connectedBrowsersCount = writable<number>(0);

const wss: WebSocketServer = new WSS({
  port: 4444,
});

wss.on('connection', (ws: WebSocket) => {
  connectedBrowsersCount.update((count) => count + 1);
  ws.on('close', () => {
    connectedBrowsersCount.update((count) => count - 1);
  });
});

export function openStream (userName: string) {
  return new Promise((resolve,) => {
    wss.clients.forEach((client) => {
      console.log('sending to client');
      client.send(JSON.stringify({ type: 'openStream', userName }));
      client.once('message', () => {
        resolve(true);
      });
    });
  })
}
