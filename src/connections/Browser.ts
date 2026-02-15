import { writable } from "svelte/store";

declare global {
  interface Window {
    wsModule: {
      onConnection: (callback: () => void) => () => void;
      onDisconnection: (callback: () => void) => () => void;
      getClientCount: () => Promise<number>;
      sendToClients: (data: { type: string; userName?: string }) => void;
    };
  }
}

export const connectedBrowsersCount = writable<number>(0);

// Set up WebSocket event listeners
if (window.wsModule) {
  // Update count when clients connect
  window.wsModule.onConnection(() => {
    window.wsModule.getClientCount().then(count => {
      connectedBrowsersCount.set(count);
    });
  });

  // Update count when clients disconnect
  window.wsModule.onDisconnection(() => {
    window.wsModule.getClientCount().then(count => {
      connectedBrowsersCount.set(count);
    });
  });

  // Initialize count
  window.wsModule.getClientCount().then(count => {
    connectedBrowsersCount.set(count);
  });
}

export function openStream(userName: string) {
  return new Promise((resolve) => {
    if (window.wsModule) {
      window.wsModule.sendToClients({ type: 'openStream', userName });
      // Assume success after sending
      setTimeout(() => resolve(true), 100);
    } else {
      resolve(false);
    }
  });
}
